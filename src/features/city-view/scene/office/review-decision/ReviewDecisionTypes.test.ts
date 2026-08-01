import { describe, expect, it } from "vitest";

import {
  createReviewPromotionCollection,
  createReviewPromotionId,
  createReviewPromotionResultCollection,
  createReviewPromotionResultId,
  REVIEW_PROMOTION_RULES_VERSION,
  type ReviewPromotion,
  type ReviewPromotionResult,
} from "./ReviewDecisionTypes";

function createPromotion(overrides: Partial<ReviewPromotion> = {}): ReviewPromotion {
  return {
    reviewPromotionId: createReviewPromotionId("project-1", "reviewer-runtime-1"),
    projectId: "project-1",
    planId: "plan-1",
    runtimeStartId: "start-1",
    implementerRuntimeId: "implementer-1",
    reviewerRuntimeId: "reviewer-runtime-1",
    reviewTargetId: "target-1",
    worktreePath: "C:/worktrees/077",
    branch: "codex/077",
    repositoryId: "repo-1",
    implementer: "Implementer",
    reviewer: "Reviewer",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    decision: "Approved",
    promotedBy: "Local Human",
    promotedAt: "2026-08-01T00:00:00.000Z",
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    ...overrides,
  };
}

function createResult(overrides: Partial<ReviewPromotionResult> = {}): ReviewPromotionResult {
  return {
    id: createReviewPromotionResultId("project-1", "reviewer-runtime-1"),
    projectId: "project-1",
    reviewerRuntimeId: "reviewer-runtime-1",
    reviewPromotionId: "project-1:review-promotion:reviewer-runtime-1:review-promotion-v1",
    granted: true,
    reasonCodes: ["REVIEW_PROMOTION_GRANTED"],
    alreadyPromoted: false,
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    resultAt: "2026-08-01T00:00:00.000Z",
    rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    ...overrides,
  };
}

describe("ReviewDecisionTypes", () => {
  it("builds a deterministic reviewPromotionId from projectId, reviewerRuntimeId, and rulesVersion", () => {
    const id = createReviewPromotionId("project-1", "reviewer-runtime-1");
    expect(id).toBe("project-1:review-promotion:reviewer-runtime-1:review-promotion-v1");
    expect(createReviewPromotionId("project-1", "reviewer-runtime-1")).toBe(id);
  });

  it("builds a deterministic reviewPromotionResultId distinct from the promotion id", () => {
    const resultId = createReviewPromotionResultId("project-1", "reviewer-runtime-1");
    expect(resultId).toBe("project-1:review-promotion-result:reviewer-runtime-1:review-promotion-v1");
    expect(resultId).not.toBe(createReviewPromotionId("project-1", "reviewer-runtime-1"));
  });

  it("keeps validationStarted/repositoryMutationStarted/githubMutationStarted literal-false on a ReviewPromotion", () => {
    const promotion = createPromotion();
    expect(promotion.validationStarted).toBe(false);
    expect(promotion.repositoryMutationStarted).toBe(false);
    expect(promotion.githubMutationStarted).toBe(false);
  });

  it("keeps validationStarted/repositoryMutationStarted/githubMutationStarted literal-false on a ReviewPromotionResult", () => {
    const result = createResult();
    expect(result.validationStarted).toBe(false);
    expect(result.repositoryMutationStarted).toBe(false);
    expect(result.githubMutationStarted).toBe(false);
  });

  it("createReviewPromotionCollection copies entries and derives promotionCount", () => {
    const promotion = createPromotion();
    const collection = createReviewPromotionCollection({
      projectId: "project-1",
      promotions: [promotion],
      rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    });

    expect(collection.promotionCount).toBe(1);
    expect(collection.promotions[0]).toEqual(promotion);
    expect(collection.promotions[0]).not.toBe(promotion);
  });

  it("createReviewPromotionResultCollection copies entries (including reasonCodes) and derives resultCount", () => {
    const result = createResult();
    const collection = createReviewPromotionResultCollection({
      projectId: "project-1",
      results: [result],
      rulesVersion: REVIEW_PROMOTION_RULES_VERSION,
    });

    expect(collection.resultCount).toBe(1);
    expect(collection.results[0]).toEqual(result);
    expect(collection.results[0].reasonCodes).not.toBe(result.reasonCodes);
  });
});
