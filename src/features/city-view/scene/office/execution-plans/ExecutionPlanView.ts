import type { ExecutionPlanCollection, ExecutionPlanResultCollection } from "./ExecutionPlanTypes";

const PLAN_REF_MAX_LENGTH = 34;
const PLAN_FIELD_MAX_LENGTH = 24;

export type ExecutionPlanDisplayRows = {
  statusText: string;
  resultText?: string;
  planText?: string;
};

export function createExecutionPlanDisplayRows(
  plans: ExecutionPlanCollection | undefined,
  results: ExecutionPlanResultCollection | undefined,
): ExecutionPlanDisplayRows {
  const latestResult = results?.results[results.results.length - 1];
  const latestPlan = plans?.plans[plans.plans.length - 1];
  if (!latestResult && !latestPlan) return { statusText: "No execution plans" };

  const statusText = `${plans?.planCount ?? 0} execution plan${plans?.planCount === 1 ? "" : "s"}`;
  return {
    statusText,
    resultText: latestResult ? formatResult(latestResult, Math.max(0, (results?.resultCount ?? 0) - 1)) : undefined,
    planText: latestPlan ? formatPlan(latestPlan, Math.max(0, (plans?.planCount ?? 0) - 1)) : undefined,
  };
}

function formatResult(result: ExecutionPlanResultCollection["results"][number], hiddenCount: number) {
  const planRef = result.planId ?? result.activeSessionId;
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  const state = result.createdPlan || result.duplicateExistingPlan ? "Execution Not Started" : "Not started";
  return `${formatStatus(result.status)} ${truncateForRow(planRef, PLAN_REF_MAX_LENGTH)}; ${state}; Awaiting Readiness Validation${hiddenText}`;
}

function formatPlan(plan: ExecutionPlanCollection["plans"][number], hiddenCount: number) {
  const hiddenText = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  const validation = plan.validationCommands.length;
  return [
    `Implementer ${truncateForRow(plan.implementerAgent, PLAN_FIELD_MAX_LENGTH)}`,
    `Reviewer ${truncateForRow(plan.reviewerAgent, PLAN_FIELD_MAX_LENGTH)}`,
    `Branch ${truncateForRow(plan.branchName, PLAN_FIELD_MAX_LENGTH)}`,
    `Worktree ${truncateForRow(plan.worktreePath, PLAN_FIELD_MAX_LENGTH)}`,
    `Spec ${truncateForRow(plan.specPath, PLAN_FIELD_MAX_LENGTH)}`,
    `${validation} validation command${validation === 1 ? "" : "s"}`,
    `${plan.allowedMutationScope.length} mutation scope${plan.allowedMutationScope.length === 1 ? "" : "s"}`,
    "Execution Not Started",
  ].join("; ") + hiddenText;
}

function formatStatus(status: ExecutionPlanResultCollection["results"][number]["status"]) {
  if (status === "Created") return "Execution Plan Ready";
  if (status === "AlreadyExists") return "Execution Plan Exists";
  if (status === "Blocked") return "Execution Plan Blocked";
  return "Execution Plan Failed";
}

function truncateForRow(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}
