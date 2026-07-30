import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import { createExecutionReadinessId, type ExecutionReadiness, type ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import { createHumanExecutionApprovalId, type HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import { RuntimePreflightService } from "./RuntimePreflightService";
import {
  createRuntimePreflightCollection,
  createRuntimePreflightId,
  type RuntimePreflightEvidence,
} from "./RuntimePreflightTypes";

describe("RuntimePreflightService", () => {
  it("returns Ready for a current approved context and safe runtime evidence", () => {
    const outcome = new RuntimePreflightService().runPreflight(validInput());

    expect(outcome.preflight).toMatchObject({
      preflightId: createRuntimePreflightId("daily-proof", createPlan().planId),
      status: "Ready",
      executionApproved: true,
      runtimePreflightPassed: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.preflight.checks).toHaveLength(14);
    expect(new Set(outcome.preflight.checks.map((check) => check.checkId)).size).toBe(14);
    expect(outcome.result).toMatchObject({
      status: "Ready",
      reasonCodes: ["READY"],
      passedCheckCount: 14,
      blockedCheckCount: 0,
      failedCheckCount: 0,
      runtimePreflightPassed: true,
      executionStarted: false,
    });
  });

  it("uses deterministic identity and defensive copies", () => {
    const evidence = createEvidence();
    const outcome = new RuntimePreflightService().runPreflight(validInput({ evidence }));
    evidence.validationCommands.commands.push("git push");
    outcome.preflight.checks[0]!.message = "mutated by caller";

    const rerun = new RuntimePreflightService().runPreflight(validInput());
    expect(rerun.preflight.preflightId).toBe(outcome.preflight.preflightId);
    expect(rerun.result.id).toBe(outcome.result.id);
    expect(rerun.preflight.checks[0]!.message).not.toBe("mutated by caller");
    expect(rerun.result.reasonCodes).toEqual(["READY"]);
  });

  it("replaces the latest active preflight state instead of creating duplicates", () => {
    const service = new RuntimePreflightService();
    const first = service.runPreflight(validInput());
    const second = service.runPreflight(validInput({
      existingPreflights: createRuntimePreflightCollection({
        projectId: "daily-proof",
        preflights: [first.preflight],
        rulesVersion: "preflight-v1",
      }),
    }));

    expect(second.preflightCollection?.preflightCount).toBe(1);
    expect(second.preflightCollection?.preflights[0]?.preflightId).toBe(first.preflight.preflightId);
  });

  it("blocks when approval is missing, stale, non-human, or already started", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ approval: undefined })).result.reasonCodes).toContain("APPROVAL_MISSING");
    expect(service.runPreflight(validInput({ approval: createApproval({ executionPlanId: "other-plan" }) })).result.reasonCodes)
      .toContain("APPROVAL_PLAN_MISMATCH");
    expect(service.runPreflight(validInput({ approval: createApproval({ approvedBy: "Codex" }) })).result.reasonCodes)
      .toContain("APPROVER_NOT_HUMAN");
    expect(service.runPreflight(validInput({ approval: createApproval({ agentStarted: true as false }) })).result.reasonCodes)
      .toContain("APPROVAL_ALREADY_STARTED");
  });

  it("blocks when role context, validation commands, mutation scope, or explicit plan id mismatches", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({
      approval: createApproval({ reviewerAgent: "Codex Reviewer" }),
    })).result.reasonCodes).toContain("APPROVAL_ROLE_CONTEXT_MISMATCH");
    expect(service.runPreflight(validInput({
      approval: createApproval({ validationCommands: ["npm test", "npm run build"] }),
    })).result.reasonCodes).toContain("APPROVAL_ROLE_CONTEXT_MISMATCH");
    expect(service.runPreflight(validInput({
      approval: createApproval({ allowedMutationScope: ["local-worktree-only"] }),
    })).result.reasonCodes).toContain("APPROVAL_ROLE_CONTEXT_MISMATCH");
    expect(service.runPreflight(validInput({
      approval: createApproval({ executionPlanId: "stale-plan" }),
    })).result.reasonCodes).toContain("APPROVAL_PLAN_MISMATCH");
  });

  it("blocks missing or non-ready readiness before runtime provider success matters", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ readiness: undefined })).result.reasonCodes).toContain("READINESS_MISSING");
    const blocked = service.runPreflight(validInput({
      readiness: createReadiness({ status: "Blocked" }),
      readinessResult: createReadinessResult({ status: "Blocked", blockedCheckCount: 1, reasonCodes: ["TASK_STATE_INCOMPATIBLE"] }),
      evidence: createEvidence({ runtimeEnvironment: { providerFailed: true } }),
    }));
    expect(blocked.result.reasonCodes).toContain("READINESS_NOT_READY");
    expect(blocked.result.reasonCodes).not.toContain("RUNTIME_PROVIDER_FAILED");
    expect(blocked.preflight.checks).toHaveLength(3);
  });

  it("blocks stale execution plans and represented runtime flags", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ executionPlan: undefined })).result.reasonCodes).toContain("EXECUTION_PLAN_MISSING");
    expect(service.runPreflight(validInput({ executionPlan: createPlan({ planId: "stale-plan" }) })).result.reasonCodes)
      .toContain("EXECUTION_PLAN_STALE");
    expect(service.runPreflight(validInput({ executionPlan: createPlan({ repositoryMutationStarted: true as false }) })).result.reasonCodes)
      .toContain("APPROVAL_ALREADY_STARTED");
  });

  it("validates repository, project ownership, worktree, branch, and clean tree evidence", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ evidence: createEvidence({ repository: { pathExists: false } }) })).result.reasonCodes)
      .toContain("REPOSITORY_PATH_MISSING");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ repository: { projectId: "other-project" } }) })).result.reasonCodes)
      .toContain("FOREIGN_PROJECT_REPOSITORY");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ worktree: { isPrimaryWorktree: true } }) })).result.reasonCodes)
      .toContain("PRIMARY_WORKTREE_NOT_ALLOWED");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ branch: { currentBranch: "main" } }) })).result.reasonCodes)
      .toContain("BRANCH_MISMATCH");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ workingTree: { stagedChanges: true, clean: false } }) })).result.reasonCodes)
      .toContain("WORKING_TREE_DIRTY");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ workingTree: { mergeState: true } }) })).result.reasonCodes)
      .toContain("MERGE_STATE_DETECTED");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ workingTree: { rebaseState: true } }) })).result.reasonCodes)
      .toContain("REBASE_STATE_DETECTED");
  });

  it("validates specification path boundaries and required artifacts", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ evidence: createEvidence({ specification: { pathExists: false } }) })).result.reasonCodes)
      .toContain("SPEC_PATH_MISSING");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ specification: { insideWorktree: false } }) })).result.reasonCodes)
      .toContain("SPEC_PATH_OUTSIDE_REPOSITORY");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ specification: { featureMatches: false } }) })).result.reasonCodes)
      .toContain("SPEC_FEATURE_MISMATCH");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ specification: { requiredArtifactsPresent: false } }) })).result.reasonCodes)
      .toContain("SPEC_ARTIFACT_MISSING");
  });

  it("validates agent availability, timeout, non-zero detection, and command safety", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ evidence: createEvidence({ implementer: { available: false } }) })).result.reasonCodes)
      .toContain("IMPLEMENTER_UNAVAILABLE");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ reviewer: { available: false } }) })).result.reasonCodes)
      .toContain("REVIEWER_UNAVAILABLE");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ implementer: { detectionTimedOut: true } }) })).result.reasonCodes)
      .toContain("AGENT_DETECTION_TIMEOUT");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ reviewer: { detectionExitCode: 1 } }) })).result.reasonCodes)
      .toContain("AGENT_DETECTION_FAILED");
    expect(service.runPreflight(validInput({
      evidence: createEvidence({ implementer: { commandSafe: false, configuredCommand: "git", configuredArguments: ["push"] } }),
    })).result.reasonCodes).toContain("UNSAFE_AGENT_COMMAND");
  });

  it("rejects unsafe validation commands before any command execution", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ evidence: createEvidence({ validationCommands: { commands: [] } }) })).result.reasonCodes)
      .toContain("VALIDATION_COMMANDS_MISSING");
    expect(service.runPreflight(validInput({
      evidence: createEvidence({ validationCommands: { commands: ["npx tsc --noEmit", "npm test"] } }),
    })).result.reasonCodes).toContain("VALIDATION_COMMANDS_CHANGED");
    expect(service.runPreflight(validInput({
      evidence: createEvidence({ validationCommands: { commands: ["git push"], commandsSafe: false } }),
    })).result.reasonCodes).toContain("VALIDATION_COMMANDS_CHANGED");
  });

  it("rejects unsafe or broadened mutation scope", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput({ evidence: createEvidence({ mutationScope: { scope: [] } }) })).result.reasonCodes)
      .toContain("MUTATION_SCOPE_MISSING");
    expect(service.runPreflight(validInput({ evidence: createEvidence({ mutationScope: { scope: ["remote-mutation"] } }) })).result.reasonCodes)
      .toContain("MUTATION_SCOPE_CHANGED");
    expect(service.runPreflight(validInput({
      evidence: createEvidence({ mutationScope: { scope: createPlan().allowedMutationScope, scopeSafe: false } }),
    })).result.reasonCodes).toContain("UNSAFE_MUTATION_SCOPE");
  });

  it("maps provider failures to Failed without partial runtime state", () => {
    const outcome = new RuntimePreflightService().runPreflight(validInput({
      evidence: createEvidence({ runtimeEnvironment: { providerFailed: true } }),
    }));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.result.reasonCodes).toContain("RUNTIME_PROVIDER_FAILED");
    expect(outcome.result.runtimePreflightPassed).toBe(false);
    expect(outcome.result.executionStarted).toBe(false);
  });

  it("revalidates current runtime evidence on repeated calls so previous Ready can become Blocked", () => {
    const service = new RuntimePreflightService();
    expect(service.runPreflight(validInput()).result.status).toBe("Ready");
    const dirty = service.runPreflight(validInput({ evidence: createEvidence({ workingTree: { clean: false, unstagedChanges: true } }) }));

    expect(dirty.result.status).toBe("Blocked");
    expect(dirty.result.reasonCodes).toContain("WORKING_TREE_DIRTY");
  });

  it("does not import subprocess, GitHub, or execution runtime APIs", () => {
    const source = readFileSync(new URL("./RuntimePreflightService.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from "node:|child_process|spawn\(|execSync|fs\.|existsSync|readFileSync|writeFileSync/);
  });
});

