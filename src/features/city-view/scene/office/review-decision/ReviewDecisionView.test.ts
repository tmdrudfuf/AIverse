import { describe, expect, it } from "vitest";

import type { ReviewerRuntimeResultCollection } from "../reviewer-runtime/ReviewerRuntimeTypes";
import { createReviewDecisionDisplayRows } from "./ReviewDecisionView";
import type { ReviewPromotion, ReviewPromotionCollection } from "./ReviewDecisionTypes";

const PROJECT_ID = "daily-proof";
const WRAP_LENGTH = 78;
const ROW_PREFIX = "[REVIEW DECISION] ";

function createReviewerResults(
  status: "Completed" | "TimedOut" | "Blocked" | "Failed" | undefined,
  decision: "Approved" | "ChangesRequested" | "Unknown" = "Unknown",
  reviewerRuntimeId = "reviewer-runtime-1",
): ReviewerRuntimeResultCollection | undefined {
  if (!status) return undefined;
  return {
    projectId: PROJECT_ID,
    results: [
      {
        id: "reviewer-result-1",
        projectId: PROJECT_ID,
        runtimeStartId: "runtime-start-1",
        implementerRuntimeId: "implementer-runtime-1",
        reviewerRuntimeId: status === "Completed" || status === "TimedOut" ? reviewerRuntimeId : undefined,
        status,
        decision,
        blockingFindingCount: 0,
        nonBlockingFindingCount: 0,
        reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
        started: status === "Completed" || status === "TimedOut",
        duplicateActiveAttempt: false,
        agentStarted: status === "Completed" || status === "TimedOut",
        implementerStarted: true,
        reviewerStarted: status === "Completed" || status === "TimedOut",
        validationStarted: false,
        repositoryMutationStarted: false,
        githubMutationStarted: false,
        resultAt: "2026-07-31T00:00:02.000Z",
        rulesVersion: "codex-reviewer-v1",
      },
    ],
    resultCount: 1,
    rulesVersion: "codex-reviewer-v1",
  };
}

function createPromotion(reviewerRuntimeId = "reviewer-runtime-1"): ReviewPromotion {
  return {
    reviewPromotionId: "review-promotion-1",
    projectId: PROJECT_ID,
    planId: "plan-1",
    runtimeStartId: "runtime-start-1",
    implementerRuntimeId: "implementer-runtime-1",
    reviewerRuntimeId,
    reviewTargetId: "review-target-1",
    worktreePath: "/tmp/worktree",
    branch: "codex/077-review-decision-human-promotion-gate",
    repositoryId: "github:owner/repo",
    implementer: "claude",
    reviewer: "codex",
    approvedImplementerAgent: "claude",
    approvedReviewerAgent: "codex",
    decision: "Approved",
    promotedBy: "Local Human",
    promotedAt: "2026-07-31T00:00:03.000Z",
    validationStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    rulesVersion: "review-promotion-v1",
  };
}

function createPromotions(promotion: ReviewPromotion): ReviewPromotionCollection {
  return {
    projectId: PROJECT_ID,
    promotions: [promotion],
    promotionCount: 1,
    rulesVersion: "review-promotion-v1",
  };
}

describe("createReviewDecisionDisplayRows", () => {
  it("shows Unavailable when no Reviewer Runtime result exists", () => {
    const rows = createReviewDecisionDisplayRows(undefined, undefined);
    expect(rows.statusText).toContain("Unavailable");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Approved awaiting Promote when Completed+Approved with no promotion yet", () => {
    const rows = createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved"), undefined);
    expect(rows.statusText).toContain("Approved");
    expect(rows.statusText).toContain("Promote (P)");
    expect(rows.statusText).not.toContain("Promoted by");
  });

  it("shows Changes Requested and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createReviewerResults("Completed", "ChangesRequested"), undefined);
    expect(rows.statusText).toContain("Changes Requested");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Blocked and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createReviewerResults("Blocked"), undefined);
    expect(rows.statusText).toContain("Blocked");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Timed out and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createReviewerResults("TimedOut"), undefined);
    expect(rows.statusText).toContain("Timed out");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Failed and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createReviewerResults("Failed"), undefined);
    expect(rows.statusText).toContain("Failed");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Promoted with the actor when the promotion still matches the current chain", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const rows = createReviewDecisionDisplayRows(
      createReviewerResults("Completed", "Approved", "reviewer-runtime-1"),
      createPromotions(promotion),
    );
    expect(rows.statusText).toContain("Approved");
    expect(rows.statusText).toContain("Promoted by Local Human");
    expect(rows.statusText).not.toMatch(/merge|push|deploy/i);
  });

  it("shows the promotion as historical/not currently applicable once the chain has since changed", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const rows = createReviewDecisionDisplayRows(
      createReviewerResults("Completed", "Approved", "reviewer-runtime-2"),
      createPromotions(promotion),
    );
    expect(rows.statusText).toContain("historical");
    expect(rows.statusText).toContain("not currently applicable");
  });

  it("shows the promotion as historical when the underlying Reviewer Runtime result is gone entirely", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const rows = createReviewDecisionDisplayRows(undefined, createPromotions(promotion));
    expect(rows.statusText).toContain("historical");
    expect(rows.statusText).toContain("not currently applicable");
  });

  it("never claims a merge, push, PR, validation pass, or repository mutation in any state", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const states = [
      createReviewDecisionDisplayRows(undefined, undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "ChangesRequested"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Blocked"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("TimedOut"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Failed"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved", "reviewer-runtime-1"), createPromotions(promotion)),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved", "reviewer-runtime-2"), createPromotions(promotion)),
    ];

    for (const rows of states) {
      expect(rows.statusText).not.toMatch(/Merged|Pushed|PR Created|Validation Passed|Repository Mutated/i);
    }
  });

  it("every state's row fits within the shared wrap budget with the panel prefix", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const states: Array<ReturnType<typeof createReviewDecisionDisplayRows>> = [
      createReviewDecisionDisplayRows(undefined, undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "ChangesRequested"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Blocked"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("TimedOut"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Failed"), undefined),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved", "reviewer-runtime-1"), createPromotions(promotion)),
      createReviewDecisionDisplayRows(createReviewerResults("Completed", "Approved", "reviewer-runtime-2"), createPromotions(promotion)),
    ];

    for (const rows of states) {
      expect((ROW_PREFIX + rows.statusText).length).toBeLessThanOrEqual(WRAP_LENGTH);
    }
  });
});
