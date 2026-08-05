import type { ReviewDecisionClassification, ReviewPromotion } from "./ReviewDecisionTypes";

export type ReviewDecisionDisplayRows = {
  statusText: string;
};

/**
 * classification is computed fresh by the caller via
 * ReviewDecisionService.classify (see OfficeProjectPortalView.render and
 * resolveReviewDecisionInput), per contracts/review-decision-contract.md's
 * requirement that the dashboard and the Promote precondition read the same
 * single classification -- this view performs no chain re-validation of its
 * own. currentPromotion is likewise pre-resolved by the caller via
 * ReviewDecisionService.findCurrentReviewPromotion, which already applies
 * the same "is this promotion still current for the live classification"
 * check the old inline logic here used to duplicate (and, per review.md
 * Round 9 P1-001, could pick the wrong record for). A promotion that does
 * not currently apply is simply not passed in at all -- it remains
 * immutable in state, untouched, and this view falls through to the
 * classification-driven state below (e.g. Approved with no current
 * promotion still offers Promote; Stale/ChangesRequested/etc. remain
 * truthfully not promotable) rather than rendering special-cased
 * "historical" wording, satisfying spec.md's Edge Case that a historical
 * promotion is never shown as currently applicable. Wording never implies
 * merge, PR, validation, or GitHub mutation.
 */
export function createReviewDecisionDisplayRows(
  classification: ReviewDecisionClassification | undefined,
  currentPromotion: ReviewPromotion | undefined,
): ReviewDecisionDisplayRows {
  if (currentPromotion) {
    return {
      statusText: `Promoted by ${currentPromotion.promotedBy}; no push/PR/merge/validation/deploy`,
    };
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