function validInput(overrides: {
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  evidence?: RuntimePreflightEvidence;
  existingPreflights?: ReturnType<typeof createRuntimePreflightCollection>;
} = {}) {
  const executionPlan = "executionPlan" in overrides ? overrides.executionPlan : createPlan();
  const readiness = "readiness" in overrides ? overrides.readiness : createReadiness({ executionPlanId: executionPlan?.planId });
  const readinessResult = "readinessResult" in overrides
    ? overrides.readinessResult
    : createReadinessResult({ executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId });
  const approval = "approval" in overrides
    ? overrides.approval
    : createApproval({ executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId });
  return {
    command: {
      projectId: "daily-proof",
      executionPlanId: executionPlan?.planId ?? "plan-1",
      approvalId: approval?.approvalId ?? createHumanExecutionApprovalId("daily-proof", executionPlan?.planId ?? "plan-1"),
      evaluatedAt: "2026-01-08T00:00:00.000Z",
    },
    executionPlan,
    readiness,
    readinessResult,
    approval,
    evidence: overrides.evidence ?? createEvidence(),
    existingPreflights: overrides.existingPreflights,
  };
}

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const projectId = overrides.projectId ?? "daily-proof";
  const activeSessionId = overrides.activeSessionId ?? "session-1";
  return {
    planId: createExecutionPlanId(projectId, activeSessionId),
    projectId,
    featureId: "070-execution-plan-foundation",
    projectTaskId: "task-1",
    candidateTaskId: "candidate-1",
    recommendationId: "recommendation-1",
    promotionDecisionId: "promotion-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/repo",
    branchName: "codex/070-execution-plan-foundation",
    specPath: "specs/070-execution-plan-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-worktree-only", "no-github-mutation"],
    createdAt: "2026-01-06T00:00:00.000Z",
    rulesVersion: "plan-v1",
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadiness(overrides: Partial<ExecutionReadiness> = {}): ExecutionReadiness {
  const projectId = overrides.projectId ?? "daily-proof";
  const executionPlanId = overrides.executionPlanId ?? createPlan({ projectId }).planId;
  return {
    readinessId: createExecutionReadinessId(projectId, executionPlanId),
    projectId,
    executionPlanId,
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadinessResult(overrides: Partial<ExecutionReadinessResult> = {}): ExecutionReadinessResult {
  const projectId = overrides.projectId ?? "daily-proof";
  const executionPlanId = overrides.executionPlanId ?? createPlan({ projectId }).planId;
  return {
    id: `${projectId}:execution-readiness-result:${executionPlanId}:readiness-v1`,
    projectId,
    executionPlanId,
    readinessId: createExecutionReadinessId(projectId, executionPlanId),
    status: "Ready",
    reasonCodes: ["READY"],
    primaryReason: "READY",
    passedCheckCount: 10,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-01-07T00:00:00.000Z",
    rulesVersion: "readiness-v1",
    ...overrides,
  };
}

function createApproval(overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
  const plan = createPlan();
  return {
    approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId),
    projectId: "daily-proof",
    executionPlanId: plan.planId,
    readinessId: createExecutionReadinessId("daily-proof", plan.planId),
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-worktree-only", "no-github-mutation"],
    decision: "Approved",
    executionApproved: true,
    approvedAt: "2026-01-07T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: "approval-v1",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createEvidence(overrides: {
  repository?: Partial<RuntimePreflightEvidence["repository"]>;
  worktree?: Partial<RuntimePreflightEvidence["worktree"]>;
  branch?: Partial<RuntimePreflightEvidence["branch"]>;
  workingTree?: Partial<RuntimePreflightEvidence["workingTree"]>;
  specification?: Partial<RuntimePreflightEvidence["specification"]>;
  implementer?: Partial<RuntimePreflightEvidence["implementer"]>;
  reviewer?: Partial<RuntimePreflightEvidence["reviewer"]>;
  validationCommands?: Partial<RuntimePreflightEvidence["validationCommands"]>;
  mutationScope?: Partial<RuntimePreflightEvidence["mutationScope"]>;
  runtimeEnvironment?: Partial<RuntimePreflightEvidence["runtimeEnvironment"]>;
} = {}): RuntimePreflightEvidence {
  const plan = createPlan();
  return {
    repository: {
      projectId: plan.projectId,
      repositoryId: plan.repositoryId,
      pathExists: true,
      isDirectory: true,
      isGitRepository: true,
      normalizedPath: plan.repositoryPath,
      ...overrides.repository,
    },
    worktree: {
      pathExists: true,
      isDirectory: true,
      isGitWorktree: true,
      normalizedPath: plan.worktreePath,
      isPrimaryWorktree: false,
      ...overrides.worktree,
    },
    branch: {
      currentBranch: plan.branchName,
      detached: false,
      ...overrides.branch,
    },
    workingTree: {
      clean: true,
      stagedChanges: false,
      unstagedChanges: false,
      untrackedFiles: false,
      mergeState: false,
      rebaseState: false,
      conflicts: false,
      ...overrides.workingTree,
    },
    specification: {
      pathExists: true,
      normalizedPath: plan.specPath,
      insideWorktree: true,
      featureMatches: true,
      requiredArtifactsPresent: true,
      ...overrides.specification,
    },
    implementer: {
      role: "Implementer",
      agentLabel: plan.implementerAgent,
      configuredCommand: "codex",
      configuredArguments: ["--version"],
      available: true,
      commandSafe: true,
      detectionExitCode: 0,
      ...overrides.implementer,
    },
    reviewer: {
      role: "Reviewer",
      agentLabel: plan.reviewerAgent,
      configuredCommand: "claude",
      configuredArguments: ["--version"],
      available: true,
      commandSafe: true,
      detectionExitCode: 0,
      ...overrides.reviewer,
    },
    validationCommands: {
      commands: [...plan.validationCommands],
      commandsSafe: true,
      ...overrides.validationCommands,
    },
    mutationScope: {
      scope: [...plan.allowedMutationScope],
      scopeSafe: true,
      ...overrides.mutationScope,
    },
    runtimeEnvironment: {
      supported: true,
      spawnAvailable: true,
      safeWorkingDirectory: true,
      ...overrides.runtimeEnvironment,
    },
  };
}
