import type { ReviewDecisionClassification, ReviewPromotionCollection } from "./ReviewDecisionTypes";

export type ReviewDecisionDisplayRows = {
  statusText: string;
};

/**
 * classification is computed fresh by the caller via
 * ReviewDecisionService.classify (see OfficeProjectPortalView.render and
 * resolveReviewDecisionInput), per contracts/review-decision-contract.md's
 * requirement that the dashboard and the Promote precondition read the same
 * single classification -- this view performs no chain re-validation of its
 * own. The one case classification alone cannot cover is a ReviewPromotion
 * whose chain has since been invalidated (the promotion itself is never
 * deleted, per spec.md Edge Cases); that is detected here by comparing the
 * promotion's reviewerRuntimeId against the current classification. Wording
 * never implies merge, PR, validation, or GitHub mutation.
 */
export function createReviewDecisionDisplayRows(
  classification: ReviewDecisionClassification | undefined,
  promotions: ReviewPromotionCollection | undefined,
): ReviewDecisionDisplayRows {
  const latestPromotion = promotions?.promotions[promotions.promotions.length - 1];

  if (latestPromotion) {
    const stillApplies = classification?.state === "Approved"
      && classification.reviewerRuntimeId === latestPromotion.reviewerRuntimeId;
    if (stillApplies) {
      return { statusText: `Approved; Promoted by ${latestPromotion.promotedBy}; no mutation` };
    }
    return { statusText: "Promoted (historical); not currently applicable; no mutation" };
  }

  if (!classification || classification.state === "Unavailable") {
    return { statusText: "Unavailable; needs Reviewer Completed; not promotable" };
  }

  switch (classification.state) {
    case "Approved":
      return { statusText: "Approved; Promote (P) to record; no mutation" };
    case "ChangesRequested":
      return { statusText: "Changes Requested; not promotable" };
    case "Stale":
      return { statusText: "Stale; chain changed since review; not promotable" };
    case "TimedOut":
      return { statusText: "Timed out; inspect; not promotable" };
    case "Failed":
      return { statusText: "Failed; inspect needed; not promotable" };
    case "Blocked":
    default:
      return { statusText: "Blocked; resolve requirements; not promotable" };
  }
}
