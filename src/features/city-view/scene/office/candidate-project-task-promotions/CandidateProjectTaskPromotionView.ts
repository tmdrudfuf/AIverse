import type { CandidateProjectTaskPromotionResultCollection } from "./CandidateProjectTaskPromotionTypes";

const RESULT_REASON_MAX_LENGTH = 22;
const RESULT_TASK_ID_MAX_LENGTH = 24;

export type CandidateProjectTaskPromotionDisplayRows = {
  statusText: string;
  resultText?: string;
};

export function createCandidateProjectTaskPromotionDisplayRows(
  collection: CandidateProjectTaskPromotionResultCollection | undefined,
): CandidateProjectTaskPromotionDisplayRows {
  if (!collection || collection.results.length === 0) {
    return { statusText: "No promotion attempts" };
  }

  const latest = collection.results[collection.results.length - 1]!;
  const hiddenCount = Math.max(0, collection.results.length - 1);
  return {
    statusText: `${collection.resultCount} ${collection.resultCount === 1 ? "result" : "results"}`,
    resultText: createResultText(latest, hiddenCount),
  };
}

function createResultText(
  result: CandidateProjectTaskPromotionResultCollection["results"][number],
  hiddenCount: number,
) {
  const taskRef = result.status === "Promoted" || result.status === "AlreadyPromoted"
    ? ""
    : ` ${truncateForRow(result.createdProjectTaskId ?? result.candidateTaskId, RESULT_TASK_ID_MAX_LENGTH)}`;
  const reason = result.status === "Promoted" || result.status === "AlreadyPromoted"
    ? ""
    : `; ${truncateForRow(result.reasonCodes.join(","), RESULT_REASON_MAX_LENGTH)}`;
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";

  return `${formatStatus(result.status)}${taskRef}; Not started; Unassigned${reason}${hiddenText}`;
}

function formatStatus(status: CandidateProjectTaskPromotionResultCollection["results"][number]["status"]) {
  if (status === "Promoted") return "Promoted to project task";
  if (status === "AlreadyPromoted") return "Already promoted";
  if (status === "Rejected") return "Promotion blocked";
  if (status === "Ineligible") return "Promotion blocked";
  if (status === "Unavailable") return "Promotion unavailable";
  return "Promotion failed";
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
