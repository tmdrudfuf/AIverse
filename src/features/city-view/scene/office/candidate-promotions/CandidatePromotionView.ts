import type { CandidatePromotionReview, CandidatePromotionReviewCollection } from "./CandidatePromotionTypes";

const PROMOTION_TITLE_MAX_LENGTH = 24;
const PROMOTION_EMPLOYEE_MAX_LENGTH = 16;
const PROMOTION_REASON_MAX_LENGTH = 22;

export type CandidatePromotionDisplayRows = {
  statusText: string;
  reviewText?: string;
};

export function createCandidatePromotionDisplayRows(
  collection: CandidatePromotionReviewCollection | undefined,
): CandidatePromotionDisplayRows {
  if (!collection) return { statusText: "Waiting for Candidate Tasks" };

  if (collection.reviewStatus === "NotStarted") return { statusText: "Waiting for Candidate Tasks" };
  if (collection.reviewStatus === "Syncing") return { statusText: "Preparing promotion review..." };

  if (collection.reviewStatus !== "Succeeded") {
    return {
      statusText: `${collection.reviewStatus}: ${collection.errorSummary ?? "Promotion review unavailable"}`,
    };
  }

  const countText = `${collection.reviewCount} promotion ${collection.reviewCount === 1 ? "review" : "reviews"}`;
  if (collection.reviews.length === 0) return { statusText: `Succeeded - ${countText}` };

  const selectedIndex = Math.min(Math.max(collection.selectedIndex, 0), collection.reviews.length - 1);
  const selected = collection.reviews[selectedIndex]!;
  const hiddenCount = Math.max(0, collection.reviews.length - 1);
  return {
    statusText: `Succeeded - ${countText}`,
    reviewText: createReviewText(selected, selectedIndex, hiddenCount),
  };
}

function createReviewText(review: CandidatePromotionReview, selectedIndex: number, hiddenCount: number) {
  const title = truncateForRow(review.candidateTaskTitle, PROMOTION_TITLE_MAX_LENGTH);
  const employee = review.recommendedEmployeeName
    ? truncateForRow(review.recommendedEmployeeName, PROMOTION_EMPLOYEE_MAX_LENGTH)
    : getNoEmployeeText(review);
  const reason = truncateForRow(review.eligibility.summary, PROMOTION_REASON_MAX_LENGTH);
  const actions = formatActions(review);
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";

  return `#${selectedIndex + 1} ${formatStatus(review.promotionStatus)} ${review.candidateTaskPriority}/${review.candidateTaskType} ${title} -> ${employee}; ${formatEligibility(review)}; ${reason}; ${actions}; No active work created${hiddenText}`;
}

function formatStatus(status: CandidatePromotionReview["promotionStatus"]) {
  if (status === "Approved") return "Approved for future promotion";
  if (status === "PendingReview") return "Pending review";
  if (status === "NeedsReview") return "Needs review";
  return status;
}

function formatEligibility(review: CandidatePromotionReview) {
  return review.eligibility.isApprovable ? "eligible" : review.eligibility.status.toLowerCase();
}

function formatActions(review: CandidatePromotionReview) {
  const labels = review.availableActions.map((action) => {
    if (action === "Approved") return "Approve for promotion";
    if (action === "Rejected") return "Reject proposal";
    if (action === "Deferred") return "Defer decision";
    if (action === "PendingReview") return "Reset";
    if (action === "NeedsReview") return "Needs review";
    return action;
  });
  return `Actions: ${labels.join("/") || "None"}`;
}

function getNoEmployeeText(review: CandidatePromotionReview) {
  if (review.eligibility.status === "Unavailable") return "Unavailable";
  if (review.eligibility.status === "Ineligible") return "No suitable employee";
  return "Needs review";
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}
