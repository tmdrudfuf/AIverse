import type { ConfirmedEmployeeAssignmentResultCollection } from "./ConfirmedEmployeeAssignmentTypes";

const RESULT_REASON_MAX_LENGTH = 24;
const RESULT_EMPLOYEE_MAX_LENGTH = 18;

export type ConfirmedEmployeeAssignmentDisplayRows = {
  statusText: string;
  resultText?: string;
};

export function createConfirmedEmployeeAssignmentDisplayRows(
  collection: ConfirmedEmployeeAssignmentResultCollection | undefined,
): ConfirmedEmployeeAssignmentDisplayRows {
  if (!collection || collection.results.length === 0) {
    return { statusText: "No confirmed assignments" };
  }

  const latest = collection.results[collection.results.length - 1]!;
  const hiddenCount = Math.max(0, collection.results.length - 1);
  return {
    statusText: `${collection.resultCount}`,
    resultText: createResultText(latest, hiddenCount),
  };
}

function createResultText(
  result: ConfirmedEmployeeAssignmentResultCollection["results"][number],
  hiddenCount: number,
) {
  const employeeLabel = result.employeeDisplayName ?? result.employeeId;
  const employee = employeeLabel
    ? ` ${truncateForRow(employeeLabel, RESULT_EMPLOYEE_MAX_LENGTH)}`
    : "";
  const reason = result.status === "Assigned" || result.status === "AlreadyAssigned"
    ? ""
    : `; ${truncateForRow(result.reasonCodes.join(","), RESULT_REASON_MAX_LENGTH)}`;
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";

  return `${formatStatus(result.status)}${employee}; Not started; No work session${reason}${hiddenText}`;
}

function formatStatus(status: ConfirmedEmployeeAssignmentResultCollection["results"][number]["status"]) {
  if (status === "Assigned") return "Confirmed";
  if (status === "AlreadyAssigned") return "Already assigned";
  if (status === "Conflict") return "Assignment blocked";
  if (status === "Unavailable") return "Assignment unavailable";
  if (status === "Ineligible") return "Assignment blocked";
  return "Assignment failed";
}

function truncateForRow(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
