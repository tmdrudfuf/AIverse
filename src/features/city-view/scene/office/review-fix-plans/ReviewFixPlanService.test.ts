import { describe, expect, it, vi } from "vitest";

import {
  REVIEW_FIX_REQUEST_RULES_VERSION,
  createReviewFixRequestCollection,
  type ReviewFixRequest,
} from "../review-fix-requests/ReviewFixRequestTypes";
import {
  REVIEW_FIX_PLAN_RULES_VERSION,
  createReviewFixPlanCollection,
  createReviewFixPlanId,
  type ReviewFixPlanInput,
} from "./ReviewFixPlanTypes";
import { ReviewFixPlanService } from "./ReviewFixPlanService";

const PROJECT_ID = "daily-proof";
const REVIEWER_RUNTIME_ID = "reviewer-1";
const REQUEST_ID = `${PROJECT_ID}:review-fix-request:${REVIEWER_RUNTIME_ID}:review-fix-request-v1`;

describe("ReviewFixPlanService", () => {
  it("creates one exact-context fix plan after request revalidation passes", () => {
    const request = createRequest();
    const service = createService();

    const outcome = service.planFix(createInput(request), {
      projectId: PROJECT_ID,
      reviewFixRequestId: request.reviewFixRequestId,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Planned");
    expect(outcome.plan?.reviewFixPlanId).toBe(createReviewFixPlanId(PROJECT_ID, request.reviewFixRequestId));
    expect(outcome.plan?.reviewFixRequestId).toBe(request.reviewFixRequestId);
    expect(outcome.plan?.validationCommands).toEqual(["npm test"]);
    expect(outcome.plan?.mutationScope).toEqual(["local-worktree-only"]);
    expect(outcome.plan?.fixExecutionStarted).toBe(false);
    expect(outcome.plan?.validationRuntimeStarted).toBe(false);
    expect(outcome.plan?.codexStarted).toBe(false);
    expect(outcome.plan?.claudeStarted).toBe(false);
    expect(outcome.plan?.subprocessStarted).toBe(false);
    expect(outcome.plan?.repositoryMutationStarted).toBe(false);
    expect(outcome.plan?.githubMutationStarted).toBe(false);
  });

  it("returns AlreadyPlanned only after revalidation and exact-context comparison", () => {
    const request = createRequest();
    const service = createService();
    const command = {
      projectId: PROJECT_ID,
      reviewFixRequestId: request.reviewFixRequestId,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    };
    const first = service.planFix(createInput(request), command);

    const second = service.planFix({
      ...createInput(request),
      existingFixPlans: first.planCollection,
      existingFixPlanResults: first.resultCollection,
    }, { ...command, plannedAt: "2026-08-06T00:01:00.000Z" });

    expect(second.result.status).toBe("AlreadyPlanned");
    expect(second.planCollection?.plans).toHaveLength(1);
    expect(second.plan?.plannedAt).toBe("2026-08-06T00:00:00.000Z");
  });

  it("blocks invalid actors before idempotent success", () => {
    const request = createRequest();
    const service = createService();
    const existingPlan = service.planFix(createInput(request), {
      projectId: PROJECT_ID,
      reviewFixRequestId: request.reviewFixRequestId,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    }).plan!;
    const blocked = service.planFix({
      ...createInput(request),
      existingFixPlans: createReviewFixPlanCollection({
        projectId: PROJECT_ID,
        plans: [existingPlan],
        rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixRequestId: request.reviewFixRequestId,
      actor: "Codex",
      plannedAt: "2026-08-06T00:01:00.000Z",
    });

    expect(blocked.result.status).toBe("Blocked");
    expect(blocked.result.reasonCodes).toContain("REVIEW_FIX_PLAN_INVALID_ACTOR");
    expect(blocked.plan).toBeUndefined();
  });

  it("blocks stale request revalidation instead of creating a plan", () => {
    const request = createRequest();
    const service = createService("Blocked");

    const outcome = service.planFix(createInput(request), {
      projectId: PROJECT_ID,
      reviewFixRequestId: request.reviewFixRequestId,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(outcome.result.status).toBe("Blocked");
    expect(outcome.result.reasonCodes).toContain("REVIEW_FIX_PLAN_REQUEST_STALE");
    expect(outcome.planCollection).toBeUndefined();
  });

  it("blocks missing or foreign project requests", () => {
    const service = createService();
    const missing = service.planFix({
      ...createInput(createRequest()),
      existingFixRequests: createReviewFixRequestCollection({
        projectId: PROJECT_ID,
        requests: [],
        rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
      }),
    }, {
      projectId: PROJECT_ID,
      reviewFixRequestId: REQUEST_ID,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    });
    const foreignRequest = createRequest({ projectId: "other-project" });
    const foreign = service.planFix(createInput(foreignRequest), {
      projectId: PROJECT_ID,
      reviewFixRequestId: foreignRequest.reviewFixRequestId,
      actor: "Local Human",
      plannedAt: "2026-08-06T00:00:00.000Z",
    });

    expect(missing.result.status).toBe("Blocked");
    expect(missing.result.reasonCodes).toContain("REVIEW_FIX_PLAN_REQUEST_MISSING");
    expect(foreign.result.status).toBe("Blocked");
    expect(foreign.result.reasonCodes).toContain("REVIEW_FIX_PLAN_REQUEST_MISSING");
  });
});

function createService(requestStatus: "Requested" | "AlreadyRequested" | "Blocked" = "AlreadyRequested") {
  const service = new ReviewFixPlanService();
  const internals = service as unknown as {
    reviewDecisionService: { classify: ReturnType<typeof vi.fn> };
    reviewFixRequestService: { requestFix: ReturnType<typeof vi.fn> };
  };
  internals.reviewDecisionService = {
    classify: vi.fn(() => ({
      state: "ChangesRequested",
      reviewerRuntimeId: REVIEWER_RUNTIME_ID,
      decision: "ChangesRequested",
    })),
  };
  internals.reviewFixRequestService = {
    requestFix: vi.fn(() => ({
      result: {
        status: requestStatus,
      },
    })),
  };
  return service;
}

function createInput(request: ReviewFixRequest): ReviewFixPlanInput {
  return {
    projectId: PROJECT_ID,
    executionPlan: {
      planId: request.planId,
      projectId: PROJECT_ID,
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
    reviewerRuntime: {
      reviewerRuntimeId: request.reviewerRuntimeId,
      approvedImplementerAgent: request.approvedImplementerAgent,
      approvedReviewerAgent: request.approvedReviewerAgent,
      decision: "ChangesRequested",
    } as ReviewFixPlanInput["reviewerRuntime"],
    reviewerRuntimeResult: {
      id: request.reviewerRuntimeResultId,
      decision: "ChangesRequested",
      blockingFindingCount: request.blockingFindingCount,
      nonBlockingFindingCount: request.nonBlockingFindingCount,
    } as ReviewFixPlanInput["reviewerRuntimeResult"],
    reviewTarget: { reviewTargetId: request.reviewTargetId } as ReviewFixPlanInput["reviewTarget"],
    existingFixRequests: createReviewFixRequestCollection({
      projectId: PROJECT_ID,
      requests: [request],
      rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    }),
  };
}

function createRequest(overrides: Partial<ReviewFixRequest> = {}): ReviewFixRequest {
  return {
    reviewFixRequestId: REQUEST_ID,
    projectId: PROJECT_ID,
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
    repositoryId: "repo-1",
    worktreePath: "C:/repo/spec-080",
    branch: "codex/080-review-fix-plan-foundation",
    specificationPath: "specs/080-review-fix-plan-foundation/spec.md",
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
    requestedAt: "2026-08-06T00:00:00.000Z",
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_REQUEST_RULES_VERSION,
    ...overrides,
  };
}
