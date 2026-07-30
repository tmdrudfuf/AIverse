import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResult,
  ExecutionReadinessResultCollection,
} from "./ExecutionReadinessTypes";

const MAX_RESULTS = 2;

export type ExecutionReadinessDisplayRows = {
  statusText: string;
  resultText?: string;
  checkText?: string;
};

export function createExecutionReadinessDisplayRows(
  readiness: ExecutionReadinessCollection | undefined,
  results: ExecutionReadinessResultCollection | undefined,
): ExecutionReadinessDisplayRows {
  const resultCount = results?.resultCount ?? 0;
  const readinessCount = readiness?.readinessCount ?? 0;
  if (resultCount === 0 && readinessCount === 0) {
    return { statusText: "No execution readiness validations" };
  }

  const latestResult = results?.results[results.results.length - 1];
  const latestReadiness = readiness?.readiness[readiness.readiness.length - 1];
  return {
    statusText: `${readinessCount || resultCount} readiness validation${(readinessCount || resultCount) === 1 ? "" : "s"}`,
    resultText: latestResult ? formatResult(latestResult, Math.max(0, resultCount - MAX_RESULTS)) : undefined,
    checkText: latestReadiness ? formatChecks(latestReadiness) : undefined,
  };
}

function formatResult(result: ExecutionReadinessResult, hiddenCount: number) {
  const counts = `${result.passedCheckCount} passed / ${result.blockedCheckCount} blocked / ${result.failedCheckCount} failed`;
  const more = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  if (result.status === "Ready") {
    return `Readiness Checks Passed; Ready for Human Execution Decision; Human Approval Not Granted; Execution Not Started; ${counts}${more}`;
  }
  if (result.status === "Failed") {
    return `Readiness Validation Failed; Execution Not Started; ${result.primaryReason ?? "MALFORMED_INPUT"}; ${counts}${more}`;
  }
  return `Execution Blocked; Resolve Readiness Requirements; Execution Not Started; ${result.primaryReason ?? "EXECUTION_PLAN_MISSING"}; ${counts}${more}`;
}

function formatChecks(readiness: ExecutionReadinessCollection["readiness"][number]) {
  const primary = readiness.checks.find((check) => check.status !== "Passed");
  const summary = readiness.checks
    .slice(0, 3)
    .map((check) => `${check.category}:${check.status}`)
    .join(" | ");
  return primary ? `${summary}; primary ${primary.reason}` : summary;
}
