import type { PreparedWorkSessionResultCollection } from "./PreparedWorkSessionTypes";

const RESULT_REASON_MAX_LENGTH = 24;
const RESULT_EMPLOYEE_MAX_LENGTH = 18;

export type PreparedWorkSessionDisplayRows = {
  statusText: string;
  resultText?: string;
};

export function createPreparedWorkSessionDisplayRows(
  collection: PreparedWorkSessionResultCollection | undefined,
): PreparedWorkSessionDisplayRows {
  if (!collection || collection.results.length === 0) {
    return { statusText: "No prepared sessions" };
  }

  const latest = collection.results[collection.results.length - 1]!;
  const hiddenCount = Math.max(0, collection.results.length - 1);
  return {
    statusText: `${collection.resultCount} ${collection.resultCount === 1 ? "result" : "results"}`,
    resultText: createResultText(latest, hiddenCount),
  };
}

function createResultText(
  result: PreparedWorkSessionResultCollection["results"][number],
  hiddenCount: number,
) {
  const employeeLabel = result.employeeDisplayName ?? result.employeeId;
  const employee = employeeLabel ? ` ${truncateForRow(employeeLabel, RESULT_EMPLOYEE_MAX_LENGTH)}` : "";
  const reason = result.status === "Prepared" || result.status === "AlreadyPrepared"
    ? ""
    : `; ${truncateForRow(result.reasonCodes.join(","), RESULT_REASON_MAX_LENGTH)}`;
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";

  return `${formatStatus(result.status)}${employee}; Not started; Inactive; No agent execution${reason}${hiddenText}`;
}

function formatStatus(status: PreparedWorkSessionResultCollection["results"][number]["status"]) {
  if (status === "Prepared") return "Prepared";
  if (status === "AlreadyPrepared") return "Already prepared";
  if (status === "Conflict") return "Preparation blocked";
  if (status === "Unavailable") return "Preparation unavailable";
  if (status === "Ineligible") return "Preparation blocked";
  return "Preparation failed";
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
