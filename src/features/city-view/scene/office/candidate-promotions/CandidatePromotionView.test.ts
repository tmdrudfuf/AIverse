import { describe, expect, it } from "vitest";
import type { CandidatePromotionReview, CandidatePromotionReviewCollection, CandidatePromotionStatus } from "./CandidatePromotionTypes";
import { createCandidatePromotionDisplayRows } from "./CandidatePromotionView";

describe("CandidatePromotionView", () => {
  it.each([
    ["PendingReview", "Pending review"],
    ["Approved", "Approved for future promotion"],
    ["Rejected", "Rejected"],
    ["Deferred", "Deferred"],
    ["NeedsReview", "Needs review"],
    ["Ineligible", "Ineligible"],
    ["Unavailable", "Unavailable"],
  ] as const)("renders %s status safely", (status, label) => {
    const rows = createCandidatePromotionDisplayRows(collection([review({ promotionStatus: status })]));

    expect(rows.statusText).toBe("Succeeded - 1 promotion review");
    expect(rows.reviewText).toContain(label);
    expect(rows.reviewText).toContain("No active work created");
    expect(rows.reviewText).not.toMatch(/Working|Started|Running|Assigned and active|Executing|Coding now/i);
  });

  it("renders selected review count, employee, action labels, and +N more", () => {
    const rows = createCandidatePromotionDisplayRows({
      ...collection([
        review({ candidateTaskTitle: "Short first task" }),
        review({
          candidateTaskId: "candidate-2",
          candidateTaskTitle: "Investigate a very long promotion title that must fit",
          recommendedEmployeeName: "Alexandria Fitzgerald-Worthington",
        }),
        review({ candidateTaskId: "candidate-3" }),
      ]),
      selectedIndex: 1,
    });

    expect(rows.statusText).toBe("Succeeded - 3 promotion reviews");
    expect(rows.reviewText).toContain("#2 Pending review");
    expect(rows.reviewText).toContain("Investigate a very long...");
    expect(rows.reviewText).toContain("Alexandria Fitz...");
    expect(rows.reviewText).toContain("Approve for promotion");
    expect(rows.reviewText).toContain("+2 more");
  });

  it("renders unavailable collections distinctly", () => {
    const rows = createCandidatePromotionDisplayRows({
      ...collection([]),
      reviewStatus: "Unavailable",
      errorSummary: "Candidate tasks unavailable.",
    });

    expect(rows.statusText).toBe("Unavailable: Candidate tasks unavailable.");
  });
});

function collection(reviews: CandidatePromotionReview[]): CandidatePromotionReviewCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    sourceAssignmentStatus: "Succeeded",
    reviewStatus: "Succeeded",
    reviews,
    reviewCount: reviews.length,
    selectedIndex: 0,
    generatedAt: "2026-07-28T00:00:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
    sourceCandidateTaskCount: reviews.length,
    sourceAssignmentCount: reviews.length,
  };
}

function review(overrides: Partial<CandidatePromotionReview> = {}): CandidatePromotionReview {
  const promotionStatus = overrides.promotionStatus ?? "PendingReview";
  return {
    id: "promotion-1",
    projectId: "daily-proof",
    candidateTaskId: "candidate-1",
    candidateTaskTitle: "Fix crash on launch",
    candidateTaskType: "Bug",
    candidateTaskPriority: "High",
    candidateTaskState: "Open",
    candidateTaskProvenance: {
      candidateTaskId: "candidate-1",
      originatingIssueId: "issue-1",
      issueNumber: 12,
      sourceProvider: "github",
    },
    assignmentRecommendationId: "assignment-1",
    recommendedEmployeeId: "gpt-engineer",
    recommendedEmployeeName: "GPT Engineer",
    assignmentStatus: "Recommended",
    promotionStatus,
    eligibility: {
      status: promotionStatus === "Unavailable" ? "Unavailable" : promotionStatus === "Ineligible" ? "Ineligible" : "PendingReview",
      isApprovable: promotionStatus !== "Unavailable" && promotionStatus !== "Ineligible",
      reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
      summary: "Ready for human promotion review.",
    },
    availableActions: ["Approved", "Rejected", "Deferred", "PendingReview"] as CandidatePromotionStatus[],
    rulesetVersion: "candidate-promotion-v1",
    ...overrides,
  };
}
