import type { ReviewFixRequest } from "../review-fix-requests/ReviewFixRequestTypes";
import type { ReviewFixPlan, ReviewFixPlanResult } from "./ReviewFixPlanTypes";

export type ReviewFixPlanDisplayRows = {
  statusText: string;
};

export function createReviewFixPlanDisplayRows(
  currentRequest: ReviewFixRequest | undefined,
  currentPlan: ReviewFixPlan | undefined,
  latestResult?: ReviewFixPlanResult,
): ReviewFixPlanDisplayRows {
  if (currentPlan) {
    return { statusText: `Fix plan recorded by ${currentPlan.plannedBy}; no fix execution started` };
  }

  if (latestResult?.status === "Blocked") {
    return { statusText: `Blocked; ${compactReason(latestResult.reasonCodes[0])}; no fix execution started` };
  }

  if (latestResult?.status === "Failed") {
    return { statusText: `Failed; ${compactReason(latestResult.reasonCodes[0])}; no fix execution started` };
  }

  if (currentRequest) {
    return { statusText: "Fix request current; Plan fixes (G); no execution" };
  }

  return { statusText: "Unavailable; needs Review Fix Request; no execution" };
}

function compactReason(reason: string | undefined) {
  if (!reason) return "resolve fix request";
  return reason.toLowerCase().replace(/^review_fix_plan_/, "").replace(/_/g, " ").slice(0, 64);
}
