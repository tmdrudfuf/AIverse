import { describe, expect, it } from "vitest";

import { EXECUTION_PLAN_RULES_VERSION, createExecutionPlanId, type ExecutionPlan } from "../execution-plans/ExecutionPlanTypes";
import {
  EXECUTION_READINESS_RULES_VERSION,
  createExecutionReadinessId,
  createExecutionReadinessResultId,
  type ExecutionReadiness,
  type ExecutionReadinessResult,
} from "../execution-readiness/ExecutionReadinessTypes";
import {
  HUMAN_EXECUTION_APPROVAL_RULES_VERSION,
  createHumanExecutionApprovalId,
  type HumanExecutionApproval,
} from "../human-execution-approvals/HumanExecutionApprovalTypes";
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
import {
  computeReviewTargetBaseSha,
  computeReviewTargetSha,
  REVIEW_TARGET_BASE_BRANCH,
  resolveReviewTarget,
  type ReviewTarget,
} from "../reviewer-runtime/ReviewTarget";
import {
  REVIEWER_RUNTIME_RULES_VERSION,
  createReviewerRuntimeId,
  createReviewerRuntimeResultId,
  type ReviewerRuntime,
  type ReviewerRuntimeResult,
} from "../reviewer-runtime/ReviewerRuntimeTypes";
import { validateReviewRuntimeChainIntegrity } from "./ReviewRuntimeChainIntegrityService";
import type { ReviewDecisionInput } from "./ReviewDecisionTypes";

// Local fixture builders, duplicated per this repo's established per-test-file
// fixture convention (see OfficeProjectPortalController.review-decision.test.ts).
// Every id/rulesVersion field below is produced by the same canonical create*Id
// helper / *_RULES_VERSION constant its real creation service uses -- confirmed
// against each service's source in .agent-workflow/spec-078-chain-integrity-audit.md.

const PROJECT_ID = "daily-proof";
const ACTIVE_SESSION_ID = "session-1";

function createPlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const planId = createExecutionPlanId(PROJECT_ID, ACTIVE_SESSION_ID);
  return {
    planId,
    projectId: PROJECT_ID,
    featureId: "078-review-runtime-chain-integrity-consolidation",
    projectTaskId: "task-1",
    confirmedAssignmentId: "assignment-1",
    preparedSessionId: "prepared-1",
    activeSessionId: ACTIVE_SESSION_ID,
    employeeId: "employee-1",
    repositoryId: "repo-1",
    repositoryPath: "C:/repo",
    worktreePath: "C:/worktrees/078",
    branchName: "codex/078-review-runtime-chain-integrity-consolidation",
    specPath: "specs/078-review-runtime-chain-integrity-consolidation/spec.md",
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
    activeSessionId: plan.activeSessionId,
    projectTaskId: plan.projectTaskId,
    confirmedAssignmentId: plan.confirmedAssignmentId,
    preparedSessionId: plan.preparedSessionId,
    employeeId: plan.employeeId,
    repositoryId: plan.repositoryId,
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
    approvalId: createHumanExecutionApprovalId(plan.projectId, plan.planId),
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

function createRuntimeStart(plan: ExecutionPlan, approval: HumanExecutionApproval, preflight: RuntimePreflight, readinessResult: ExecutionReadinessResult, overrides: Partial<RuntimeStart> = {}): RuntimeStart {
  return {
    runtimeStartId: createRuntimeStartId(plan.projectId, plan.planId),
    projectId: plan.projectId,
    executionPlanId: plan.planId,
    executionReadinessResultId: readinessResult.id,
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
  return {
    ...resolveReviewTarget(plan, runtimeStart, implementerRuntime),
    workingTreeState: "Clean",
    changedFiles: ["src/example.ts"],
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

function createValidChain(planOverrides: Partial<ExecutionPlan> = {}) {
  const plan = createPlan(planOverrides);
  const readiness = createReadiness(plan);
  const readinessResult = createReadinessResult(readiness);
  const approval = createApproval(plan, readiness);
  const preflight = createPreflight(plan, approval, readiness);
  const preflightResult = createPreflightResult(preflight);
  const runtimeStart = createRuntimeStart(plan, approval, preflight, readinessResult);
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

type Chain = ReturnType<typeof createValidChain>;
type Mutate = (chain: Chain) => Partial<ReviewDecisionInput>;

describe("validateReviewRuntimeChainIntegrity", () => {
  it("returns undefined (passes) for a fully valid, exact-context chain", () => {
    const chain = createValidChain();
    expect(validateReviewRuntimeChainIntegrity(createInput(chain))).toBeUndefined();
  });

  describe("Execution Plan", () => {
    it.each([
      ["projectId mismatch with input.projectId", (c: Chain): Partial<ReviewDecisionInput> => ({ projectId: "some-other-project" })],
      ["malformed planId", (c: Chain) => ({ executionPlan: { ...c.plan, planId: "not-a-canonical-plan-id" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ executionPlan: { ...c.plan, rulesVersion: "plan-v0" } })],
      ["missing plan", () => ({ executionPlan: undefined })],
      // Unsafe mutation flags (P1-001, lifecycle-and-safety pass): a plan
      // that already claims repository/GitHub mutation activity is
      // internally contradictory before any downstream stage exists.
      ["repositoryMutationStarted true on a record claiming nothing has started", (c: Chain) => ({ executionPlan: { ...c.plan, repositoryMutationStarted: true as unknown as false } })],
      ["githubMutationStarted true on a record claiming nothing has started", (c: Chain) => ({ executionPlan: { ...c.plan, githubMutationStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_PLAN_INVALID when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_PLAN_INVALID");
    });
  });

  describe("Execution Readiness", () => {
    it.each([
      ["missing readiness", (c: Chain) => ({ readiness: undefined })],
      ["missing readinessResult", (c: Chain) => ({ readinessResult: undefined })],
      ["status not Ready", (c: Chain) => ({ readiness: { ...c.readiness, status: "Blocked" as const } })],
      ["malformed readinessId", (c: Chain) => ({ readiness: { ...c.readiness, readinessId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ readiness: { ...c.readiness, rulesVersion: "readiness-v0" } })],
      [
        "readinessResult.readinessId references a different readiness record",
        (c: Chain) => ({ readinessResult: { ...c.readinessResult, readinessId: "a-different-readiness-id" } }),
      ],
      ["malformed readinessResult.id", (c: Chain) => ({ readinessResult: { ...c.readinessResult, id: "not-canonical" } })],
      ["readinessResult unsupported rulesVersion", (c: Chain) => ({ readinessResult: { ...c.readinessResult, rulesVersion: "readiness-v0" } })],
      ["activeSessionId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, activeSessionId: "a-different-session" } })],
      ["projectTaskId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, projectTaskId: "a-different-task" } })],
      ["confirmedAssignmentId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, confirmedAssignmentId: "a-different-assignment" } })],
      ["preparedSessionId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, preparedSessionId: "a-different-prepared" } })],
      ["employeeId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, employeeId: "a-different-employee" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ readiness: { ...c.readiness, repositoryId: "a-different-repo" } })],
      // Stage-order flags (P1-001): Readiness only evaluates whether
      // execution *could* start -- it cannot itself claim execution started.
      ["executionStarted true on a record claiming not-yet-started", (c: Chain) => ({ readiness: { ...c.readiness, executionStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_READINESS_NOT_READY when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_READINESS_NOT_READY");
    });
  });

  describe("Human Execution Approval", () => {
    it.each([
      ["missing approval", (c: Chain) => ({ approval: undefined })],
      ["executionApproved false", (c: Chain) => ({ approval: { ...c.approval, executionApproved: false as unknown as true } })],
      ["malformed approvalId", (c: Chain) => ({ approval: { ...c.approval, approvalId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ approval: { ...c.approval, rulesVersion: "approval-v0" } })],
      [
        "approval.readinessId references a different readiness record",
        (c: Chain) => ({ approval: { ...c.approval, readinessId: "a-different-readiness-id" } }),
      ],
      ["activeSessionId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, activeSessionId: "a-different-session" } })],
      ["projectTaskId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, projectTaskId: "a-different-task" } })],
      ["confirmedAssignmentId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, confirmedAssignmentId: "a-different-assignment" } })],
      ["preparedSessionId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, preparedSessionId: "a-different-prepared" } })],
      ["employeeId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, employeeId: "a-different-employee" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ approval: { ...c.approval, repositoryId: "a-different-repo" } })],
      ["validationCommands diverges from the plan's", (c: Chain) => ({ approval: { ...c.approval, validationCommands: ["npm test"] } })],
      ["allowedMutationScope diverges from the plan's", (c: Chain) => ({ approval: { ...c.approval, allowedMutationScope: ["remote-write"] } })],
      // Stage-order flags (P1-001): approval only grants permission to
      // start -- it cannot itself be the record of having started.
      ["agentStarted true on an approval that only grants permission to start", (c: Chain) => ({ approval: { ...c.approval, agentStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_APPROVAL_STALE when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_APPROVAL_STALE");
    });

    it("returns REVIEW_PROMOTION_INVALID_ACTOR when the approver is a non-human label", () => {
      const chain = createValidChain();
      const approval = { ...chain.approval, approvedBy: "Codex" };
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), approval });
      expect(result).toBe("REVIEW_PROMOTION_INVALID_ACTOR");
    });
  });

  describe("Runtime Preflight", () => {
    it.each([
      ["missing preflight", (c: Chain) => ({ preflight: undefined })],
      ["missing preflightResult", (c: Chain) => ({ preflightResult: undefined })],
      ["malformed preflightId", (c: Chain) => ({ preflight: { ...c.preflight, preflightId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ preflight: { ...c.preflight, rulesVersion: "preflight-v0" } })],
      ["runtimePreflightPassed false", (c: Chain) => ({ preflight: { ...c.preflight, runtimePreflightPassed: false } })],
      [
        "preflight.approvalId references a different approval record",
        (c: Chain) => ({ preflight: { ...c.preflight, approvalId: "a-different-approval-id" } }),
      ],
      [
        "preflightResult.preflightId references a different preflight record",
        (c: Chain) => ({ preflightResult: { ...c.preflightResult, preflightId: "a-different-preflight-id" } }),
      ],
      ["preflight.executionPlanId references a different plan", (c: Chain) => ({ preflight: { ...c.preflight, executionPlanId: "a-different-plan-id" } })],
      ["preflightResult.executionPlanId references a different plan", (c: Chain) => ({ preflightResult: { ...c.preflightResult, executionPlanId: "a-different-plan-id" } })],
      [
        "preflight.readinessId references a different readiness record",
        (c: Chain) => ({ preflight: { ...c.preflight, readinessId: "a-different-readiness-id" } }),
      ],
      ["activeSessionId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, activeSessionId: "a-different-session" } })],
      ["projectTaskId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, projectTaskId: "a-different-task" } })],
      ["confirmedAssignmentId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, confirmedAssignmentId: "a-different-assignment" } })],
      ["preparedSessionId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, preparedSessionId: "a-different-prepared" } })],
      ["employeeId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, employeeId: "a-different-employee" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ preflight: { ...c.preflight, repositoryId: "a-different-repo" } })],
      [
        "preflightResult.readinessId references a different readiness record",
        (c: Chain) => ({ preflightResult: { ...c.preflightResult, readinessId: "a-different-readiness-id" } }),
      ],
      [
        "preflightResult.approvalId references a different approval record",
        (c: Chain) => ({ preflightResult: { ...c.preflightResult, approvalId: "a-different-approval-id" } }),
      ],
      ["malformed preflightResult.id", (c: Chain) => ({ preflightResult: { ...c.preflightResult, id: "not-canonical" } })],
      ["preflightResult unsupported rulesVersion", (c: Chain) => ({ preflightResult: { ...c.preflightResult, rulesVersion: "preflight-v0" } })],
      // Stage-order flags (P1-001): Preflight runs only after human approval,
      // so a Preflight record that no longer carries executionApproved
      // through as true is internally contradictory.
      ["executionApproved false despite Preflight only running after human approval", (c: Chain) => ({ preflight: { ...c.preflight, executionApproved: false } })],
    ] as const)("returns REVIEW_PROMOTION_PREFLIGHT_NOT_READY when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_PREFLIGHT_NOT_READY");
    });
  });

  describe("Runtime Start / upstream context", () => {
    it.each([
      ["missing runtimeStart", (c: Chain) => ({ runtimeStart: undefined })],
      ["missing runtimeStartResult", (c: Chain) => ({ runtimeStartResult: undefined })],
      ["malformed runtimeStartId", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, runtimeStartId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, rulesVersion: "start-v0" } })],
      [
        "runtimeStartResult.runtimeStartId references a different runtime-start record",
        (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, runtimeStartId: "a-different-runtime-start-id" } }),
      ],
      ["runtimeStartResult.executionPlanId references a different plan", (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, executionPlanId: "a-different-plan-id" } })],
      ["malformed runtimeStartResult.id", (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, id: "not-canonical" } })],
      ["runtimeStartResult unsupported rulesVersion", (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, rulesVersion: "start-v0" } })],
      [
        "runtimeStartResult.runtimePreflightId references a different preflight",
        (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, runtimePreflightId: "a-different-preflight-id" } }),
      ],
      [
        "runtimeStartResult.approvalId references a different approval",
        (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, approvalId: "a-different-approval-id" } }),
      ],
      [
        "executionReadinessResultId references a different readiness result",
        (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, executionReadinessResultId: "a-different-readiness-result-id" } }),
      ],
      ["taskId no longer matches the plan's projectTaskId", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, taskId: "a-different-task" } })],
      ["confirmedAssignmentId no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, confirmedAssignmentId: "a-different-assignment" } })],
      ["preparedSessionId no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, preparedSessionId: "a-different-prepared" } })],
      ["activeSessionId no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, activeSessionId: "a-different-session" } })],
      ["employeeId no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, employeeId: "a-different-employee" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, repositoryId: "a-different-repo" } })],
      ["humanExecutionApprovalId references a different approval", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, humanExecutionApprovalId: "a-different-approval-id" } })],
      ["runtimePreflightId references a different preflight", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, runtimePreflightId: "a-different-preflight-id" } })],
      ["worktreePath no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, worktreePath: "C:/other/worktree" } })],
      ["repositoryRoot no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, repositoryRoot: "C:/other/repo" } })],
      ["branch no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, branch: "some-other-branch" } })],
      ["specificationPath no longer matches the plan", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, specificationPath: "specs/other/spec.md" } })],
      [
        "validationCommands diverges from the plan's",
        (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, validationCommands: ["npm test"] } }),
      ],
      [
        "mutationScope diverges from the plan's",
        (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, mutationScope: ["remote-write"] } }),
      ],
      // Stage-order flags (P1-001): Runtime Start records that the runtime
      // itself started, but no downstream stage may have started yet.
      ["implementerStarted true before any Implementer Runtime exists", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, implementerStarted: true as unknown as false } })],
      ["reviewerStarted true before any Reviewer Runtime exists", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, reviewerStarted: true as unknown as false } })],
      ["runtimeStartResult.validationStarted true before any Validation stage exists", (c: Chain) => ({ runtimeStartResult: { ...c.runtimeStartResult, validationStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_START_STALE when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_START_STALE");
    });
  });

  describe("Implementer Runtime / Implementer Runtime Result", () => {
    it.each([
      ["missing implementerRuntime", (c: Chain) => ({ implementerRuntime: undefined })],
      ["missing implementerRuntimeResult", (c: Chain) => ({ implementerRuntimeResult: undefined })],
    ] as const)("returns REVIEW_PROMOTION_IMPLEMENTER_MISSING when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_IMPLEMENTER_MISSING");
    });

    it.each([
      ["runtimeStartId references a different runtime-start record", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, runtimeStartId: "a-different-runtime-start-id" } })],
      ["malformed implementerRuntimeId", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, implementerRuntimeId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, rulesVersion: "claude-implementer-v0" } })],
      ["status not Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, status: "Blocked" as const } })],
      ["executionPlanId references a different plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, executionPlanId: "a-different-plan-id" } })],
      ["humanExecutionApprovalId references a different approval", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, humanExecutionApprovalId: "a-different-approval-id" } })],
      ["runtimePreflightId references a different preflight", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, runtimePreflightId: "a-different-preflight-id" } })],
      ["taskId no longer matches the plan's projectTaskId", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, taskId: "a-different-task" } })],
      ["confirmedAssignmentId no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, confirmedAssignmentId: "a-different-assignment" } })],
      ["preparedSessionId no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, preparedSessionId: "a-different-prepared" } })],
      ["activeSessionId no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, activeSessionId: "a-different-session" } })],
      ["employeeId no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, employeeId: "a-different-employee" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, repositoryId: "a-different-repo" } })],
      ["worktreePath no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, worktreePath: "C:/other/worktree" } })],
      ["branch no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, branch: "some-other-branch" } })],
      ["specificationPath no longer matches the plan", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, specificationPath: "specs/other/spec.md" } })],
      ["malformed implementerRuntimeResult.id", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, id: "not-canonical" } })],
      ["implementerRuntimeResult unsupported rulesVersion", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, rulesVersion: "claude-implementer-v0" } })],
      ["implementerRuntimeResult.executionPlanId references a different plan", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, executionPlanId: "a-different-plan-id" } })],
      ["implementerRuntimeResult.runtimeStartId references a different runtime-start record", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, runtimeStartId: "a-different-runtime-start-id" } })],
      ["implementerRuntimeResult.implementerRuntimeId references a different implementer-runtime record", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, implementerRuntimeId: "a-different-implementer-runtime-id" } })],
      ["reviewerStarted true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, reviewerStarted: true as unknown as false } })],
      ["validationStarted true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, validationStarted: true as unknown as false } })],
      ["githubMutationStarted true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, githubMutationStarted: true as unknown as false } })],
      // Unsafe mutation flags (the reported P1-001 gap: this exact field was
      // omitted from the pre-existing check above it).
      ["repositoryMutationStarted true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, repositoryMutationStarted: true as unknown as false } })],
      // Provider evidence coherence (P1-001): a Completed record's own
      // evidence must agree with the Completed status it is attached to.
      ["evidence.started false on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, started: false } } })],
      ["evidence.timedOut true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, timedOut: true } } })],
      ["evidence.cancelled true on a record claiming Completed", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, cancelled: true } } })],
      // Cross-record consistency (P1-001): the Result must mirror the
      // Runtime's own started-flags exactly, and must not itself claim
      // mutation activity.
      ["implementerRuntimeResult.started diverges from implementerRuntime.agentStarted", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, started: false } })],
      ["implementerRuntimeResult.repositoryMutationStarted true", (c: Chain) => ({ implementerRuntimeResult: { ...c.implementerRuntimeResult, repositoryMutationStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED");
    });

    it.each([
      ["plan.implementerAgent diverges from approval.implementerAgent", (c: Chain) => ({ approval: { ...c.approval, implementerAgent: "SomeoneElse" } })],
      ["plan.reviewerAgent diverges from approval.reviewerAgent", (c: Chain) => ({ approval: { ...c.approval, reviewerAgent: "SomeoneElse" } })],
      ["runtimeStart.implementer diverges from the plan's", (c: Chain) => ({ runtimeStart: { ...c.runtimeStart, implementer: "SomeoneElse" } })],
      ["implementerRuntime.implementer diverges from the plan's", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, implementer: "SomeoneElse" } })],
      ["approvedImplementerAgent is not the canonical claude constant", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, approvedImplementerAgent: "gemini" } })],
      ["approvedReviewerAgent is not the canonical codex constant", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, approvedReviewerAgent: "gemini" } })],
      // P1-002: the provider evidence a runtime actually produced must match
      // the approved chain context, not merely be internally self-consistent.
      ["evidence.providerId is not the canonical claude constant", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, providerId: "gemini" } } })],
      ["evidence.agentId is not Claude", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, agentId: "SomeoneElse" } } })],
      ["evidence.role is not Implementer", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, role: "Reviewer" as unknown as "Implementer" } } })],
      ["evidence.workingDirectory no longer matches the plan's worktreePath", (c: Chain) => ({ implementerRuntime: { ...c.implementerRuntime, evidence: { ...c.implementerRuntime.evidence, workingDirectory: "C:/other/worktree" } } })],
    ] as const)("returns REVIEW_PROMOTION_ROLE_MISMATCH when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_ROLE_MISMATCH");
    });
  });

  describe("Review Target", () => {
    it.each([
      ["missing reviewTarget", (c: Chain) => ({ reviewTarget: undefined })],
      ["runtimeStartId references a different runtime-start record", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, runtimeStartId: "a-different-runtime-start-id" } })],
      ["implementerRuntimeId references a different implementer-runtime record", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, implementerRuntimeId: "a-different-implementer-runtime-id" } })],
      ["repositoryId no longer matches the plan", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, repositoryId: "a-different-repo" } })],
      ["worktreePath no longer matches the plan", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, worktreePath: "C:/other/worktree" } })],
      ["featureBranch no longer matches the plan", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, featureBranch: "some-other-branch" } })],
      ["specificationPath no longer matches the plan", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, specificationPath: "specs/other/spec.md" } })],
      ["workingTreeState is not Clean", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, workingTreeState: "Uncommitted" as const } })],
      ["malformed reviewTargetId", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, reviewTargetId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, rulesVersion: "review-target-v0" } })],
      ["mergeBaseSha diverges from baseSha", (c: Chain) => ({ reviewTarget: { ...c.reviewTarget, mergeBaseSha: "c".repeat(40) } })],
    ] as const)("returns REVIEW_PROMOTION_TARGET_MISMATCH when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });
  });

  // A ReviewTarget must be bound to the exact plan/implementerRuntime context
  // that created it -- baseBranch/baseSha/mergeBaseSha/reviewTargetSha are
  // recomputed here against the same authoritative formula
  // ReviewTarget.resolveReviewTarget used, not merely checked against each
  // other, so a malformed target that changes baseSha and mergeBaseSha
  // together can no longer stay internally self-consistent while no longer
  // representing the approved comparison base (see review.md, combined round
  // 2 P1-001).
  describe("Review Target base-context binding (P1-001)", () => {
    it("passes when baseBranch, baseSha, mergeBaseSha, and reviewTargetSha all match the authoritative formula for the exact current plan and implementerRuntime", () => {
      const chain = createValidChain();
      expect(chain.reviewTarget.baseBranch).toBe(REVIEW_TARGET_BASE_BRANCH);
      const result = validateReviewRuntimeChainIntegrity(createInput(chain));
      expect(result).toBeUndefined();
    });

    it("returns REVIEW_PROMOTION_TARGET_MISMATCH when baseBranch no longer matches the authoritative base branch", () => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({
        ...createInput(chain),
        reviewTarget: { ...chain.reviewTarget, baseBranch: "develop" },
      });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });

    it("returns REVIEW_PROMOTION_TARGET_MISMATCH when baseSha and mergeBaseSha are changed together to a value that stays internally self-consistent but no longer matches the authoritative base", () => {
      const chain = createValidChain();
      const tamperedSha = "c".repeat(40);
      const result = validateReviewRuntimeChainIntegrity({
        ...createInput(chain),
        reviewTarget: { ...chain.reviewTarget, baseSha: tamperedSha, mergeBaseSha: tamperedSha },
      });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });

    it("returns REVIEW_PROMOTION_TARGET_MISMATCH when mergeBaseSha alone diverges from the authoritative merge base while baseSha remains correct", () => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({
        ...createInput(chain),
        reviewTarget: { ...chain.reviewTarget, mergeBaseSha: computeReviewTargetBaseSha(chain.plan.projectId, "a-different-plan-id") },
      });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });

    it("returns REVIEW_PROMOTION_TARGET_MISMATCH when reviewTargetSha is copied in from a different feature/implementerRuntime context", () => {
      const chain = createValidChain();
      const foreignReviewTargetSha = computeReviewTargetSha("a-different-implementer-runtime-id");
      const result = validateReviewRuntimeChainIntegrity({
        ...createInput(chain),
        reviewTarget: { ...chain.reviewTarget, reviewTargetSha: foreignReviewTargetSha },
      });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });

    it("returns REVIEW_PROMOTION_TARGET_MISMATCH when baseSha/mergeBaseSha are copied in from a foreign project/base context", () => {
      const chain = createValidChain();
      const foreignBaseSha = computeReviewTargetBaseSha("another-project", "another-project:execution-plan:session-3:plan-v1");
      const result = validateReviewRuntimeChainIntegrity({
        ...createInput(chain),
        reviewTarget: { ...chain.reviewTarget, baseSha: foreignBaseSha, mergeBaseSha: foreignBaseSha },
      });
      expect(result).toBe("REVIEW_PROMOTION_TARGET_MISMATCH");
    });
  });

  describe("Reviewer Runtime", () => {
    it("returns REVIEW_PROMOTION_REVIEWER_MISSING when reviewerRuntime is missing", () => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), reviewerRuntime: undefined });
      expect(result).toBe("REVIEW_PROMOTION_REVIEWER_MISSING");
    });

    it.each([
      ["runtimeStartId references a different runtime-start record", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, runtimeStartId: "a-different-runtime-start-id" } })],
      ["implementerRuntimeId references a different implementer-runtime record", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, implementerRuntimeId: "a-different-implementer-runtime-id" } })],
      ["reviewTargetId references a different review-target record", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, reviewTargetId: "a-different-review-target-id" } })],
      ["worktreePath no longer matches the plan", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, worktreePath: "C:/other/worktree" } })],
      ["branch no longer matches the plan", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, branch: "some-other-branch" } })],
      ["specificationPath no longer matches the plan", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, specificationPath: "specs/other/spec.md" } })],
      ["malformed reviewerRuntimeId (the reported Round-10 P1-001 gap)", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, reviewerRuntimeId: "not-canonical" } })],
      ["unsupported rulesVersion", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, rulesVersion: "codex-reviewer-v0" } })],
      // Unsafe mutation flags (lifecycle-and-safety pass P1-001): zero prior
      // lifecycle coverage on this record before this pass.
      ["repositoryMutationStarted true on a record whose Result claims no mutation started", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, repositoryMutationStarted: true as unknown as false } })],
      // Provider evidence coherence: a Completed record's own evidence must
      // agree with the Completed status it is attached to, and
      // agentStarted must agree with the spawned formula the service uses.
      ["evidence.completed false on a record claiming Completed", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, completed: false } } })],
      ["evidence.timedOut true on a record claiming Completed", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, timedOut: true } } })],
      ["agentStarted false on a record claiming Completed", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, agentStarted: false } })],
    ] as const)("returns REVIEW_PROMOTION_REVIEWER_STALE when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_REVIEWER_STALE");
    });

    it.each([
      ["reviewerRuntime.implementer diverges from the plan's", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, implementer: "SomeoneElse" } })],
      ["reviewerRuntime.reviewer diverges from the plan's", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, reviewer: "SomeoneElse" } })],
      ["approvedImplementerAgent is not the canonical claude constant", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, approvedImplementerAgent: "gemini" } })],
      ["approvedReviewerAgent is not the canonical codex constant", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, approvedReviewerAgent: "gemini" } })],
      // P1-002: the provider evidence a runtime actually produced -- including
      // the exact SHA it reviewed -- must match the approved chain context,
      // not merely be internally self-consistent.
      ["evidence.providerId is not the canonical codex constant", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, providerId: "gemini" } } })],
      ["evidence.agentId is not Codex", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, agentId: "SomeoneElse" } } })],
      ["evidence.role is not Reviewer", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, role: "Implementer" as unknown as "Reviewer" } } })],
      ["evidence.workingDirectory no longer matches the plan's worktreePath", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, workingDirectory: "C:/other/worktree" } } })],
      ["evidence.reviewTargetSha diverges from the exact ReviewTarget's reviewTargetSha", (c: Chain) => ({ reviewerRuntime: { ...c.reviewerRuntime, evidence: { ...c.reviewerRuntime.evidence, reviewTargetSha: "f".repeat(40) } } })],
    ] as const)("returns REVIEW_PROMOTION_ROLE_MISMATCH when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_ROLE_MISMATCH");
    });

    it.each([
      ["missing reviewerRuntimeResult", (c: Chain) => ({ reviewerRuntimeResult: undefined })],
      ["reviewerRuntimeResult.reviewerRuntimeId references a different reviewer-runtime record", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, reviewerRuntimeId: "a-different-reviewer-runtime-id" } })],
      ["reviewerRuntimeResult.status diverges from reviewerRuntime.status", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, status: "Blocked" as const } })],
      ["reviewerRuntimeResult.decision diverges from reviewerRuntime.decision", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, decision: "ChangesRequested" as const } })],
      ["reviewerRuntimeResult.runtimeStartId references a different runtime-start record", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, runtimeStartId: "a-different-runtime-start-id" } })],
      ["reviewerRuntimeResult.implementerRuntimeId references a different implementer-runtime record", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, implementerRuntimeId: "a-different-implementer-runtime-id" } })],
      ["malformed reviewerRuntimeResult.id", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, id: "not-canonical" } })],
      ["reviewerRuntimeResult unsupported rulesVersion (the reported Round-10 P1-001 gap)", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, rulesVersion: "codex-reviewer-v0" } })],
      // Cross-record consistency (lifecycle-and-safety pass P1-001): the
      // Result must mirror the Runtime's own started-flags exactly, and
      // must not itself claim mutation activity.
      ["reviewerRuntimeResult.agentStarted diverges from reviewerRuntime.agentStarted", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, agentStarted: false } })],
      ["reviewerRuntimeResult.implementerStarted false", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, implementerStarted: false as unknown as true } })],
      ["reviewerRuntimeResult.githubMutationStarted true", (c: Chain) => ({ reviewerRuntimeResult: { ...c.reviewerRuntimeResult, githubMutationStarted: true as unknown as false } })],
    ] as const)("returns REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED when %s", (_label, mutate: Mutate) => {
      const chain = createValidChain();
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), ...mutate(chain) });
      expect(result).toBe("REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED");
    });
  });

  describe("project isolation", () => {
    it("does not let a chain built for a different projectId satisfy this project's validation", () => {
      const chain = createValidChain();
      const plan = { ...chain.plan, projectId: "some-other-project" };
      const result = validateReviewRuntimeChainIntegrity({ ...createInput(chain), executionPlan: plan });
      expect(result).toBe("REVIEW_PROMOTION_PLAN_INVALID");
    });
  });
});
