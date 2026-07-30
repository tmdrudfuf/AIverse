import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

import { createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import { createExecutionReadinessId, type ExecutionReadiness, type ExecutionReadinessResult } from "../execution-readiness/ExecutionReadinessTypes";
import { createHumanExecutionApprovalId, type HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import {
  createRuntimePreflightId,
  type RuntimePreflight,
  type RuntimePreflightResult,
} from "../runtime-preflight/RuntimePreflightTypes";
import { RuntimeStartService } from "./RuntimeStartService";
import {
  createRuntimeStartCollection,
  createRuntimeStartId,
  type RuntimeStart,
} from "./RuntimeStartTypes";

describe("RuntimeStartService", () => {
  it("creates deterministic Runtime Start for current Ready preflight without starting agents or mutation", () => {
    const outcome = new RuntimeStartService().start(validInput());

    expect(outcome.runtimeStart).toMatchObject({
      runtimeStartId: createRuntimeStartId("daily-proof", createPlan().planId),
      projectId: "daily-proof",
      executionPlanId: createPlan().planId,
      executionReadinessResultId: createReadinessResult().id,
      humanExecutionApprovalId: createApproval().approvalId,
      runtimePreflightId: createPreflight().preflightId,
      executionApproved: true,
      runtimePreflightPassed: true,
      executionStarted: true,
      agentStarted: false,
      implementerStarted: false,
      reviewerStarted: false,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(outcome.result).toMatchObject({
      status: "Started",
      reasonCodes: ["STARTED"],
      started: true,
      duplicateExistingStart: false,
      executionStarted: true,
      agentStarted: false,
    });
    expect(outcome.startCollection?.startCount).toBe(1);
  });

  it("uses defensive copies for records, results, commands, and mutation scope", () => {
    const service = new RuntimeStartService();
    const outcome = service.start(validInput());
    outcome.runtimeStart!.validationCommands.push("git push");
    outcome.result.reasonCodes.push("RUNTIME_START_INTERNAL_FAILURE");

    const rerun = service.start(validInput());
    expect(rerun.runtimeStart?.validationCommands).toEqual(["npm test", "npx tsc --noEmit"]);
    expect(rerun.result.reasonCodes).toEqual(["STARTED"]);
  });

  it("returns AlreadyStarted only after current exact-context revalidation", () => {
    const service = new RuntimeStartService();
    const first = service.start(validInput());
    const second = service.start(validInput({
      existingStarts: createRuntimeStartCollection({
        projectId: "daily-proof",
        starts: [first.runtimeStart!],
        rulesVersion: "start-v1",
      }),
    }));

    expect(second.result.status).toBe("AlreadyStarted");
    expect(second.result.reasonCodes).toEqual(["ALREADY_STARTED"]);
    expect(second.startCollection?.startCount).toBe(1);
    expect(second.runtimeStart?.startedAt).toBe(first.runtimeStart?.startedAt);
  });

  it("does not return AlreadyStarted when current context changed", () => {
    const first = new RuntimeStartService().start(validInput());
    const changed = new RuntimeStartService().start(validInput({
      executionPlan: createPlan({ branchName: "codex/changed-branch" }),
      existingStarts: createRuntimeStartCollection({
        projectId: "daily-proof",
        starts: [first.runtimeStart!],
        rulesVersion: "start-v1",
      }),
    }));

    expect(changed.result.status).toBe("Blocked");
    expect(changed.result.reasonCodes).toContain("RUNTIME_START_EXISTING_RECORD_MISMATCH");
    expect(changed.runtimeStart).toBeUndefined();
  });

  it("blocks missing, blocked, failed, stale, and already-started preflight state", () => {
    const service = new RuntimeStartService();
    expect(service.start(validInput({ preflight: undefined, preflightResult: undefined })).result.reasonCodes)
      .toContain("RUNTIME_START_PREFLIGHT_MISSING");
    expect(service.start(validInput({
      preflight: createPreflight({ status: "Blocked", runtimePreflightPassed: false }),
      preflightResult: createPreflightResult({ status: "Blocked", runtimePreflightPassed: false }),
    })).result.reasonCodes).toContain("RUNTIME_START_PREFLIGHT_BLOCKED");
    expect(service.start(validInput({
      preflight: createPreflight({ status: "Failed", runtimePreflightPassed: false }),
      preflightResult: createPreflightResult({ status: "Failed", runtimePreflightPassed: false }),
    })).result.reasonCodes).toContain("RUNTIME_START_PREFLIGHT_FAILED");
    expect(service.start(validInput({
      preflight: createPreflight({ approvalId: "other-approval" }),
    })).result.reasonCodes).toContain("RUNTIME_START_PREFLIGHT_STALE");
    expect(service.start(validInput({
      preflight: createPreflight({ agentStarted: true as false }),
    })).result.reasonCodes).toContain("RUNTIME_START_AGENT_ALREADY_STARTED");
  });

  it("blocks plan, readiness, approval, actor, role, command, and mutation-scope mismatches", () => {
    const service = new RuntimeStartService();
    expect(service.start(validInput({ executionPlan: undefined })).result.reasonCodes).toContain("RUNTIME_START_PLAN_INVALID");
    expect(service.start(validInput({
      readinessResult: createReadinessResult({ status: "Blocked", blockedCheckCount: 1, reasonCodes: ["TASK_STATE_INCOMPATIBLE"] }),
    })).result.reasonCodes).toContain("RUNTIME_START_READINESS_NOT_READY");
    expect(service.start(validInput({ approval: undefined })).result.reasonCodes).toContain("RUNTIME_START_APPROVAL_MISSING");
    expect(service.start(validInput({ approval: createApproval({ approvedBy: "Codex" }) })).result.reasonCodes)
      .toContain("RUNTIME_START_INVALID_ACTOR");
    expect(service.start(validInput({ command: { startedBy: "automation" } })).result.reasonCodes)
      .toContain("RUNTIME_START_INVALID_ACTOR");
    expect(service.start(validInput({ approval: createApproval({ reviewerAgent: "Codex Reviewer" }) })).result.reasonCodes)
      .toContain("RUNTIME_START_ROLE_CONTEXT_MISMATCH");
    expect(service.start(validInput({ approval: createApproval({ validationCommands: ["npm test"] }) })).result.reasonCodes)
      .toContain("RUNTIME_START_VALIDATION_COMMANDS_MISMATCH");
    expect(service.start(validInput({ approval: createApproval({ allowedMutationScope: ["remote"] }) })).result.reasonCodes)
      .toContain("RUNTIME_START_MUTATION_SCOPE_MISMATCH");
  });

  it("keeps blocked and failed commands atomic without creating Runtime Start records", () => {
    const blocked = new RuntimeStartService().start(validInput({
      preflight: createPreflight({ status: "Blocked", runtimePreflightPassed: false }),
      preflightResult: createPreflightResult({ status: "Blocked", runtimePreflightPassed: false }),
    }));
    const failed = new RuntimeStartService().start(validInput({ command: { executionPlanId: "" } }));

    expect(blocked.runtimeStart).toBeUndefined();
    expect(blocked.startCollection).toBeUndefined();
    expect(blocked.result.started).toBe(false);
    expect(blocked.result.executionStarted).toBe(false);
    expect(failed.result.status).toBe("Failed");
    expect(failed.runtimeStart).toBeUndefined();
  });

  it("isolates projects even when raw identifiers match", () => {
    const plan = createPlan({ projectId: "other-project" });
    const outcome = new RuntimeStartService().start(validInput({ executionPlan: plan }));

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("RUNTIME_START_PLAN_INVALID");
  });

  it("does not import subprocess, Git, GitHub, filesystem, or agent runtime APIs", () => {
    const source = readFileSync(new URL("./RuntimeStartService.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from "node:|child_process|spawn\(|execSync|fs\.|existsSync|readFileSync|writeFileSync|gh\s+|git\s+push/);
  });
});

function validInput(overrides: {
  command?: Partial<ReturnType<typeof createCommand>>;
  executionPlan?: ExecutionPlan;
  readiness?: ExecutionReadiness;
  readinessResult?: ExecutionReadinessResult;
  approval?: HumanExecutionApproval;
  preflight?: RuntimePreflight;
  preflightResult?: RuntimePreflightResult;
  existingStarts?: ReturnType<typeof createRuntimeStartCollection>;
} = {}) {
  const executionPlan = "executionPlan" in overrides ? overrides.executionPlan : createPlan();
  const readiness = "readiness" in overrides ? overrides.readiness : createReadiness({ executionPlanId: executionPlan?.planId });
  const readinessResult = "readinessResult" in overrides
    ? overrides.readinessResult
    : createReadinessResult({ executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId });
  const approval = "approval" in overrides
    ? overrides.approval
    : createApproval({ executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId });
  const preflight = "preflight" in overrides
    ? overrides.preflight
    : createPreflight({ executionPlanId: executionPlan?.planId, readinessId: readiness?.readinessId, approvalId: approval?.approvalId });
  const preflightResult = "preflightResult" in overrides
    ? overrides.preflightResult
    : createPreflightResult({ executionPlanId: executionPlan?.planId, preflightId: preflight?.preflightId, readinessId: readiness?.readinessId, approvalId: approval?.approvalId });
  return {
    command: {
      ...createCommand(executionPlan?.planId, preflight?.preflightId),
      ...overrides.command,
    },
    executionPlan,
    readiness,
    readinessResult,
    approval,
    preflight,
    preflightResult,
    existingStarts: overrides.existingStarts,
  };
}

function createCommand(executionPlanId = createPlan().planId, runtimePreflightId = createPreflight().preflightId) {
  return {
    projectId: "daily-proof",
    executionPlanId,
    runtimePreflightId,
    startedBy: "Local Human",
    requestedAt: "2026-01-09T00:00:00.000Z",
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
    worktreePath: "C:/repo-spec",
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
    approvedAt: "2026-01-08T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: "approval-v1",
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflight(overrides: Partial<RuntimePreflight> = {}): RuntimePreflight {
  const plan = createPlan();
  const preflightId = createRuntimePreflightId("daily-proof", plan.planId);
  return {
    preflightId,
    projectId: "daily-proof",
    executionPlanId: plan.planId,
    readinessId: createExecutionReadinessId("daily-proof", plan.planId),
    approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId),
    activeSessionId: "session-1",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    employeeId: "employee-1",
    repositoryId: "repo-1",
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-01-08T00:00:00.000Z",
    rulesVersion: "preflight-v1",
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflightResult(overrides: Partial<RuntimePreflightResult> = {}): RuntimePreflightResult {
  const plan = createPlan();
  return {
    id: `daily-proof:runtime-preflight-result:${plan.planId}:preflight-v1`,
    projectId: "daily-proof",
    executionPlanId: plan.planId,
    preflightId: createRuntimePreflightId("daily-proof", plan.planId),
    approvalId: createHumanExecutionApprovalId("daily-proof", plan.planId),
    readinessId: createExecutionReadinessId("daily-proof", plan.planId),
    status: "Ready",
    reasonCodes: ["READY"],
    primaryReason: "READY",
    passedCheckCount: 14,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    runtimePreflightPassed: true,
    executionApproved: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-01-08T00:00:00.000Z",
    rulesVersion: "preflight-v1",
    ...overrides,
  };
}
