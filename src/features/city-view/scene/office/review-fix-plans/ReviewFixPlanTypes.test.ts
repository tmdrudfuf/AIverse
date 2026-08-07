import { describe, expect, it } from "vitest";

import {
  REVIEW_FIX_PLAN_RULES_VERSION,
  createReviewFixPlanCollection,
  createReviewFixPlanId,
  createReviewFixPlanResultCollection,
  createReviewFixPlanResultId,
  type ReviewFixPlan,
  type ReviewFixPlanResult,
} from "./ReviewFixPlanTypes";

describe("ReviewFixPlanTypes", () => {
  it("creates deterministic project-scoped IDs without timestamps or names", () => {
    expect(createReviewFixPlanId("daily-proof", "request-1")).toBe(
      "daily-proof:review-fix-plan:request-1:review-fix-plan-v1",
    );
    expect(createReviewFixPlanResultId("daily-proof", "request-1")).toBe(
      "daily-proof:review-fix-plan-result:request-1:review-fix-plan-v1",
    );
  });

  it("defensively copies plan and result arrays", () => {
    const plan = createPlan();
    const result = createResult(plan);
    const planCollection = createReviewFixPlanCollection({
      projectId: "daily-proof",
      plans: [plan],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });
    const resultCollection = createReviewFixPlanResultCollection({
      projectId: "daily-proof",
      results: [result],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });

    plan.validationCommands.push("git push");
    plan.mutationScope.push("remote");
    result.reasonCodes.push("REVIEW_FIX_PLAN_INTERNAL_FAILURE");
    planCollection.plans[0]!.validationCommands.push("mutated");
    resultCollection.results[0]!.reasonCodes.push("REVIEW_FIX_PLAN_REQUEST_STALE");

    const secondPlanCollection = createReviewFixPlanCollection({
      projectId: "daily-proof",
      plans: [planCollection.plans[0]!],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });
    const secondResultCollection = createReviewFixPlanResultCollection({
      projectId: "daily-proof",
      results: [resultCollection.results[0]!],
      rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
    });

    expect(secondPlanCollection.plans[0]!.validationCommands).toEqual(["npm test", "mutated"]);
    expect(secondPlanCollection.plans[0]!.mutationScope).toEqual(["local-worktree-only"]);
    expect(secondResultCollection.results[0]!.reasonCodes).toEqual([
      "REVIEW_FIX_PLAN_PLANNED",
      "REVIEW_FIX_PLAN_REQUEST_STALE",
    ]);
  });
});

function createPlan(): ReviewFixPlan {
  return {
    reviewFixPlanId: createReviewFixPlanId("daily-proof", "request-1"),
    projectId: "daily-proof",
    reviewFixRequestId: "request-1",
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
    plannedBy: "Local Human",
    plannedAt: "2026-08-06T00:00:00.000Z",
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
  };
}

function createResult(plan: ReviewFixPlan): ReviewFixPlanResult {
  return {
    id: createReviewFixPlanResultId(plan.projectId, plan.reviewFixRequestId),
    projectId: plan.projectId,
    reviewFixRequestId: plan.reviewFixRequestId,
    reviewerRuntimeId: plan.reviewerRuntimeId,
    reviewFixPlanId: plan.reviewFixPlanId,
    status: "Planned",
    planned: true,
    alreadyPlanned: false,
    reasonCodes: ["REVIEW_FIX_PLAN_PLANNED"],
    fixExecutionStarted: false,
    validationRuntimeStarted: false,
    codexStarted: false,
    claudeStarted: false,
    subprocessStarted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-08-06T00:00:00.000Z",
    rulesVersion: REVIEW_FIX_PLAN_RULES_VERSION,
  };
}
