import { describe, expect, it } from "vitest";

import { createReviewDecisionDisplayRows } from "./ReviewDecisionView";
import type { ReviewDecisionClassification, ReviewPromotion } from "./ReviewDecisionTypes";

const PROJECT_ID = "daily-proof";
const WRAP_LENGTH = 78;
const ROW_PREFIX = "[REVIEW DECISION] ";

function createClassification(
  state: ReviewDecisionClassification["state"],
  reviewerRuntimeId = "reviewer-runtime-1",
): ReviewDecisionClassification {
  return state === "Unavailable" ? { state } : { state, reviewerRuntimeId };
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

describe("createReviewDecisionDisplayRows", () => {
  it("shows Unavailable when no classification exists", () => {
    const rows = createReviewDecisionDisplayRows(undefined, undefined);
    expect(rows.statusText).toContain("Unavailable");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Approved awaiting Promote when Approved with no promotion yet", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("Approved"), undefined);
    expect(rows.statusText).toContain("Approved");
    expect(rows.statusText).toContain("Promote (P)");
    expect(rows.statusText).not.toContain("Promoted by");
  });

  it("shows Changes Requested and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("ChangesRequested"), undefined);
    expect(rows.statusText).toContain("Changes Requested");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Blocked and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("Blocked"), undefined);
    expect(rows.statusText).toContain("Blocked");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Timed out and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("TimedOut"), undefined);
    expect(rows.statusText).toContain("Timed out");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Failed and not promotable", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("Failed"), undefined);
    expect(rows.statusText).toContain("Failed");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Stale and not promotable when the upstream chain no longer matches, even with no promotion recorded", () => {
    const rows = createReviewDecisionDisplayRows(createClassification("Stale"), undefined);
    expect(rows.statusText).toContain("Stale");
    expect(rows.statusText).toContain("not promotable");
  });

  it("shows Promoted with the actor when the caller resolves a current promotion", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const rows = createReviewDecisionDisplayRows(
      createClassification("Approved", "reviewer-runtime-1"),
      promotion,
    );
    expect(rows.statusText).toContain("Promoted by Local Human");
  });

  it("explicitly states the no-action boundary once promoted -- regression for round-1 combined review P2-001", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const rows = createReviewDecisionDisplayRows(
      createClassification("Approved", "reviewer-runtime-1"),
      promotion,
    );
    expect(rows.statusText).toMatch(/no push\/PR\/merge\/validation\/deploy/);
  });

  it("shows Approved awaiting Promote (never a stale Promoted row) when a newer reviewerRuntimeId is Approved and the caller resolves no current promotion for it -- regression for review.md Round 9 P1-001", () => {
    // The caller (ReviewDecisionService.findCurrentReviewPromotion) is
    // responsible for deciding a historical promotion for an older
    // reviewerRuntimeId does not apply to a newer Approved classification;
    // this view must never re-derive that decision or fall back to masking
    // wording of its own once the caller has already resolved undefined.
    const rows = createReviewDecisionDisplayRows(
      createClassification("Approved", "reviewer-runtime-2"),
      undefined,
    );
    expect(rows.statusText).toContain("Approved");
    expect(rows.statusText).toContain("Promote (P)");
    expect(rows.statusText).not.toContain("Promoted by");
  });

  it("shows Stale and not promotable (no historical Promoted wording) once the chain has since gone Stale and the caller resolves no current promotion", () => {
    const rows = createReviewDecisionDisplayRows(
      createClassification("Stale", "reviewer-runtime-1"),
      undefined,
    );
    expect(rows.statusText).toContain("Stale");
    expect(rows.statusText).toContain("not promotable");
    expect(rows.statusText).not.toContain("Promoted by");
  });

  it("shows Unavailable (no historical Promoted wording) when the underlying classification is gone entirely and the caller resolves no current promotion", () => {
    const rows = createReviewDecisionDisplayRows(undefined, undefined);
    expect(rows.statusText).toContain("Unavailable");
    expect(rows.statusText).not.toContain("Promoted by");
  });

  it("never claims a merge, push, PR, validation pass, or repository mutation in any state", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const states = [
      createReviewDecisionDisplayRows(undefined, undefined),
      createReviewDecisionDisplayRows(createClassification("Approved"), undefined),
      createReviewDecisionDisplayRows(createClassification("ChangesRequested"), undefined),
      createReviewDecisionDisplayRows(createClassification("Blocked"), undefined),
      createReviewDecisionDisplayRows(createClassification("TimedOut"), undefined),
      createReviewDecisionDisplayRows(createClassification("Failed"), undefined),
      createReviewDecisionDisplayRows(createClassification("Stale"), undefined),
      createReviewDecisionDisplayRows(createClassification("Approved", "reviewer-runtime-1"), promotion),
      createReviewDecisionDisplayRows(createClassification("Approved", "reviewer-runtime-2"), undefined),
    ];

    for (const rows of states) {
      expect(rows.statusText).not.toMatch(/Merged|Pushed|PR Created|Validation Passed|Repository Mutated/i);
    }
  });

  it("every state's row fits within the shared wrap budget with the panel prefix", () => {
    const promotion = createPromotion("reviewer-runtime-1");
    const states: Array<ReturnType<typeof createReviewDecisionDisplayRows>> = [
      createReviewDecisionDisplayRows(undefined, undefined),
      createReviewDecisionDisplayRows(createClassification("Approved"), undefined),
      createReviewDecisionDisplayRows(createClassification("ChangesRequested"), undefined),
      createReviewDecisionDisplayRows(createClassification("Blocked"), undefined),
      createReviewDecisionDisplayRows(createClassification("TimedOut"), undefined),
      createReviewDecisionDisplayRows(createClassification("Failed"), undefined),
      createReviewDecisionDisplayRows(createClassification("Stale"), undefined),
      createReviewDecisionDisplayRows(createClassification("Approved", "reviewer-runtime-1"), promotion),
      createReviewDecisionDisplayRows(createClassification("Approved", "reviewer-runtime-2"), undefined),
    ];

    for (const rows of states) {
      expect((ROW_PREFIX + rows.statusText).length).toBeLessThanOrEqual(WRAP_LENGTH);
    }
  });
});
