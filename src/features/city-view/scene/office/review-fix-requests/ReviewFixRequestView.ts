import type { ReviewDecisionClassification } from "../review-decision/ReviewDecisionTypes";
import type { ReviewFixRequest, ReviewFixRequestResult } from "./ReviewFixRequestTypes";

export type ReviewFixRequestDisplayRows = {
  statusText: string;
};

export function createReviewFixRequestDisplayRows(
  classification: ReviewDecisionClassification | undefined,
  currentRequest: ReviewFixRequest | undefined,
  latestResult?: ReviewFixRequestResult,
): ReviewFixRequestDisplayRows {
  if (currentRequest) {
    return { statusText: `Fix request recorded by ${currentRequest.requestedBy}; no execution` };
  }

  if (latestResult?.status === "Blocked") {
    return { statusText: `Blocked; ${compactReason(latestResult.reasonCodes[0])}; no execution` };
  }

  if (!classification || classification.state === "Unavailable") {
    return { statusText: "Unavailable; needs Changes Requested review; no execution" };
  }

  if (classification.state === "ChangesRequested" && classification.decision === "ChangesRequested") {
    return { statusText: "Changes Requested; Request fixes (F); no execution" };
  }

  switch (classification.state) {
    case "Approved":
      return { statusText: "Approved review; no fix request needed" };
    case "ChangesRequested":
      return { statusText: "Unknown review decision; fix request unavailable" };
    case "Stale":
      return { statusText: "Stale review chain; fix request blocked" };
    case "TimedOut":
      return { statusText: "Timed out review; fix request blocked" };
    case "Failed":
      return { statusText: "Failed review; fix request blocked" };
    case "Blocked":
    default:
      return { statusText: "Blocked review; fix request unavailable" };
  }
}

function compactReason(reason: string | undefined) {
  if (!reason) return "resolve review state";
  return reason.toLowerCase().replace(/^review_fix_request_/, "").replace(/_/g, " ").slice(0, 64);
}