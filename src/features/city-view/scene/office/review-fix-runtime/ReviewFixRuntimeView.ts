import type { ReviewFixPlan } from "../review-fix-plans/ReviewFixPlanTypes";
import type { ReviewFixRuntime, ReviewFixRuntimeResult } from "./ReviewFixRuntimeTypes";

export type ReviewFixRuntimeDisplayRows = {
  statusText: string;
};

export function createReviewFixRuntimeDisplayRows(
  currentPlan: ReviewFixPlan | undefined,
  currentRuntime: ReviewFixRuntime | undefined,
  latestResult?: ReviewFixRuntimeResult,
): ReviewFixRuntimeDisplayRows {
  if (currentRuntime?.status === "Completed") {
    return { statusText: "Completed; validation not run; re-review not run" };
  }

  if (currentRuntime?.status === "TimedOut") {
    return { statusText: "Timed out; validation not run; re-review not run" };
  }

  if (latestResult?.status === "Blocked") {
    return { statusText: `Blocked; ${compactReason(latestResult.reasonCodes[0])}; validation not run` };
  }

  if (latestResult?.status === "Failed") {
    return { statusText: `Failed; ${compactReason(latestResult.reasonCodes[0])}; validation not run` };
  }

  if (currentPlan) {
    return { statusText: "Ready; Start fix runtime (X); validation not run" };
  }

  return { statusText: "Unavailable; needs Review Fix Plan; validation not run" };
}

function compactReason(reason: string | undefined) {
  if (!reason) return "resolve fix plan";
  return reason.toLowerCase().replace(/^review_fix_runtime_/, "").replace(/_/g, " ").slice(0, 64);
}
