import type { ReviewTarget } from "../reviewer-runtime/ReviewTarget";
import type { ValidationRuntime, ValidationRuntimeResult } from "../validation-runtime/ValidationRuntimeTypes";
import type { PostValidationReviewTargetResult } from "./PostValidationReviewTargetTypes";

export type PostValidationReviewTargetDisplayRows = {
  statusText: string;
};

export function createPostValidationReviewTargetDisplayRows(
  validationRuntime: ValidationRuntime | undefined,
  validationResult: ValidationRuntimeResult | undefined,
  target: ReviewTarget | undefined,
  latestResult?: PostValidationReviewTargetResult,
): PostValidationReviewTargetDisplayRows {
  if (target?.source === "PostValidation") {
    return { statusText: `Ready for independent review; SHA ${target.reviewTargetSha.slice(0, 8)}; no promotion` };
  }
  if (latestResult?.status === "Blocked" || latestResult?.status === "Failed") {
    return { statusText: `Blocked; ${compactReason(latestResult.reasonCodes[0])}; reviewer not started` };
  }
  if (validationRuntime?.status === "Completed" && validationResult?.status === "Completed") {
    return { statusText: "Validation complete; prepare fresh review target (Y)" };
  }
  return { statusText: "Unavailable; needs completed Validation Runtime" };
}

function compactReason(reason: string | undefined) {
  if (!reason) return "resolve validation target";
  return reason.toLowerCase().replace(/^post_validation_review_target_/, "").replace(/_/g, " ").slice(0, 64);
}
