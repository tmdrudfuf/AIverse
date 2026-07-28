import { describe, expect, it } from "vitest";
import {
  copyCandidatePromotionDecision,
  createCandidatePromotionReviewCollection,
  createPromotionDecisionId,
  type CandidatePromotionDecision,
  type CandidatePromotionReview,
} from "./CandidatePromotionTypes";

describe("CandidatePromotionTypes", () => {
  it("creates stable decision identifiers from project, Candidate Task, and ruleset", () => {
    expect(createPromotionDecisionId("daily-proof", "candidate-1")).toBe(
      "daily-proof:candidate-promotion:candidate-1:candidate-promotion-v1",
    );
  });

  it("defensively copies nested review and decision arrays", () => {
    const review = createReview();
    const collection = createCandidatePromotionReviewCollection({
      projectId: "daily-proof",
      sourceCandidateTaskStatus: "Succeeded",
      sourceAssignmentStatus: "Succeeded",
      reviewStatus: "Succeeded",
      reviews: [review],
      selectedIndex: 0,
      generatedAt: "2026-07-28T00:00:00.000Z",
      rulesetVersion: "candidate-promotion-v1",
      sourceCandidateTaskCount: 1,
      sourceAssignmentCount: 1,
    });

    review.availableActions.push("Rejected");
    collection.reviews[0]!.eligibility.reasonCodes.push("ASSIGNMENT_UNAVAILABLE");

    const copiedDecision = copyCandidatePromotionDecision(createDecision());
    copiedDecision.eligibilityReasonCodes.push("ASSIGNMENT_UNAVAILABLE");
    const next = createCandidatePromotionReviewCollection({
      projectId: "daily-proof",
      sourceCandidateTaskStatus: "Succeeded",
      sourceAssignmentStatus: "Succeeded",
      reviewStatus: "Succeeded",
      reviews: [createReview()],
      selectedIndex: 0,
      generatedAt: "2026-07-28T00:00:00.000Z",
      rulesetVersion: "candidate-promotion-v1",
      sourceCandidateTaskCount: 1,
      sourceAssignmentCount: 1,
    });

    expect(collection.reviews[0]!.availableActions).toEqual(["Approved", "Deferred"]);
    expect(next.reviews[0]!.eligibility.reasonCodes).toEqual(["ELIGIBLE_RECOMMENDED_ASSIGNMENT"]);
    expect(createDecision().eligibilityReasonCodes).toEqual(["ELIGIBLE_RECOMMENDED_ASSIGNMENT"]);
  });
});

function createReview(): CandidatePromotionReview {
  return {
    id: "promotion-1",
    projectId: "daily-proof",
    candidateTaskId: "candidate-1",
    candidateTaskTitle: "Fix bug",
    candidateTaskType: "Bug",
    candidateTaskPriority: "High",
    candidateTaskState: "Open",
    candidateTaskProvenance: {
      candidateTaskId: "candidate-1",
      originatingIssueId: "issue-1",
      issueNumber: 1,
      sourceProvider: "github",
    },
    assignmentRecommendationId: "assignment-1",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    assignmentStatus: "Recommended",
    promotionStatus: "PendingReview",
    eligibility: {
      status: "PendingReview",
      isApprovable: true,
      reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
      summary: "Ready.",
    },
    availableActions: ["Approved", "Deferred"],
    rulesetVersion: "candidate-promotion-v1",
  };
}

function createDecision(): CandidatePromotionDecision {
  return {
    id: "promotion-1",
    projectId: "daily-proof",
    candidateTaskId: "candidate-1",
    candidateTaskTitle: "Fix bug",
    candidateTaskType: "Bug",
    candidateTaskPriority: "High",
    candidateTaskProvenance: {
      candidateTaskId: "candidate-1",
      originatingIssueId: "issue-1",
      issueNumber: 1,
      sourceProvider: "github",
    },
    assignmentRecommendationId: "assignment-1",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    promotionStatus: "Approved",
    eligibility: {
      status: "PendingReview",
      isApprovable: true,
      reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
      summary: "Ready.",
    },
    eligibilityReasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
    decisionReasonCode: "HUMAN_APPROVED",
    decisionSource: "Human",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    decisionVersion: 1,
    rulesetVersion: "candidate-promotion-v1",
    activeTaskCreated: false,
    executionStarted: false,
  };
}
