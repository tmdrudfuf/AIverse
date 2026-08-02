import { describe, expect, it } from "vitest";

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
import { createReviewTargetId, type ReviewTarget } from "../reviewer-runtime/ReviewTarget";
import {
  REVIEWER_RUNTIME_RULES_VERSION,
  createReviewerRuntimeId,
  createReviewerRuntimeResultId,
  type ReviewerRuntime,
  type ReviewerRuntimeResult,
} from "../reviewer-runtime/ReviewerRuntimeTypes";
import { ReviewDecisionService } from "./ReviewDecisionService";
import type { ReviewDecisionInput, ReviewPromotionRequest } from "./ReviewDecisionTypes";

const PROJECT_ID = "daily-proof";
const ACTIVE_SESSION_ID = "session-1";

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const planId = createExecutionPlanId(PROJECT_ID, ACTIVE_SESSION_ID);
  return {
    planId,
    projectId: PROJECT_ID,
    featureId: "077-review-decision-human-promotion-gate",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: ACTIVE_SESSION_ID,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/worktrees/077",
    branchName: "codex/077-review-decision-human-promotion-gate",
    specPath: "specs/077-review-decision-human-promotion-gate/spec.md",
    implementerAgent: "Implementer",
    reviewerAgent: "Reviewer",
    validationCommands: ["npm test", "npx tsc --noEmit"],
    allowedMutationScope: ["local-worktree-only"],
    createdAt: "2026-08-01T00:00:00.000Z",
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
    evaluatedAt: "2026-08-01T00:00:00.000Z",
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
    evaluatedAt: "2026-08-01T00:00:00.000Z",
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
    approvedAt: "2026-08-01T00:00:00.000Z",
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
    evaluatedAt: "2026-08-01T00:00:00.000Z",
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
    evaluatedAt: "2026-08-01T00:00:00.000Z",
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
    startedAt: "2026-08-01T00:00:00.000Z",
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
    resultAt: "2026-08-01T00:00:00.000Z",
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
    startedAt: "2026-08-01T00:01:00.000Z",
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
    resultAt: "2026-08-01T00:01:00.000Z",
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

function createReviewerRuntime(
  plan: ExecutionPlan,
  runtimeStart: RuntimeStart,
  implementerRuntime: ImplementerRuntime,
  reviewTarget: ReviewTarget,
  overrides: Partial<ReviewerRuntime> = {},
): ReviewerRuntime {
  return {
    reviewerRuntimeId: createReviewerRuntimeId(plan.projectId, reviewTarget.reviewTargetId),
    projectId: plan.projectId,
    runtimeStartId: runtimeStart.runtimeStartId,
    implementerRuntimeId: implementerRuntime.implementerRuntimeId,
    reviewTargetId: reviewTarget.reviewTargetId,
    reviewPromptId: `${plan.projectId}:reviewer-prompt:${reviewTarget.reviewTargetId}:${REVIEWER_RUNTIME_RULES_VERSION}`,
    worktreePath: plan.worktreePath,
    branch: plan.branchName,
    specificationPath: plan.specPath,
    implementer: plan.implementerAgent,
    reviewer: plan.reviewerAgent,
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    status: "Completed",
    decision: "Approved",
    findings: [],
    startedBy: "Local Human",
    startedAt: "2026-08-01T00:02:00.000Z",
    executionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: true,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    evidence: {
      providerId: "codex",
      agentId: "Codex",
      role: "Reviewer",
      commandDisplay: "codex --sandbox danger-full-access --ask-for-approval never exec",
      workingDirectory: plan.worktreePath,
      reviewTargetSha: reviewTarget.reviewTargetSha,
      started: true,
      completed: true,
      timedOut: false,
      exitCode: 0,
      durationMs: 10,
      stdoutSummary: "Decision: Approved",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
    ...overrides,
  };
}

function createReviewerRuntimeResult(reviewerRuntime: ReviewerRuntime, overrides: Partial<ReviewerRuntimeResult> = {}): ReviewerRuntimeResult {
  return {
    id: createReviewerRuntimeResultId(reviewerRuntime.projectId, reviewerRuntime.reviewTargetId),
    projectId: reviewerRuntime.projectId,
    runtimeStartId: reviewerRuntime.runtimeStartId,
    implementerRuntimeId: reviewerRuntime.implementerRuntimeId,
    reviewerRuntimeId: reviewerRuntime.reviewerRuntimeId,
    status: reviewerRuntime.status,
    decision: reviewerRuntime.decision,
    blockingFindingCount: 0,
    nonBlockingFindingCount: 0,
    reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
    started: true,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: true,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-08-01T00:02:00.000Z",
    rulesVersion: REVIEWER_RUNTIME_RULES_VERSION,
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
  const reviewerRuntime = createReviewerRuntime(plan, runtimeStart, implementerRuntime, reviewTarget);
  const reviewerRuntimeResult = createReviewerRuntimeResult(reviewerRuntime);
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
    reviewerRuntime,
    reviewerRuntimeResult,
  };
}

function createInput(chain: ReturnType<typeof createValidChain>): ReviewDecisionInput {
  return {
    projectId: chain.plan.projectId,
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
    reviewerRuntime: chain.reviewerRuntime,
    reviewerRuntimeResult: chain.reviewerRuntimeResult,
  };
}

function createRequest(chain: ReturnType<typeof createValidChain>, overrides: Partial<ReviewPromotionRequest> = {}): ReviewPromotionRequest {
  return {
    projectId: chain.plan.projectId,
    reviewerRuntimeId: chain.reviewerRuntime.reviewerRuntimeId,
    actor: "Local Human",
    requestedAt: "2026-08-01T00:03:00.000Z",
    ...overrides,
  };
}

describe("ReviewDecisionService.classify", () => {
  it("returns Unavailable when there is no Reviewer Runtime", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const classification = service.classify({ ...createInput(chain), reviewerRuntime: undefined });

    expect(classification.state).toBe("Unavailable");
    expect(classification.reviewerRuntimeId).toBeUndefined();
  });

  it("returns Approved when the Reviewer Runtime is Completed/Approved and the chain is fresh", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const classification = service.classify(createInput(chain));

    expect(classification.state).toBe("Approved");
    expect(classification.reviewerRuntimeId).toBe(chain.reviewerRuntime.reviewerRuntimeId);
  });

  it("returns ChangesRequested when the Reviewer Runtime is Completed/ChangesRequested", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntime = { ...chain.reviewerRuntime, decision: "ChangesRequested" as const };
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, decision: "ChangesRequested" as const };
    const classification = service.classify({ ...createInput(chain), reviewerRuntime, reviewerRuntimeResult });

    expect(classification.state).toBe("ChangesRequested");
  });

  it("returns Blocked when the Reviewer Runtime status is Blocked", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntime = { ...chain.reviewerRuntime, status: "Blocked" as const };
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, status: "Blocked" as const };
    const classification = service.classify({ ...createInput(chain), reviewerRuntime, reviewerRuntimeResult });

    expect(classification.state).toBe("Blocked");
  });

  it("returns TimedOut when the Reviewer Runtime status is TimedOut", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntime = { ...chain.reviewerRuntime, status: "TimedOut" as const };
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, status: "TimedOut" as const };
    const classification = service.classify({ ...createInput(chain), reviewerRuntime, reviewerRuntimeResult });

    expect(classification.state).toBe("TimedOut");
  });

  it("returns Failed when the Reviewer Runtime status is Failed", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntime = { ...chain.reviewerRuntime, status: "Failed" as const };
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, status: "Failed" as const };
    const classification = service.classify({ ...createInput(chain), reviewerRuntime, reviewerRuntimeResult });

    expect(classification.state).toBe("Failed");
  });

  it("returns Stale (not ChangesRequested/Blocked/etc.) when the Reviewer Runtime Result's status/decision diverges from its Reviewer Runtime record (P1-001 regression)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, decision: "ChangesRequested" as const };
    const classification = service.classify({ ...createInput(chain), reviewerRuntimeResult });

    expect(classification.state).toBe("Stale");
  });

  it.each([
    ["runtimeStartId", { runtimeStartId: "a-different-runtime-start-id" }],
    ["implementerRuntimeId", { implementerRuntimeId: "a-different-implementer-runtime-id" }],
  ] as const)("returns Stale when the Reviewer Runtime Result's %s belongs to a different upstream attempt (round 6 P1-001 regression)", (_field, override) => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, ...override };
    const classification = service.classify({ ...createInput(chain), reviewerRuntimeResult });

    expect(classification.state).toBe("Stale");
  });

  describe("Stale (any upstream chain invalidation collapses to Stale regardless of the Reviewer Runtime's own status/decision)", () => {
    it("is Stale when the plan has been recreated (stale planId)", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const changedPlan = { ...chain.plan, planId: "a-different-plan-id" };
      const classification = service.classify({ ...createInput(chain), executionPlan: changedPlan });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when readiness is no longer Ready", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const staleReadiness = { ...chain.readiness, status: "Blocked" as const };
      const classification = service.classify({ ...createInput(chain), readiness: staleReadiness });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the approval is missing", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const classification = service.classify({ ...createInput(chain), approval: undefined });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when preflight is no longer Ready", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const stalePreflight = { ...chain.preflight, runtimePreflightPassed: false };
      const classification = service.classify({ ...createInput(chain), preflight: stalePreflight });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when Runtime Start is missing", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const classification = service.classify({ ...createInput(chain), runtimeStart: undefined });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Implementer Runtime's own reviewerStarted/validationStarted/githubMutationStarted flags are not all false", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const implementerRuntime = { ...chain.implementerRuntime, validationStarted: true as unknown as false };
      const classification = service.classify({ ...createInput(chain), implementerRuntime });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Implementer Runtime is no longer Completed", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const blockedImplementer = { ...chain.implementerRuntime, status: "Blocked" as const };
      const classification = service.classify({ ...createInput(chain), implementerRuntime: blockedImplementer });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale on a role-binding mismatch (e.g. approvedReviewerAgent changed)", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const reviewerRuntime = { ...chain.reviewerRuntime, approvedReviewerAgent: "gemini" };
      const classification = service.classify({ ...createInput(chain), reviewerRuntime });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when Runtime Start's repositoryId no longer matches the plan's", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const runtimeStart = { ...chain.runtimeStart, repositoryId: "a-different-repo" };
      const classification = service.classify({ ...createInput(chain), runtimeStart });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Implementer Runtime's repositoryId no longer matches the plan's", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const implementerRuntime = { ...chain.implementerRuntime, repositoryId: "a-different-repo" };
      const classification = service.classify({ ...createInput(chain), implementerRuntime });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Review Target's repositoryId no longer matches the plan's", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const reviewTarget = { ...chain.reviewTarget, repositoryId: "a-different-repo" };
      const classification = service.classify({ ...createInput(chain), reviewTarget });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Review Target is missing", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const classification = service.classify({ ...createInput(chain), reviewTarget: undefined });

      expect(classification.state).toBe("Stale");
    });

    it("is Stale when the Reviewer Runtime's own linkage no longer matches (worktreePath changed)", () => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const reviewerRuntime = { ...chain.reviewerRuntime, worktreePath: "C:/some/other/worktree" };
      const classification = service.classify({ ...createInput(chain), reviewerRuntime });

      expect(classification.state).toBe("Stale");
    });

    // Round 5/6 comprehensive parity audit (see .agent-workflow/spec-077-parity-audit.md):
    // validateChain now mirrors ReviewerRuntimeService.validateContext/validateReviewTarget's
    // worktree/branch/spec linkage and clean-working-tree checks for Runtime Start, Implementer
    // Runtime, and Review Target -- table-driven so every field/record pairing gets one focused
    // case.
    it.each([
      ["Runtime Start worktreePath", (c: ReturnType<typeof createValidChain>) => ({ runtimeStart: { ...c.runtimeStart, worktreePath: "C:/other/worktree" } })],
      ["Runtime Start repositoryRoot", (c: ReturnType<typeof createValidChain>) => ({ runtimeStart: { ...c.runtimeStart, repositoryRoot: "C:/other/repo" } })],
      ["Runtime Start branch", (c: ReturnType<typeof createValidChain>) => ({ runtimeStart: { ...c.runtimeStart, branch: "some-other-branch" } })],
      ["Runtime Start specificationPath", (c: ReturnType<typeof createValidChain>) => ({ runtimeStart: { ...c.runtimeStart, specificationPath: "specs/other/spec.md" } })],
      ["Runtime Start executionPlanId", (c: ReturnType<typeof createValidChain>) => ({ runtimeStart: { ...c.runtimeStart, executionPlanId: "a-different-plan-id" } })],
      ["Implementer Runtime worktreePath", (c: ReturnType<typeof createValidChain>) => ({ implementerRuntime: { ...c.implementerRuntime, worktreePath: "C:/other/worktree" } })],
      ["Implementer Runtime branch", (c: ReturnType<typeof createValidChain>) => ({ implementerRuntime: { ...c.implementerRuntime, branch: "some-other-branch" } })],
      ["Implementer Runtime specificationPath", (c: ReturnType<typeof createValidChain>) => ({ implementerRuntime: { ...c.implementerRuntime, specificationPath: "specs/other/spec.md" } })],
      ["Review Target worktreePath", (c: ReturnType<typeof createValidChain>) => ({ reviewTarget: { ...c.reviewTarget, worktreePath: "C:/other/worktree" } })],
      ["Review Target featureBranch", (c: ReturnType<typeof createValidChain>) => ({ reviewTarget: { ...c.reviewTarget, featureBranch: "some-other-branch" } })],
      ["Review Target specificationPath", (c: ReturnType<typeof createValidChain>) => ({ reviewTarget: { ...c.reviewTarget, specificationPath: "specs/other/spec.md" } })],
      ["Review Target workingTreeState (dirty)", (c: ReturnType<typeof createValidChain>) => ({ reviewTarget: { ...c.reviewTarget, workingTreeState: "Uncommitted" as const } })],
    ] as const)("is Stale when %s no longer matches the plan", (_label, buildOverride) => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const override = buildOverride(chain);
      const classification = service.classify({ ...createInput(chain), ...override });

      expect(classification.state).toBe("Stale");
    });
  });
});

