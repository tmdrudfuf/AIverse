import type { ActiveWorkSessionStartResultCollection } from "./ActiveWorkSessionTypes";

const RESULT_TASK_ID_MAX_LENGTH = 34;
const RESULT_REASON_MAX_LENGTH = 36;

export type ActiveWorkSessionDisplayRows = {
  statusText: string;
  resultText?: string;
};

export function createActiveWorkSessionDisplayRows(
  collection: ActiveWorkSessionStartResultCollection | undefined,
): ActiveWorkSessionDisplayRows {
  if (!collection || collection.results.length === 0) return { statusText: "No active work-session starts" };

  const latest = collection.results[collection.results.length - 1]!;
  const hiddenCount = Math.max(0, collection.results.length - 1);
  return {
    statusText: `${collection.resultCount} start result${collection.resultCount === 1 ? "" : "s"}`,
    resultText: formatResult(latest, hiddenCount),
  };
}

function formatResult(
  result: ActiveWorkSessionStartResultCollection["results"][number],
  hiddenCount: number,
) {
  const taskRef = result.activeSessionId
    ? ` ${truncateForRow(result.activeSessionId, RESULT_TASK_ID_MAX_LENGTH)}`
    : ` ${truncateForRow(result.projectTaskId, RESULT_TASK_ID_MAX_LENGTH)}`;
  const employee = result.employeeDisplayName ? `; ${truncateForRow(result.employeeDisplayName, 18)}` : "";
  const reason = result.reasonCodes.length > 0
    ? `; ${truncateForRow(result.reasonCodes.join("/"), RESULT_REASON_MAX_LENGTH)}`
    : "";
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  return `${formatStatus(result.status)}${taskRef}${employee}; Work started; Agent execution not started; No repository mutation${reason}${hiddenText}`;
}

function formatStatus(status: ActiveWorkSessionStartResultCollection["results"][number]["status"]) {
  if (status === "Started") return "Work session active";
  if (status === "AlreadyStarted") return "Already started";
  if (status === "Conflict") return "Start conflict";
  if (status === "Unavailable") return "Start unavailable";
  if (status === "Ineligible") return "Start blocked";
  return "Start failed";
}

function truncateForRow(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
