import type { ReviewFixRuntime, ReviewFixRuntimeResult } from "../review-fix-runtime/ReviewFixRuntimeTypes";
import type { ValidationRuntime, ValidationRuntimeResult } from "./ValidationRuntimeTypes";

export type ValidationRuntimeDisplayRows = {
  statusText: string;
};

export function createValidationRuntimeDisplayRows(
  currentReviewFixRuntime: ReviewFixRuntime | undefined,
  latestReviewFixRuntimeResult: ReviewFixRuntimeResult | undefined,
  currentRuntime: ValidationRuntime | undefined,
  latestResult?: ValidationRuntimeResult,
): ValidationRuntimeDisplayRows {
  if (currentRuntime?.status === "Completed") {
    return { statusText: `Completed; ${currentRuntime.evidence.completedCommandCount}/${currentRuntime.evidence.commandCount} commands; review not started` };
  }
  if (currentRuntime?.status === "TimedOut") {
    return { statusText: "Timed out; review not started; GitHub untouched" };
  }
  if (latestResult?.status === "Blocked") {
    return { statusText: `Blocked; ${compactReason(latestResult.reasonCodes[0])}; commands not run` };
  }
  if (latestResult?.status === "Failed") {
    return { statusText: `Failed; ${compactReason(latestResult.reasonCodes[0])}; review not started` };
  }
  if (currentReviewFixRuntime?.status === "Completed" && latestReviewFixRuntimeResult?.status === "Completed") {
    return { statusText: "Ready; Start validation runtime (V); review not started" };
  }
  return { statusText: "Unavailable; needs completed Review Fix Runtime" };
}

function compactReason(reason: string | undefined) {
  if (!reason) return "resolve validation context";
  return reason.toLowerCase().replace(/^validation_runtime_/, "").replace(/_/g, " ").slice(0, 64);
}
