import type { ReviewerRuntimeResultCollection } from "../reviewer-runtime/ReviewerRuntimeTypes";
import type { ReviewPromotionCollection } from "./ReviewDecisionTypes";

export type ReviewDecisionDisplayRows = {
  statusText: string;
};

/**
 * Mirrors ReviewerRuntimeView's "always computed from latest result" pattern
 * -- no chain re-validation here, because clearRuntimePreflightForProject
 * already deletes reviewerRuntimeResultCollections the instant any upstream
 * stage invalidates, so a present latest result is trustworthy by
 * construction. The one case that pattern cannot cover on its own is a
 * ReviewPromotion whose chain has since been invalidated (the promotion
 * itself is never deleted, per spec.md Edge Cases); that is detected here by
 * comparing the promotion's reviewerRuntimeId against the current latest
 * result. Wording never implies merge, PR, validation, or GitHub mutation.
 */
export function createReviewDecisionDisplayRows(
  results: ReviewerRuntimeResultCollection | undefined,
  promotions: ReviewPromotionCollection | undefined,
): ReviewDecisionDisplayRows {
  const latestResult = results?.results[results.results.length - 1];
  const latestPromotion = promotions?.promotions[promotions.promotions.length - 1];

  if (latestPromotion) {
    const stillApplies = latestResult?.reviewerRuntimeId === latestPromotion.reviewerRuntimeId
      && latestResult?.status === "Completed"
      && latestResult?.decision === "Approved";
    if (stillApplies) {
      return { statusText: `Approved; Promoted by ${latestPromotion.promotedBy}; no mutation` };
    }
    return { statusText: "Promoted (historical); not currently applicable; no mutation" };
  }

  if (!latestResult) {
    return { statusText: "Unavailable; needs Reviewer Completed; not promotable" };
  }

  switch (latestResult.status) {
    case "Completed":
      switch (latestResult.decision) {
        case "Approved":
          return { statusText: "Approved; Promote (P) to record; no mutation" };
        default:
          return { statusText: "Changes Requested; not promotable" };
      }
    case "TimedOut":
      return { statusText: "Timed out; inspect; not promotable" };
    case "Failed":
      return { statusText: "Failed; inspect needed; not promotable" };
    case "Blocked":
    default:
      return { statusText: "Blocked; resolve requirements; not promotable" };
  }
}