describe("ReviewDecisionService.promote", () => {
  it("grants a Review Promotion for a fresh Approved chain, with literal-false safety flags", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    const outcome = service.promote(createInput(chain), createRequest(chain));

    expect(outcome.result.granted).toBe(true);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_GRANTED");
    expect(outcome.promotion?.decision).toBe("Approved");
    expect(outcome.promotion?.validationStarted).toBe(false);
    expect(outcome.promotion?.repositoryMutationStarted).toBe(false);
    expect(outcome.promotion?.githubMutationStarted).toBe(false);
    expect(outcome.promotionCollection?.promotionCount).toBe(1);
  });

  it("is idempotent: a second Promote for the same reviewerRuntimeId returns the same record without duplication", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    const first = service.promote(createInput(chain), createRequest(chain));
    const second = service.promote(
      { ...createInput(chain), existingPromotions: first.promotionCollection, existingPromotionResults: first.resultCollection },
      createRequest(chain),
    );

    expect(second.result.alreadyPromoted).toBe(true);
    expect(second.result.reasonCodes).toContain("REVIEW_PROMOTION_ALREADY_PROMOTED");
    expect(second.promotion?.reviewPromotionId).toBe(first.promotion?.reviewPromotionId);
    expect(second.promotionCollection?.promotionCount).toBe(1);
  });

  it("blocks Promote when the classification is not Approved (e.g. ChangesRequested)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntime = { ...chain.reviewerRuntime, decision: "ChangesRequested" as const };
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, decision: "ChangesRequested" as const };

    const outcome = service.promote(
      { ...createInput(chain), reviewerRuntime, reviewerRuntimeResult },
      createRequest(chain),
    );

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_DECISION_NOT_APPROVED");
    expect(outcome.promotion).toBeUndefined();
  });

  it("blocks Promote when the Reviewer Runtime Result's decision diverges from its Reviewer Runtime record (P1-001 regression)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, decision: "ChangesRequested" as const };

    const outcome = service.promote(
      { ...createInput(chain), reviewerRuntimeResult },
      createRequest(chain),
    );

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
    expect(outcome.promotion).toBeUndefined();
  });

  it.each([
    ["runtimeStartId", { runtimeStartId: "a-different-runtime-start-id" }],
    ["implementerRuntimeId", { implementerRuntimeId: "a-different-implementer-runtime-id" }],
  ] as const)(
    "blocks Promote and records no promotion when the Reviewer Runtime Result's %s belongs to a different upstream attempt (round 6 P1-001 regression)",
    (_field, override) => {
      const service = new ReviewDecisionService();
      const chain = createValidChain();
      const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, ...override };

      const outcome = service.promote(
        { ...createInput(chain), reviewerRuntimeResult },
        createRequest(chain),
      );

      expect(outcome.result.granted).toBe(false);
      expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
      expect(outcome.promotion).toBeUndefined();
      expect(outcome.promotionCollection).toBeUndefined();
    },
  );

  it("does not mutate the source Reviewer Runtime/Result when the Reviewer Runtime Result's runtimeStartId belongs to a different upstream attempt (round 6 P1-001 regression)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewerRuntimeResult = { ...chain.reviewerRuntimeResult, runtimeStartId: "a-different-runtime-start-id" };
    const reviewerRuntimeSnapshot = { ...chain.reviewerRuntime };
    const reviewerRuntimeResultSnapshot = { ...chain.reviewerRuntimeResult };

    service.promote({ ...createInput(chain), reviewerRuntimeResult }, createRequest(chain));

    expect(chain.reviewerRuntime).toEqual(reviewerRuntimeSnapshot);
    expect(chain.reviewerRuntimeResult).toEqual(reviewerRuntimeResultSnapshot);
  });

  it("blocks Promote when the chain has gone Stale since the Reviewer Runtime completed", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const stalePreflight = { ...chain.preflight, runtimePreflightPassed: false };

    const outcome = service.promote({ ...createInput(chain), preflight: stalePreflight }, createRequest(chain));

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
  });

  it("blocks Promote when the request's reviewerRuntimeId does not match the current chain's Reviewer Runtime", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    const outcome = service.promote(createInput(chain), createRequest(chain, { reviewerRuntimeId: "a-different-reviewer-runtime-id" }));

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_TARGET_MISMATCH");
  });

  it("rejects an actor label equivalent to Claude, Codex, agent, bot, automation, or workflow", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    for (const actor of ["Claude", "Codex", "agent-runner", "MyBot", "automation-script", "release-workflow"]) {
      const outcome = service.promote(createInput(chain), createRequest(chain, { actor }));
      expect(outcome.result.granted).toBe(false);
      expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_INVALID_ACTOR");
    }
  });

  it("blocks Promote when the Review Target's working tree is not Clean (comprehensive parity audit)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewTarget = { ...chain.reviewTarget, workingTreeState: "Uncommitted" as const };

    const outcome = service.promote({ ...createInput(chain), reviewTarget }, createRequest(chain));

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
    expect(outcome.promotion).toBeUndefined();
  });

  it("blocks Promote and records no promotion when the Runtime Start's branch no longer matches the plan (comprehensive parity audit)", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const runtimeStart = { ...chain.runtimeStart, branch: "some-other-branch" };

    const outcome = service.promote({ ...createInput(chain), runtimeStart }, createRequest(chain));

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
    expect(outcome.promotion).toBeUndefined();
    expect(outcome.promotionCollection).toBeUndefined();
  });

  it("does not mutate the source Reviewer Runtime/Result when a parity check blocks Promote", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const reviewTarget = { ...chain.reviewTarget, workingTreeState: "Uncommitted" as const };
    const reviewerRuntimeSnapshot = { ...chain.reviewerRuntime };
    const reviewerRuntimeResultSnapshot = { ...chain.reviewerRuntimeResult };

    service.promote({ ...createInput(chain), reviewTarget }, createRequest(chain));

    expect(chain.reviewerRuntime).toEqual(reviewerRuntimeSnapshot);
    expect(chain.reviewerRuntimeResult).toEqual(reviewerRuntimeResultSnapshot);
  });

  it("still grants Promote for a valid exact chain after the comprehensive parity checks were added", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    const outcome = service.promote(createInput(chain), createRequest(chain));

    expect(outcome.result.granted).toBe(true);
    expect(outcome.promotion?.decision).toBe("Approved");
  });

  it("keeps project isolation: a chain for a different projectId never satisfies this project's plan check", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();
    const plan = { ...chain.plan, projectId: "some-other-project" };

    const outcome = service.promote({ ...createInput(chain), executionPlan: plan }, createRequest(chain));

    expect(outcome.result.granted).toBe(false);
    expect(outcome.result.reasonCodes).toContain("REVIEW_PROMOTION_REVIEWER_STALE");
    expect(outcome.promotion).toBeUndefined();
  });

  it("keeps validationStarted/repositoryMutationStarted/githubMutationStarted false on every outcome result", () => {
    const service = new ReviewDecisionService();
    const chain = createValidChain();

    const outcome = service.promote(createInput(chain), createRequest(chain));

    expect(outcome.result.validationStarted).toBe(false);
    expect(outcome.result.repositoryMutationStarted).toBe(false);
    expect(outcome.result.githubMutationStarted).toBe(false);
  });
});
