import { describe, expect, it } from "vitest";

import type { ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import type { ReviewFixPlan, ReviewFixPlanResult } from "./ReviewFixPlanTypes";
import { createReviewFixPlanDisplayRows } from "./ReviewFixPlanView";

describe("ReviewFixPlanView", () => {
  it("renders an available plan action only after a current request exists", () => {
    const rows = createReviewFixPlanDisplayRows(createRequest(), undefined);

    expect(rows.statusText).toContain("Plan fixes (G)");
    expect(rows.statusText).toContain("no execution");
  });

  it("renders recorded plans without claiming fix execution", () => {
    const rows = createReviewFixPlanDisplayRows(createRequest(), createPlan());

    expect(rows.statusText).toContain("Fix plan recorded");
    expect(rows.statusText).toContain("no fix execution started");
    expect(rows.statusText).not.toMatch(/running|codex|claude|validation running/i);
  });

  it("renders blocked results with bounded safe reason text", () => {
    const result: ReviewFixPlanResult = {
      id: "result-1",
      projectId: "daily-proof",
      reviewFixRequestId: "request-1",
      status: "Blocked",
      planned: false,
      alreadyPlanned: false,
      reasonCodes: ["REVIEW_FIX_PLAN_REQUEST_STALE"],
      fixExecutionStarted: false,
      validationRuntimeStarted: false,
      codexStarted: false,
      claudeStarted: false,
      subprocessStarted: false,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: "2026-08-06T00:00:00.000Z",
      rulesVersion: "review-fix-plan-v1",
    };

    expect(createReviewFixPlanDisplayRows(undefined, undefined, result).statusText).toBe(
      "Blocked; request stale; no fix execution started",
    );
  });
});

function createRequest(): ReviewFixRequest {
  return {
    reviewFixRequestId: "request-1",
    projectId: "daily-proof",
    planId: "plan-1",
    readinessId: "readiness-1",
    readinessResultId: "readiness-result-1",
    approvalId: "approval-1",
    preflightId: "preflight-1",
    preflightResultId: "preflight-result-1",
    runtimeStartId: "runtime-start-1",
    runtimeStartResultId: "runtime-start-result-1",
    implementerRuntimeId: "implementer-1",
    implementerRuntimeResultId: "implementer-result-1",
    reviewerRuntimeId: "reviewer-1",
    reviewerRuntimeResultId: "reviewer-result-1",
    reviewTargetId: "target-1",
    projectTaskId: "task-1",
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
    rulesVersion: "review-fix-request-v1",
  };
}

function createPlan(): ReviewFixPlan {
  const request = createRequest();
  return {
    ...request,
    reviewFixPlanId: "plan-1",
    reviewFixRequestId: request.reviewFixRequestId,
    plannedBy: "Local Human",
    plannedAt: "2026-08-06T00:01:00.000Z",
    rulesVersion: "review-fix-plan-v1",
  };
}
