import { describe, expect, it } from "vitest";
import { assignment, assignments, collection, task } from "./CandidatePromotionEligibility.test";
import { CandidatePromotionService, isTransitionAllowed } from "./CandidatePromotionService";

describe("CandidatePromotionService", () => {
  it("creates one promotion review per Candidate Task in collection order", () => {
    const tasks = [task({ id: "candidate-b", title: "Second" }), task({ id: "candidate-a", title: "First", issueNumber: 2 })];
    const result = service().createReviewCollection(collection(tasks), assignments([
      assignment({ candidateTaskId: "candidate-b" }),
      assignment({ candidateTaskId: "candidate-a", provenance: { candidateTaskId: "candidate-a", originatingIssueId: "issue-1", issueNumber: 2 } }),
    ]), {}, 0);

    expect(result.reviewStatus).toBe("Succeeded");
    expect(result.reviewCount).toBe(2);
    expect(result.reviews.map((review) => review.candidateTaskId)).toEqual(["candidate-b", "candidate-a"]);
  });

  it("deduplicates Candidate Task IDs", () => {
    const duplicate = task({ id: "candidate-1", title: "Duplicate" });
    const result = service().createReviewCollection(collection([task(), duplicate]), assignments([assignment()]), {}, 0);

    expect(result.reviewCount).toBe(1);
    expect(result.reviews[0]!.candidateTaskTitle).toBe("Fix a bug");
  });

  it("applies valid human decisions with stable identity and no execution flags", () => {
    const reviewCollection = service().createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const applied = service().applyDecision(reviewCollection, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: "Approved",
      decidedAt: "2026-07-28T01:00:00.000Z",
      humanNote: "  ship it later  ",
    });

    expect(applied.accepted).toBe(true);
    expect(applied.decision).toMatchObject({
      id: "daily-proof:candidate-promotion:candidate-1:candidate-promotion-v1",
      promotionStatus: "Approved",
      humanNote: "ship it later",
      activeTaskCreated: false,
      executionStarted: false,
    });
  });

  it.each([
    ["PendingReview", "Rejected"],
    ["PendingReview", "Deferred"],
    ["Deferred", "Approved"],
    ["Rejected", "PendingReview"],
    ["Approved", "Deferred"],
  ] as const)("allows %s to %s when safe", (from, to) => {
    const reviewCollection = service().createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const first = service().applyDecision(reviewCollection, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: from,
      decidedAt: "2026-07-28T01:00:00.000Z",
    });
    const refreshed = service().createReviewCollection(collection([task()]), assignments([assignment()]), first.decisions, 0);
    const second = service().applyDecision(refreshed, first.decisions, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: to,
      decidedAt: "2026-07-28T02:00:00.000Z",
    });

    expect(second.accepted).toBe(true);
    expect(second.decision?.promotionStatus).toBe(to);
    expect(second.decision?.id).toBe(first.decision?.id);
  });

  it("rejects approval for ineligible Candidate Tasks", () => {
    const closed = task({ state: "Closed" });
    const reviewCollection = service().createReviewCollection(collection([closed]), assignments([assignment()]), {}, 0);
    const applied = service().applyDecision(reviewCollection, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: "Approved",
      decidedAt: "2026-07-28T01:00:00.000Z",
    });

    expect(applied.accepted).toBe(false);
    expect(Object.keys(applied.decisions)).toEqual([]);
  });

  it("advertises only transition targets that can be applied", () => {
    const svc = service();
    const initial = svc.createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const rejected = svc.applyDecision(initial, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: "Rejected",
      decidedAt: "2026-07-28T01:00:00.000Z",
    });
    const refreshed = svc.createReviewCollection(collection([task()]), assignments([assignment()]), rejected.decisions, 0);
    const review = refreshed.reviews[0]!;

    expect(review.promotionStatus).toBe("Rejected");
    expect(review.availableActions).toEqual(["Deferred", "PendingReview"]);
    expect(review.availableActions.every((targetStatus) =>
      isTransitionAllowed(review.promotionStatus, targetStatus, review.eligibility.isApprovable)
    )).toBe(true);
  });

  it("preserves project isolation for identical Candidate Task IDs", () => {
    const firstCollection = service().createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const secondTask = task({ projectId: "portfolio" });
    const secondCollection = service().createReviewCollection({
      ...collection([secondTask]),
      projectId: "portfolio",
    }, {
      ...assignments([assignment({ projectId: "portfolio" })]),
      projectId: "portfolio",
    }, {}, 0);

    expect(firstCollection.reviews[0]!.id).not.toBe(secondCollection.reviews[0]!.id);
  });

  it("refresh retains matching decisions while updating eligibility", () => {
    const svc = service();
    const initial = svc.createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const approved = svc.applyDecision(initial, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: "Approved",
      decidedAt: "2026-07-28T01:00:00.000Z",
    });
    const refreshed = svc.createReviewCollection(collection([task({ state: "Closed" })]), assignments([assignment()]), approved.decisions, 0);

    expect(refreshed.reviews[0]!.promotionStatus).toBe("Approved");
    expect(refreshed.reviews[0]!.eligibility.status).toBe("Ineligible");
    expect(refreshed.reviews[0]!.eligibility.isApprovable).toBe(false);
  });

  it("defensively copies decisions and review arrays", () => {
    const svc = service();
    const initial = svc.createReviewCollection(collection([task()]), assignments([assignment()]), {}, 0);
    const applied = svc.applyDecision(initial, {}, {
      projectId: "daily-proof",
      candidateTaskId: "candidate-1",
      targetStatus: "Approved",
      decidedAt: "2026-07-28T01:00:00.000Z",
    });
    applied.decision!.eligibilityReasonCodes.push("ASSIGNMENT_UNAVAILABLE");
    initial.reviews[0]!.availableActions.push("Unavailable");
    const refreshed = svc.createReviewCollection(collection([task()]), assignments([assignment()]), applied.decisions, 0);

    expect(refreshed.reviews[0]!.availableActions).not.toContain("Unavailable");
    expect(refreshed.reviews[0]!.decision?.eligibilityReasonCodes).toEqual(["ELIGIBLE_RECOMMENDED_ASSIGNMENT"]);
  });
});

function service() {
  return new CandidatePromotionService();
}
