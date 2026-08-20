import type { ImplementerRuntimeResultCollection } from "../implementer-runtime/ImplementerRuntimeTypes";
import type { ReviewerRuntimeResultCollection } from "./ReviewerRuntimeTypes";

export type ReviewerRuntimeDisplayRows = {
  statusText: string;
};

/**
 * Row text stays within the same compact 78-char wrap budget as
 * ImplementerRuntimeView, one state -> one line, no truncation reliance.
 */
export function createReviewerRuntimeDisplayRows(
  implementerRuntimeResults: ImplementerRuntimeResultCollection | undefined,
  results: ReviewerRuntimeResultCollection | undefined,
): ReviewerRuntimeDisplayRows {
  const latestImplementerResult = implementerRuntimeResults?.results[implementerRuntimeResults.results.length - 1];
  const implementerCompleted = latestImplementerResult?.status === "Completed";

  if (!implementerCompleted) {
    return { statusText: "Codex unavailable; needs Claude Completed; not started" };
  }

  const latestResult = results?.results[results.results.length - 1];
  if (!latestResult) {
    return { statusText: "Codex ready; explicit start required; not started" };
  }

  const blockingFindings = latestResult.blockingFindingCount;

  switch (latestResult.status) {
    case "Completed":
      switch (latestResult.decision) {
        case "Approved":
          return { statusText: `Approved; Blocking Findings: ${blockingFindings}; Human Decision Required` };
        case "ChangesRequested":
          return { statusText: `Changes Requested; Blocking Findings: ${blockingFindings}; no mutation` };
        case "Unknown":
        default:
          return { statusText: "Decision Unknown; inspect output; no mutation" };
      }
    case "TimedOut":
      return { statusText: "Timed out; inspect; not validated; no mutation" };
    case "Failed":
      return { statusText: "Failed; inspect needed; not validated; no mutation" };
    case "Blocked":
    default:
      if (latestResult.reasonCodes.includes("REVIEWER_RUNTIME_TARGET_UNCOMMITTED")) {
        return { statusText: "Blocked; uncommitted target; inspect; not started" };
      }
      return { statusText: "Blocked; resolve requirements; not started" };
  }
}
