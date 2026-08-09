import { describe, expect, it, vi } from "vitest";

import { REVIEW_FIX_PLAN_RULES_VERSION, createReviewFixPlanCollection, createReviewFixPlanId, type ReviewFixPlan, type ReviewFixPlanInput } from "../review-fix-plans/ReviewFixPlanTypes";
import { REVIEW_FIX_REQUEST_RULES_VERSION, createReviewFixRequestCollection, type ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import { REVIEW_FIX_RUNTIME_RULES_VERSION, createReviewFixRuntimeCollection, createReviewFixRuntimeId, createReviewFixRuntimeResultCollection, createReviewFixRuntimeResultId, type ReviewFixRuntime, type ReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeTypes";
import { VALIDATION_RUNTIME_RULES_VERSION, createValidationRuntimeCollection, createValidationRuntimeId, createValidationRuntimeResultCollection, createValidationRuntimeResultId, type ValidationRuntime, type ValidationRuntimeResult } from "../validation-runtime/ValidationRuntimeTypes";
import { createPostValidationReviewTargetId } from "../reviewer-runtime/ReviewTarget";
import { PostValidationReviewTargetService, findCurrentPostValidationReviewTarget } from "./PostValidationReviewTargetService";
import { POST_VALIDATION_REVIEW_TARGET_RULES_VERSION, createPostValidationReviewTargetCollection, type PostValidationReviewTargetInput } from "./PostValidationReviewTargetTypes";

const PROJECT_ID = "daily-proof";
const REVIEWER_RUNTIME_ID = "reviewer-1";
const REQUEST_ID = `${PROJECT_ID}:review-fix-request:${REVIEWER_RUNTIME_ID}:review-fix-request-v1`;
const VALIDATED_SHA = "abcdef1234567890abcdef1234567890abcdef12";

describe("PostValidationReviewTargetService", () => {
  it("creates a fresh post-validation target for a completed Validation Runtime", () => {
    const context = createContext();
    const service = createService(context.plan);

    const outcome = service.prepareTarget(context.input, {
      projectId: PROJECT_ID,
      validationRuntimeId: context.validationRuntime.validationRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Ready");
    expect(outcome.reviewTarget?.source).toBe("PostValidation");
    expect(outcome.reviewTarget?.reviewTargetSha).toBe(VALIDATED_SHA);
    expect(outcome.reviewTarget?.validationRuntimeId).toBe(context.validationRuntime.validationRuntimeId);
    expect(outcome.reviewTarget?.reviewTargetId).toBe(createPostValidationReviewTargetId(PROJECT_ID, context.validationRuntime.validationRuntimeId, VALIDATED_SHA));
    expect(outcome.reviewTarget?.reviewTargetId).not.toContain(":review-target:");
    expect(outcome.result.reviewerStarted).toBe(false);
    expect(outcome.result.githubMutationStarted).toBe(false);
  });

  it.each([
    ["missing", undefined, undefined, "POST_VALIDATION_REVIEW_TARGET_VALIDATION_MISSING"],
    ["failed", "Failed", "Failed", "POST_VALIDATION_REVIEW_TARGET_VALIDATION_NOT_COMPLETED"],
    ["timed out", "TimedOut", "TimedOut", "POST_VALIDATION_REVIEW_TARGET_VALIDATION_NOT_COMPLETED"],
  ] as const)("blocks %s Validation Runtime before target readiness", (_label, runtimeStatus, resultStatus, reason) => {
    const context = createContext(runtimeStatus, resultStatus);
    const service = createService(context.plan);
    const input = runtimeStatus ? context.input : { ...context.input, existingValidationRuntimes: createValidationRuntimeCollection({ projectId: PROJECT_ID, runtimes: [], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION }) };

    const outcome = service.prepareTarget(input, {
      projectId: PROJECT_ID,
      validationRuntimeId: context.validationRuntime.validationRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-08T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain(reason);
    expect(outcome.reviewTarget).toBeUndefined();
  });

  it("blocks validation result, evidence, repository, worktree, branch, project, and review-fix mismatches", () => {
    for (const context of [
      createContext("Completed", "Completed", { evidenceExpectedHead: "changed" }),
      createContext("Completed", "Completed", { validationRepositoryId: "other-repo" }),
      createContext("Completed", "Completed", { validationWorktreePath: "C:/other" }),
      createContext("Completed", "Completed", { validationBranch: "other" }),
      createContext("Completed", "Completed", { validationProjectId: "other-project" }),
      createContext("Completed", "Completed", { reviewFixRuntimeId: "other-runtime" }),
      createContext("Completed", "Completed", { reviewFixRuntimeResultId: "other-result" }),
    ]) {
      const service = createService(context.plan);
      const outcome = service.prepareTarget(context.input, {
        projectId: context.plan.projectId,
        validationRuntimeId: context.validationRuntime.validationRuntimeId,
        actor: "Local Human",
        requestedAt: "2026-08-08T00:00:00.000Z",
      });
      expect(outcome.result.status).toBe("Blocked");
      expect(outcome.reviewTarget).toBeUndefined();
    }
  });

  it("validates actor before idempotency and keeps collections copy-safe", () => {
    const context = createContext();
    const service = createService(context.plan);
    const ready = service.prepareTarget(context.input, {
      projectId: PROJECT_ID,
      validationRuntimeId: context.validationRuntime.validationRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-08T00:00:00.000Z",
    });
    const collection = createPostValidationReviewTargetCollection({
      projectId: PROJECT_ID,
      targets: [ready.reviewTarget!],
      rulesVersion: POST_VALIDATION_REVIEW_TARGET_RULES_VERSION,
    });
    (ready.reviewTarget!.validationCommands as string[]).push("git push");

    const automated = service.prepareTarget({
      ...context.input,
      existingPostValidationReviewTargets: collection,
    }, {
      projectId: PROJECT_ID,
      validationRuntimeId: context.validationRuntime.validationRuntimeId,
      actor: "Codex",
      requestedAt: "2026-08-08T00:01:00.000Z",
    });
    const idempotent = service.prepareTarget({
      ...context.input,
      existingPostValidationReviewTargets: collection,
    }, {
      projectId: PROJECT_ID,
      validationRuntimeId: context.validationRuntime.validationRuntimeId,
      actor: "Local Human",
      requestedAt: "2026-08-08T00:01:00.000Z",
    });

    expect(collection.targets[0]!.validationCommands).toEqual(["npm test"]);
    expect(automated.result.reasonCodes).toContain("POST_VALIDATION_REVIEW_TARGET_INVALID_ACTOR");
    expect(idempotent.result.status).toBe("AlreadyReady");
    expect(findCurrentPostValidationReviewTarget(collection, context.validationRuntime)?.reviewTargetSha).toBe(VALIDATED_SHA);
  });
});

function createService(revalidatedPlan: ReviewFixPlan | undefined) {
  const service = new PostValidationReviewTargetService();
  const internals = service as unknown as {
    reviewDecisionService: { classify: ReturnType<typeof vi.fn> };
    reviewFixPlanService: { planFix: ReturnType<typeof vi.fn> };
  };
  internals.reviewDecisionService = {
    classify: vi.fn(() => ({ state: "ChangesRequested", reviewerRuntimeId: REVIEWER_RUNTIME_ID, decision: "ChangesRequested" })),
  };
  internals.reviewFixPlanService = {
    planFix: vi.fn(() => ({ result: { status: "AlreadyPlanned" }, plan: revalidatedPlan })),
  };
  return service;
}

function createContext(
  runtimeStatus: ValidationRuntime["status"] = "Completed",
  resultStatus: ValidationRuntimeResult["status"] = "Completed",
  overrides: Partial<ReviewFixPlan> & {
    evidenceExpectedHead?: string;
    reviewFixRuntimeId?: string;
    reviewFixRuntimeResultId?: string;
    validationRepositoryId?: string;
    validationWorktreePath?: string;
    validationBranch?: string;
    validationProjectId?: string;
  } = {},
) {
  const request = createRequest(overrides);
  const plan = createPlan(request, overrides);
  const fixRuntime = createFixRuntime(plan, overrides.reviewFixRuntimeId);
  const fixResult = createFixRuntimeResult(plan, fixRuntime, overrides.reviewFixRuntimeResultId);
  const validationRuntime = createValidationRuntime(plan, fixRuntime, fixResult, runtimeStatus, overrides);
  const validationResult = createValidationResult(validationRuntime, resultStatus);
  const input: PostValidationReviewTargetInput = {
    ...createInput(request),
    existingFixPlans: createReviewFixPlanCollection({ projectId: plan.projectId, plans: [plan], rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION }),
    existingFixRuntimes: createReviewFixRuntimeCollection({ projectId: plan.projectId, runtimes: [fixRuntime], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION }),
    existingFixRuntimeResults: createReviewFixRuntimeResultCollection({ projectId: plan.projectId, results: [fixResult], rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION }),
    existingValidationRuntimes: createValidationRuntimeCollection({ projectId: plan.projectId, runtimes: [validationRuntime], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION }),
    existingValidationRuntimeResults: createValidationRuntimeResultCollection({ projectId: plan.projectId, results: [validationResult], rulesVersion: VALIDATION_RUNTIME_RULES_VERSION }),
  };
  return { request, plan, fixRuntime, fixResult, validationRuntime, validationResult, input };
}

function createInput(request: ReviewFixRequest): ReviewFixPlanInput {
  return {
    projectId: request.projectId,
    executionPlan: {
      planId: request.planId,
      projectId: request.projectId,
      projectTaskId: request.projectTaskId,
      candidateTaskId: request.candidateTaskId,
      employeeId: request.employeeId,
      repositoryId: request.repositoryId,
      worktreePath: request.worktreePath,
      branchName: request.branch,
      specPath: request.specificationPath,
      implementerAgent: request.implementer,
      reviewerAgent: request.reviewer,
      validationCommands: [...request.validationCommands],
      allowedMutationScope: [...request.mutationScope],
    } as ReviewFixPlanInput["executionPlan"],
    readiness: { readinessId: request.readinessId } as ReviewFixPlanInput["readiness"],
    readinessResult: { id: request.readinessResultId } as ReviewFixPlanInput["readinessResult"],
    approval: { approvalId: request.approvalId } as ReviewFixPlanInput["approval"],
    preflight: { preflightId: request.preflightId } as ReviewFixPlanInput["preflight"],
    preflightResult: { id: request.preflightResultId } as ReviewFixPlanInput["preflightResult"],
    runtimeStart: { runtimeStartId: request.runtimeStartId } as ReviewFixPlanInput["runtimeStart"],
    runtimeStartResult: { id: request.runtimeStartResultId } as ReviewFixPlanInput["runtimeStartResult"],
    implementerRuntime: { implementerRuntimeId: request.implementerRuntimeId } as ReviewFixPlanInput["implementerRuntime"],
    implementerRuntimeResult: { id: request.implementerRuntimeResultId } as ReviewFixPlanInput["implementerRuntimeResult"],
    reviewerRuntime: { reviewerRuntimeId: request.reviewerRuntimeId, decision: "ChangesRequested" } as ReviewFixPlanInput["reviewerRuntime"],
    reviewerRuntimeResult: { id: request.reviewerRuntimeResultId, decision: "ChangesRequested", blockingFindingCount: 1, nonBlockingFindingCount: 0 } as ReviewFixPlanInput["reviewerRuntimeResult"],
    reviewTarget: { reviewTargetId: request.reviewTargetId, reviewTargetSha: VALIDATED_SHA } as ReviewFixPlanInput["reviewTarget"],
    existingFixRequests: createReviewFixRequestCollection({ projectId: request.projectId, requests: [request], rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION }),
  };
}

function createRequest(overrides: Partial<ReviewFixPlan> = {}): ReviewFixRequest {
  const projectId = overrides.projectId ?? PROJECT_ID;
  return {
    reviewFixRequestId: REQUEST_ID,
    projectId,
    planId: "plan-1",
    readinessId: "readiness-1",
    readinessResultId: "readiness-result-1",
    approvalId: "approval-1",
    preflightId: "preflight-1",
    preflightResultId: "preflight-result-1",
    runtimeStartId: "start-1",
    runtimeStartResultId: "start-result-1",
    implementerRuntimeId: "implementer-1",
    implementerRuntimeResultId: "implementer-result-1",
    reviewerRuntimeId: REVIEWER_RUNTIME_ID,
    reviewerRuntimeResultId: "reviewer-result-1",
    reviewTargetId: "target-1",
    projectTaskId: "task-1",
    candidateTaskId: "candidate-1",
    employeeId: "employee-1",
    repositoryId: overrides.repositoryId ?? "repo-1",
    worktreePath: overrides.worktreePath ?? "C:/repo/spec-083",
    branch: overrides.branch ?? "codex/083-post-validation-review-foundation",
    specificationPath: "specs/083-post-validation-review-foundation/spec.md",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    validationCommands: ["npm test"],
    mutationScope: ["local-worktree-only"],
    decision: "ChangesRequested",
    blockingFindingCount: 1,
    nonBlockingFindingCount: 0,
    requestedBy: "Local Human",
    requestedAt: "2026-08-08T00:00:00.000Z",
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
  };
}

function createPlan(request: ReviewFixRequest, overrides: Partial<ReviewFixPlan> = {}): ReviewFixPlan {
  return {
    ...request,
    reviewFixPlanId: createReviewFixPlanId(request.projectId, request.reviewFixRequestId),
    plannedBy: "Local Human",
    plannedAt: "2026-08-08T00:00:00.000Z",
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    ...overrides,
  };
}

function createFixRuntime(plan: ReviewFixPlan, id = createReviewFixRuntimeId(plan.projectId, plan.reviewFixPlanId)): ReviewFixRuntime {
  return {
    ...plan,
    reviewFixRuntimeId: id,
    promptId: "prompt-1",
    status: "Completed",
    startedBy: "Local Human",
    startedAt: "2026-08-08T00:00:00.000Z",
    fixExecutionStarted: true,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationRuntimeStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: { providerId: "provider", agentId: "claude", role: "ReviewFixRuntime", commandDisplay: "claude", workingDirectory: plan.worktreePath, started: true, completed: true, timedOut: false, cancelled: false, exitCode: 0, durationMs: 1, stdoutSummary: "", stderrSummary: "", outputTruncated: false },
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}

function createFixRuntimeResult(plan: ReviewFixPlan, runtime: ReviewFixRuntime, id = createReviewFixRuntimeResultId(plan.projectId, runtime.reviewFixRuntimeId)): ReviewFixRuntimeResult {
  return {
    id,
    projectId: plan.projectId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: runtime.reviewFixRuntimeId,
    status: "Completed",
    reasonCodes: ["REVIEW_FIX_RUNTIME_STARTED"],
    started: true,
    alreadyCompleted: false,
    duplicateActiveAttempt: false,
    agentStarted: true,
    implementerStarted: true,
    reviewerStarted: false,
    validationRuntimeStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    resultAt: runtime.startedAt,
    rulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
  };
}

function createValidationRuntime(
  plan: ReviewFixPlan,
  fixRuntime: ReviewFixRuntime,
  fixResult: ReviewFixRuntimeResult,
  status: ValidationRuntime["status"],
  overrides: {
    evidenceExpectedHead?: string;
    validationRepositoryId?: string;
    validationWorktreePath?: string;
    validationBranch?: string;
    validationProjectId?: string;
  } = {},
): ValidationRuntime {
  return {
    validationRuntimeId: createValidationRuntimeId(plan.projectId, fixRuntime.reviewFixRuntimeId),
    projectId: overrides.validationProjectId ?? plan.projectId,
    reviewFixRequestId: plan.reviewFixRequestId,
    reviewFixPlanId: plan.reviewFixPlanId,
    reviewFixRuntimeId: fixRuntime.reviewFixRuntimeId,
    reviewFixRuntimeResultId: fixResult.id,
    planId: plan.planId,
    readinessId: plan.readinessId,
    readinessResultId: plan.readinessResultId,
    approvalId: plan.approvalId,
    preflightId: plan.preflightId,
    preflightResultId: plan.preflightResultId,
    runtimeStartId: plan.runtimeStartId,
    runtimeStartResultId: plan.runtimeStartResultId,
    implementerRuntimeId: plan.implementerRuntimeId,
    implementerRuntimeResultId: plan.implementerRuntimeResultId,
    reviewerRuntimeId: plan.reviewerRuntimeId,
    reviewerRuntimeResultId: plan.reviewerRuntimeResultId,
    reviewTargetId: plan.reviewTargetId,
    projectTaskId: plan.projectTaskId,
    candidateTaskId: plan.candidateTaskId,
    employeeId: plan.employeeId,
    repositoryId: overrides.validationRepositoryId ?? plan.repositoryId,
    worktreePath: overrides.validationWorktreePath ?? plan.worktreePath,
    branch: overrides.validationBranch ?? plan.branch,
    expectedHead: VALIDATED_SHA,
    specificationPath: plan.specificationPath,
    implementer: plan.implementer,
    reviewer: plan.reviewer,
    validationCommands: ["npm test"],
    mutationScope: ["local-worktree-only"],
    reviewFixRuntimeRulesVersion: REVIEW_FIX_RUNTIME_RULES_VERSION,
    status,
    startedBy: "Local Human",
    startedAt: "2026-08-08T00:00:00.000Z",
    validationRuntimeStarted: true,
    validationStarted: status === "Completed",
    commandExecutionStarted: status === "Completed",
    reviewerStarted: false,
    reviewTargetCreated: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    evidence: { providerId: "validation", role: "ValidationRuntime", workingDirectory: plan.worktreePath, expectedHead: overrides.evidenceExpectedHead ?? VALIDATED_SHA, commandCount: 1, completedCommandCount: status === "Completed" ? 1 : 0, failedCommandCount: status === "Failed" ? 1 : 0, timedOutCommandCount: status === "TimedOut" ? 1 : 0, commands: [{ commandDisplay: "npm test", started: status !== "Blocked", completed: status === "Completed", timedOut: status === "TimedOut", exitCode: status === "Completed" ? 0 : 1, durationMs: 1, stdoutSummary: "", stderrSummary: "", outputTruncated: false }] },
    rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
  };
}

function createValidationResult(runtime: ValidationRuntime, status: ValidationRuntimeResult["status"]): ValidationRuntimeResult {
  return {
    id: createValidationRuntimeResultId(runtime.projectId, runtime.validationRuntimeId),
    projectId: runtime.projectId,
    reviewFixRuntimeId: runtime.reviewFixRuntimeId,
    validationRuntimeId: runtime.validationRuntimeId,
    status,
    reasonCodes: [status === "Completed" ? "VALIDATION_RUNTIME_STARTED" : "VALIDATION_RUNTIME_COMMAND_FAILED"],
    started: status === "Completed",
    alreadyCompleted: false,
    commandCount: 1,
    completedCommandCount: status === "Completed" ? 1 : 0,
    failedCommandCount: status === "Failed" ? 1 : 0,
    timedOutCommandCount: status === "TimedOut" ? 1 : 0,
    validationRuntimeStarted: true,
    validationStarted: status === "Completed",
    commandExecutionStarted: status === "Completed",
    reviewerStarted: false,
    reviewTargetCreated: false,
    promotionStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    pushStarted: false,
    prStarted: false,
    readyForReviewStarted: false,
    mergeStarted: false,
    deployStarted: false,
    branchDeletionStarted: false,
    resultAt: runtime.startedAt,
    rulesVersion: VALIDATION_RUNTIME_RULES_VERSION,
  };
}
