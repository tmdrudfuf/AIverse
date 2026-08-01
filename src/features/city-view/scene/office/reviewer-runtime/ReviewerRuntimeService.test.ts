import { describe, expect, it, vi } from "vitest";

import { EXECUTION_PLAN_RULES_VERSION, createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import {
  EXECUTION_READINESS_RULES_VERSION,
  createExecutionReadinessId,
  createExecutionReadinessResultId,
  type ExecutionReadiness,
  type ExecutionReadinessResult,
} from "../execution-readiness/ExecutionReadinessTypes";
import { HUMAN_EXECUTION_APPROVAL_RULES_VERSION, type HumanExecutionApproval } from "../human-execution-approvals/HumanExecutionApprovalTypes";
import {
  IMPLEMENTER_RUNTIME_RULES_VERSION,
  createImplementerRuntimeId,
  createImplementerRuntimeResultId,
  type ImplementerRuntime,
  type ImplementerRuntimeResult,
} from "../implementer-runtime/ImplementerRuntimeTypes";
import {
  RUNTIME_PREFLIGHT_RULES_VERSION,
  createRuntimePreflightId,
  createRuntimePreflightResultId,
  type RuntimePreflight,
  type RuntimePreflightResult,
} from "../runtime-preflight/RuntimePreflightTypes";
import {
  RUNTIME_START_RULES_VERSION,
  createRuntimeStartId,
  createRuntimeStartResultId,
  type RuntimeStart,
  type RuntimeStartResult,
} from "../runtime-start/RuntimeStartTypes";
import { createReviewTargetId, type ReviewTarget } from "./ReviewTarget";
import { ReviewerRuntimeService } from "./ReviewerRuntimeService";
import type { ReviewerRuntimeProvider, ReviewerRuntimeProviderCommand, ReviewerRuntimeProviderResult } from "./ReviewerRuntimeProvider";
import type { ReviewerRuntimeCommand, ReviewerRuntimeInput } from "./ReviewerRuntimeTypes";

const PROJECT_ID = "daily-proof";
const ACTIVE_SESSION_ID = "session-1";

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const planId = createExecutionPlanId(PROJECT_ID, ACTIVE_SESSION_ID);
  return {
    planId,
    projectId: PROJECT_ID,
    featureId: "076-codex-reviewer-runtime-foundation",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: ACTIVE_SESSION_ID,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/worktrees/076",
    branchName: "codex/076-codex-reviewer-runtime-foundation",
    specPath: "specs/076-codex-reviewer-runtime-foundation/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-worktree-only"],
    createdAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: EXECUTION_PLAN_RULES_VERSION,
    executionStarted: false,
    runtimeStarted: false,
    subprocessStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadiness(plan: ExecutionPlan, overrides: Partial<ExecutionReadiness> = {}): ExecutionReadiness {
  return {
    readinessId: createExecutionReadinessId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createReadinessResult(readiness: ExecutionReadiness, overrides: Partial<ExecutionReadinessResult> = {}): ExecutionReadinessResult {
  return {
    id: createExecutionReadinessResultId(readiness.projectId, readiness.executionPlanId),
    projectId: readiness.projectId,
    executionPlanId: readiness.executionPlanId,
    readinessId: readiness.readinessId,
    status: "Ready",
    reasonCodes: ["READY"],
    passedCheckCount: 10,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    executionApproved: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: EXECUTION_READINESS_RULES_VERSION,
    ...overrides,
  };
}

function createApproval(plan: ExecutionPlan, readiness: ExecutionReadiness, overrides: Partial<HumanExecutionApproval> = {}): HumanExecutionApproval {
  return {
    approvalId: `${plan.projectId}:approval:${plan.planId}:${HUMAN_EXECUTION_APPROVAL_RULES_VERSION}`,
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    readinessId: readiness.readinessId,
    activeSessionId: plan.activeSessionId,
    projectTaskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    implementerAgent: plan.implementerAgent,
    reviewerAgent: plan.reviewerAgent,
    validationCommands: [...plan.validationCommands],
    allowedMutationScope: [...plan.allowedMutationScope],
    decision: "Approved",
    executionApproved: true,
    approvedAt: "2026-07-31T00:00:00.000Z",
    approvedBy: "Local Human",
    rulesVersion: HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflight(plan: ExecutionPlan, approval: HumanExecutionApproval, readiness: ExecutionReadiness, overrides: Partial<RuntimePreflight> = {}): RuntimePreflight {
  return {
    preflightId: createRuntimePreflightId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    readinessId: readiness.readinessId,
    approvalId: approval.approvalId,
    activeSessionId: plan.activeSessionId,
    projectTaskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    status: "Ready",
    checks: [],
    evaluatedAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createPreflightResult(preflight: RuntimePreflight, overrides: Partial<RuntimePreflightResult> = {}): RuntimePreflightResult {
  return {
    id: createRuntimePreflightResultId(preflight.projectId, preflight.executionPlanId),
    projectId: preflight.projectId,
    executionPlanId: preflight.executionPlanId,
    preflightId: preflight.preflightId,
    approvalId: preflight.approvalId,
    readinessId: preflight.readinessId,
    status: "Ready",
    reasonCodes: ["READY"],
    passedCheckCount: 10,
    blockedCheckCount: 0,
    failedCheckCount: 0,
    runtimePreflightPassed: true,
    executionApproved: true,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evaluatedAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: RUNTIME_PREFLIGHT_RULES_VERSION,
    ...overrides,
  };
}

function createRuntimeStart(plan: ExecutionPlan, approval: HumanExecutionApproval, preflight: RuntimePreflight, overrides: Partial<RuntimeStart> = {}): RuntimeStart {
  return {
    runtimeStartId: createRuntimeStartId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    executionReadinessResultId: "readiness-result-1",
    humanExecutionApprovalId: approval.approvalId,
    runtimePreflightId: preflight.preflightId,
    taskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    activeSessionId: plan.activeSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
    repositoryRoot: plan.repositoryPath,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    validationCommands: [...plan.validationCommands],
    mutationScope: [...plan.allowedMutationScope],
    startedBy: "Local Human",
    startedAt: "2026-07-31T00:00:00.000Z",
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: RUNTIME_START_RULES_VERSION,
    ...overrides,
  };
}

function createRuntimeStartResult(runtimeStart: RuntimeStart, overrides: Partial<RuntimeStartResult> = {}): RuntimeStartResult {
  return {
    id: createRuntimeStartResultId(runtimeStart.projectId, runtimeStart.executionPlanId),
    projectId: runtimeStart.projectId,
    executionPlanId: runtimeStart.executionPlanId,
    runtimeStartId: runtimeStart.runtimeStartId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    approvalId: runtimeStart.humanExecutionApprovalId,
    status: "Started",
    reasonCodes: ["STARTED"],
    started: true,
    duplicateExistingStart: false,
    executionApproved: true,
    runtimePreflightPassed: true,
    executionStarted: true,
    agentStarted: false,
    implementerStarted: false,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-07-31T00:00:00.000Z",
    rulesVersion: RUNTIME_START_RULES_VERSION,
    ...overrides,
  };
}

function createImplementerRuntime(runtimeStart: RuntimeStart, overrides: Partial<ImplementerRuntime> = {}): ImplementerRuntime {
  return {
    implementerRuntimeId: createImplementerRuntimeId(runtimeStart.projectId, runtimeStart.runtimeStartId),
    projectId: runtimeStart.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    executionPlanId: runtimeStart.executionPlanId,
    humanExecutionApprovalId: runtimeStart.humanExecutionApprovalId,
    runtimePreflightId: runtimeStart.runtimePreflightId,
    taskId: runtimeStart.taskId,
    confirmedAssignmentId: runtimeStart.confirmedAssignmentId,
    preparedSessionId: runtimeStart.preparedSessionId,
    activeSessionId: runtimeStart.activeSessionId,
    employeeId: runtimeStart.employeeId,
    repositoryId: runtimeStart.repositoryId,
    worktreePath: runtimeStart.worktreePath,
    branch: runtimeStart.branch,
    specificationPath: runtimeStart.specificationPath,
    implementer: runtimeStart.implementer,
    reviewer: runtimeStart.reviewer,
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    promptId: `${runtimeStart.projectId}:implementer-prompt:${runtimeStart.runtimeStartId}:${IMPLEMENTER_RUNTIME_RULES_VERSION}`,
    status: "Completed",
    startedBy: "Local Human",
    startedAt: "2026-07-31T00:01:00.000Z",
    executionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: {
      providerId: "claude",
      agentId: "Claude",
      role: "Implementer",
      commandDisplay: "claude --dangerously-skip-permissions -p ...",
      workingDirectory: runtimeStart.worktreePath,
      started: true,
      completed: true,
      timedOut: false,
      cancelled: false,
      exitCode: 0,
      durationMs: 10,
      stdoutSummary: "ok",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    ...overrides,
  };
}

function createImplementerRuntimeResult(implementerRuntime: ImplementerRuntime, overrides: Partial<ImplementerRuntimeResult> = {}): ImplementerRuntimeResult {
  return {
    id: createImplementerRuntimeResultId(implementerRuntime.projectId, implementerRuntime.runtimeStartId),
    projectId: implementerRuntime.projectId,
    runtimeStartId: implementerRuntime.runtimeStartId,
    executionPlanId: implementerRuntime.executionPlanId,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    status: "Completed",
    reasonCodes: ["IMPLEMENTER_RUNTIME_STARTED"],
    started: true,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-07-31T00:01:00.000Z",
    rulesVersion: IMPLEMENTER_RUNTIME_RULES_VERSION,
    ...overrides,
  };
}

function createReviewTarget(plan: ExecutionPlan, runtimeStart: RuntimeStart, implementerRuntime: ImplementerRuntime, overrides: Partial<ReviewTarget> = {}): ReviewTarget {
  const reviewTargetSha = "a".repeat(40);
  return {
    reviewTargetId: createReviewTargetId(plan.projectId, runtimeStart.runtimeStartId, reviewTargetSha),
    projectId: plan.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    repositoryId: plan.repositoryId,
    worktreePath: plan.worktreePath,
    baseBranch: "main",
    baseSha: "b".repeat(40),
    featureBranch: plan.branchName,
    reviewTargetSha,
    mergeBaseSha: "b".repeat(40),
    workingTreeState: "Clean",
    changedFiles: ["src/example.ts"],
    specificationPath: plan.specPath,
    resolvedAt: implementerRuntime.startedAt,
    rulesVersion: "review-target-v1",
    ...overrides,
  };
}

function createValidChain() {
  const plan = createPlan();
  const readiness = createReadiness(plan);
  const readinessResult = createReadinessResult(readiness);
  const approval = createApproval(plan, readiness);
  const preflight = createPreflight(plan, approval, readiness);
  const preflightResult = createPreflightResult(preflight);
  const runtimeStart = createRuntimeStart(plan, approval, preflight);
  const runtimeStartResult = createRuntimeStartResult(runtimeStart);
  const implementerRuntime = createImplementerRuntime(runtimeStart);
  const implementerRuntimeResult = createImplementerRuntimeResult(implementerRuntime);
  const reviewTarget = createReviewTarget(plan, runtimeStart, implementerRuntime);
  return {
    plan,
    readiness,
    readinessResult,
    approval,
    preflight,
    preflightResult,
    runtimeStart,
    runtimeStartResult,
    implementerRuntime,
    implementerRuntimeResult,
    reviewTarget,
  };
}

function createCommand(chain: ReturnType<typeof createValidChain>, overrides: Partial<ReviewerRuntimeCommand> = {}): ReviewerRuntimeCommand {
  return {
    projectId: chain.runtimeStart.projectId,
    runtimeStartId: chain.runtimeStart.runtimeStartId,
    executionPlanId: chain.runtimeStart.executionPlanId,
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    startedBy: "Local Human",
    requestedAt: "2026-07-31T00:02:00.000Z",
    ...overrides,
  };
}

function createInput(chain: ReturnType<typeof createValidChain>, commandOverrides: Partial<ReviewerRuntimeCommand> = {}): ReviewerRuntimeInput {
  return {
    command: createCommand(chain, commandOverrides),
    executionPlan: chain.plan,
    readiness: chain.readiness,
    readinessResult: chain.readinessResult,
    approval: chain.approval,
    preflight: chain.preflight,
    preflightResult: chain.preflightResult,
    runtimeStart: chain.runtimeStart,
    runtimeStartResult: chain.runtimeStartResult,
    implementerRuntime: chain.implementerRuntime,
    implementerRuntimeResult: chain.implementerRuntimeResult,
    reviewTarget: chain.reviewTarget,
  };
}

function createStubProvider(result: ReviewerRuntimeProviderResult): ReviewerRuntimeProvider & { invoke: ReturnType<typeof vi.fn> } {
  const invoke = vi.fn(async (_command: ReviewerRuntimeProviderCommand) => result);
  return { providerId: "codex", invoke };
}

function createApprovedResult(): ReviewerRuntimeProviderResult {
  return {
    status: "Completed",
    decision: "Approved",
    findings: [],
    evidence: {
      providerId: "codex",
      agentId: "Codex",
      role: "Reviewer",
      commandDisplay: "codex --sandbox danger-full-access --ask-for-approval never exec",
      workingDirectory: "C:/worktrees/076",
      reviewTargetSha: "a".repeat(40),
      started: true,
      completed: true,
      timedOut: false,
      exitCode: 0,
      durationMs: 10,
      stdoutSummary: "Decision: Approved",
      stderrSummary: "",
      outputTruncated: false,
    },
  };
}

function createChangesRequestedResult(): ReviewerRuntimeProviderResult {
  return {
    status: "Completed",
    decision: "ChangesRequested",
    findings: [
      { findingId: "f1", severity: "P1", blocking: true, category: "correctness", message: "Fix the bug." },
    ],
    evidence: {
      providerId: "codex",
      agentId: "Codex",
      role: "Reviewer",
      commandDisplay: "codex --sandbox danger-full-access --ask-for-approval never exec",
      workingDirectory: "C:/worktrees/076",
      reviewTargetSha: "a".repeat(40),
      started: true,
      completed: true,
      timedOut: false,
      exitCode: 0,
      durationMs: 10,
      stdoutSummary: "Decision: Changes Requested",
      stderrSummary: "",
      outputTruncated: false,
    },
  };
}

describe("ReviewerRuntimeService", () => {
  it("invokes the provider with the approved Codex command and produces a Completed/Approved result on a valid chain", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("Completed");
    expect(outcome.result.decision).toBe("Approved");
    expect(outcome.runtime?.status).toBe("Completed");
    expect(outcome.runtime?.decision).toBe("Approved");
    expect(outcome.runtime?.reviewerStarted).toBe(true);
    expect(outcome.runtime?.implementerStarted).toBe(true);
    expect(outcome.runtime?.validationStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
    expect(provider.invoke).toHaveBeenCalledTimes(1);
  });

  it("produces a Completed/ChangesRequested result with bounded findings on a valid chain", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createChangesRequestedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("Completed");
    expect(outcome.result.decision).toBe("ChangesRequested");
    expect(outcome.result.blockingFindingCount).toBe(1);
    expect(outcome.runtime?.findings).toHaveLength(1);
  });

  it("passes the approved Codex command (not a repository-default-derived command) to the provider", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    await service.startReviewer(createInput(chain));

    const [providerCommand] = provider.invoke.mock.calls[0]!;
    expect(providerCommand.command).toBe("codex");
    expect(chain.plan.reviewerAgent).toBe("Reviewer");
    expect(providerCommand.command).not.toBe("claude");
  });

  it("rejects the repository's unswapped default binding (Claude configured as the approved Reviewer)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(
      createInput(chain, { approvedImplementerAgent: "codex", approvedReviewerAgent: "claude" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("rejects Codex configured as the approved Implementer even when Codex is also correctly the Reviewer", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(
      createInput(chain, { approvedImplementerAgent: "codex", approvedReviewerAgent: "codex" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("rejects the same agent bound to both roles under a third, unapproved agent name", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(
      createInput(chain, { approvedImplementerAgent: "gemini", approvedReviewerAgent: "gemini" }),
    );

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_CLAUDE_REVIEWER_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the generic role labels are inconsistent across the upstream chain", async () => {
    const chain = createValidChain();
    const mismatchedApproval = { ...chain.approval, implementerAgent: "SomethingElse" };
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer({ ...createInput(chain), approval: mismatchedApproval });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_ROLE_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("validates in the documented order and never calls the provider after an upstream block", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const staleReadiness = { ...chain.readiness, status: "Blocked" as const };
    const outcome = await service.startReviewer({ ...createInput(chain), readiness: staleReadiness });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_READINESS_NOT_READY");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the plan has changed since Runtime Start was recorded (stale planId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const changedPlan = { ...chain.plan, planId: "a-different-plan-id-after-recreation" };
    const outcome = await service.startReviewer({ ...createInput(chain), executionPlan: changedPlan });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_PLAN_INVALID");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the approval has changed since Runtime Start was recorded (stale executionPlanId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const changedApproval = { ...chain.approval, executionPlanId: "a-different-plan-id" };
    const outcome = await service.startReviewer({ ...createInput(chain), approval: changedApproval });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_APPROVAL_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the preflight has changed since Runtime Start was recorded (stale preflightId)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const changedPreflight = { ...chain.preflight, preflightId: "a-different-preflight-id" };
    const outcome = await service.startReviewer({ ...createInput(chain), preflight: changedPreflight });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_PREFLIGHT_NOT_READY");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when Runtime Start is missing", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer({ ...createInput(chain), runtimeStart: undefined });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_START_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a worktree mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, worktreePath: "C:/some/other/worktree" };
    const outcome = await service.startReviewer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_WORKTREE_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a branch mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, branch: "some-other-branch" };
    const outcome = await service.startReviewer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_BRANCH_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks on a specification path mismatch", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, specificationPath: "specs/some-other-spec/spec.md" };
    const outcome = await service.startReviewer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_SPEC_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the Runtime Start's repositoryId does not match the Execution Plan", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const mismatched = { ...chain.runtimeStart, repositoryId: "some-other-repo" };
    const outcome = await service.startReviewer({ ...createInput(chain), runtimeStart: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_START_STALE");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks when the Implementer Runtime's repositoryId does not match the Execution Plan", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const mismatched = { ...chain.implementerRuntime, repositoryId: "some-other-repo" };
    const outcome = await service.startReviewer({ ...createInput(chain), implementerRuntime: mismatched });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_WORKTREE_MISMATCH");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  describe("Claude Implementer Runtime revalidation", () => {
    it("blocks when the Implementer Runtime is missing", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const outcome = await service.startReviewer({ ...createInput(chain), implementerRuntime: undefined });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_IMPLEMENTER_MISSING");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the Implementer Runtime is not Completed (e.g. Blocked)", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const blockedImplementer = { ...chain.implementerRuntime, status: "Blocked" as const };
      const outcome = await service.startReviewer({ ...createInput(chain), implementerRuntime: blockedImplementer });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the Implementer Runtime is TimedOut, not Completed", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const timedOutImplementer = { ...chain.implementerRuntime, status: "TimedOut" as const };
      const outcome = await service.startReviewer({ ...createInput(chain), implementerRuntime: timedOutImplementer });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the Implementer Runtime already recorded reviewerStarted (no re-run on an already-reviewed attempt)", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const alreadyReviewed = { ...chain.implementerRuntime, reviewerStarted: true } as unknown as typeof chain.implementerRuntime;
      const outcome = await service.startReviewer({ ...createInput(chain), implementerRuntime: alreadyReviewed });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_START_STALE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });
  });

  describe("Review Target validation", () => {
    it("blocks when the Review Target is missing", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const outcome = await service.startReviewer({ ...createInput(chain), reviewTarget: undefined });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_TARGET_MISSING");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks an Uncommitted review target and never reaches the exact-HEAD gate", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const uncommitted = { ...chain.reviewTarget, workingTreeState: "Uncommitted" as const };
      const outcome = await service.startReviewer({ ...createInput(chain), reviewTarget: uncommitted });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_TARGET_UNCOMMITTED");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the review target's implementerRuntimeId does not match the revalidated Implementer Runtime", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const mismatched = { ...chain.reviewTarget, implementerRuntimeId: "a-different-implementer-runtime-id" };
      const outcome = await service.startReviewer({ ...createInput(chain), reviewTarget: mismatched });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_TARGET_MISMATCH");
    });

    it("blocks when the review target's repositoryId does not match the Execution Plan", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const mismatched = { ...chain.reviewTarget, repositoryId: "some-other-repo" };
      const outcome = await service.startReviewer({ ...createInput(chain), reviewTarget: mismatched });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_WORKTREE_MISMATCH");
      expect(provider.invoke).not.toHaveBeenCalled();
    });
  });

  it("rejects an actor label equivalent to Claude, Codex, agent, bot, automation, or workflow", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    for (const actor of ["Claude", "Codex", "agent-runner", "MyBot", "automation-script", "release-workflow"]) {
      const outcome = await service.startReviewer(createInput(chain, { startedBy: actor }));
      expect(outcome.result.status).toBe("Failed");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_INVALID_ACTOR");
    }
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("blocks a malformed command missing required fields", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain, { runtimeStartId: "" }));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_MALFORMED");
    expect(provider.invoke).not.toHaveBeenCalled();
  });

  it("returns the existing terminal result idempotently on a repeat request, without invoking the provider again", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const first = await service.startReviewer(createInput(chain));
    expect(provider.invoke).toHaveBeenCalledTimes(1);

    const second = await service.startReviewer({
      ...createInput(chain),
      existingRuntimes: first.runtimeCollection,
      existingResults: first.resultCollection,
    });

    expect(provider.invoke).toHaveBeenCalledTimes(1);
    expect(second.result.status).toBe("Completed");
    expect(second.result.reasonCodes).toContain("REVIEWER_RUNTIME_ALREADY_COMPLETED");
  });

  it("maps a Blocked provider result (e.g. browser-guard unavailable) without creating a runtime record", async () => {
    const chain = createValidChain();
    const provider = createStubProvider({
      status: "Blocked",
      decision: "Unknown",
      findings: [],
      evidence: {
        providerId: "codex",
        agentId: "Codex",
        role: "Reviewer",
        commandDisplay: "codex ...",
        workingDirectory: "C:/worktrees/076",
        reviewTargetSha: "a".repeat(40),
        started: false,
        completed: false,
        timedOut: false,
        durationMs: 0,
        stdoutSummary: "",
        stderrSummary: "provider unavailable",
        outputTruncated: false,
      },
    });
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.runtime).toBeUndefined();
    expect(outcome.result.agentStarted).toBe(false);
    expect(outcome.result.reviewerStarted).toBe(false);
  });

  it("does not create a ReviewerRuntime record for a Failed provider result (only a result)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider({
      status: "Failed",
      decision: "Unknown",
      findings: [],
      evidence: {
        providerId: "codex",
        agentId: "Codex",
        role: "Reviewer",
        commandDisplay: "codex ...",
        workingDirectory: "C:/worktrees/076",
        reviewTargetSha: "a".repeat(40),
        started: true,
        completed: false,
        timedOut: false,
        durationMs: 5,
        stdoutSummary: "",
        stderrSummary: "spawn failed",
        outputTruncated: false,
      },
    });
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.runtime).toBeUndefined();
    expect(outcome.runtimeCollection).toBeUndefined();
  });

  it("creates a ReviewerRuntime record for a TimedOut provider result (a confirmed spawn)", async () => {
    const chain = createValidChain();
    const provider = createStubProvider({
      status: "TimedOut",
      decision: "Unknown",
      findings: [],
      evidence: {
        providerId: "codex",
        agentId: "Codex",
        role: "Reviewer",
        commandDisplay: "codex ...",
        workingDirectory: "C:/worktrees/076",
        reviewTargetSha: "a".repeat(40),
        started: true,
        completed: false,
        timedOut: true,
        durationMs: 300000,
        stdoutSummary: "",
        stderrSummary: "",
        outputTruncated: false,
      },
    });
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("TimedOut");
    expect(outcome.runtime?.status).toBe("TimedOut");
    expect(outcome.runtime?.decision).toBe("Unknown");
  });

  it("maps a provider exception to a Failed result without setting agentStarted", async () => {
    const chain = createValidChain();
    const provider: ReviewerRuntimeProvider = {
      providerId: "codex",
      invoke: vi.fn(async () => {
        throw new Error("unexpected");
      }),
    };
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.status).toBe("Failed");
    expect(outcome.result.agentStarted).toBe(false);
  });

  it("keeps validationStarted and githubMutationStarted false on every outcome status", async () => {
    const chain = createValidChain();
    const provider = createStubProvider(createApprovedResult());
    const service = new ReviewerRuntimeService(provider);

    const outcome = await service.startReviewer(createInput(chain));

    expect(outcome.result.validationStarted).toBe(false);
    expect(outcome.result.githubMutationStarted).toBe(false);
    expect(outcome.runtime?.validationStarted).toBe(false);
    expect(outcome.runtime?.githubMutationStarted).toBe(false);
  });

  describe("command safety uses the exact same shared checks the provider itself applies", () => {
    it("blocks a destructive git verb (git push) that the reused isSafeCommandLine check rejects, without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider, {
        command: "git",
        arguments: ["push"],
        inputMode: "stdin",
        timeoutMs: 60000,
      });

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks an -EncodedCommand PowerShell wrapper without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider, {
        command: "powershell",
        arguments: ["-EncodedCommand", "ZABlAGwAIAAvAHMA"],
        inputMode: "stdin",
        timeoutMs: 60000,
      });

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("accepts the approved Codex command configuration and reaches the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Completed");
      expect(provider.invoke).toHaveBeenCalledTimes(1);
    });

    it("blocks a harmless, otherwise-safe command that is not the exact approved Codex configuration, without invoking the provider", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider, {
        command: "node",
        arguments: ["--version"],
        inputMode: "stdin",
        timeoutMs: 60000,
      });

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the arguments differ from the approved configuration even if the command matches", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider, {
        command: "codex",
        arguments: ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec", "--extra-flag"],
        inputMode: "stdin",
        timeoutMs: 60000,
      });

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });

    it("blocks when the input mode differs from the approved configuration even if command and arguments match", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider, {
        command: "codex",
        arguments: ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"],
        inputMode: "argument",
        timeoutMs: 60000,
      });

      const outcome = await service.startReviewer(createInput(chain));

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_COMMAND_UNSAFE");
      expect(provider.invoke).not.toHaveBeenCalled();
    });
  });

  describe("project isolation", () => {
    it("blocks when the Review Target belongs to a different project than the Execution Plan", async () => {
      const chain = createValidChain();
      const provider = createStubProvider(createApprovedResult());
      const service = new ReviewerRuntimeService(provider);

      const otherProjectTarget = { ...chain.reviewTarget, projectId: "some-other-project" };
      const outcome = await service.startReviewer({ ...createInput(chain), reviewTarget: otherProjectTarget });

      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.result.reasonCodes).toContain("REVIEWER_RUNTIME_PROJECT_MISMATCH");
      expect(provider.invoke).not.toHaveBeenCalled();
    });
  });
});
