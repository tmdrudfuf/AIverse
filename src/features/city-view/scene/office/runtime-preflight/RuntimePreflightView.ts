import type {
  RuntimePreflightCollection,
  RuntimePreflightResult,
  RuntimePreflightResultCollection,
} from "./RuntimePreflightTypes";

export type RuntimePreflightDisplayRows = {
  statusText: string;
  resultText?: string;
  checkText?: string;
};

export function createRuntimePreflightDisplayRows(
  preflights: RuntimePreflightCollection | undefined,
  results: RuntimePreflightResultCollection | undefined,
): RuntimePreflightDisplayRows {
  const resultCount = results?.resultCount ?? 0;
  const preflightCount = preflights?.preflightCount ?? 0;
  if (resultCount === 0 && preflightCount === 0) {
    return {
      statusText: "Runtime Preflight Required; Run Local Safety Checks; Execution Not Started",
    };
  }

  const latestResult = results?.results[results.results.length - 1];
  const latestPreflight = preflights?.preflights[preflights.preflights.length - 1];
  return {
    statusText: `${preflightCount || resultCount} runtime preflight${(preflightCount || resultCount) === 1 ? "" : "s"}`,
    resultText: latestResult ? formatResult(latestResult, Math.max(0, resultCount - 1)) : undefined,
    checkText: latestPreflight ? formatChecks(latestPreflight) : undefined,
  };
}

function formatResult(result: RuntimePreflightResult, hiddenCount: number) {
  const counts = `${result.passedCheckCount} passed / ${result.blockedCheckCount} blocked / ${result.failedCheckCount} failed`;
  const more = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  if (result.status === "Ready") {
    return `Runtime Preflight Passed; Ready for Runtime Start Decision; Execution Not Started; Agents Not Started; ${counts}${more}`;
  }
  if (result.status === "Failed") {
    return `Runtime Preflight Failed; Local Safety Checks Could Not Complete; Execution Not Started; Agents Not Started; ${result.primaryReason ?? "RUNTIME_PROVIDER_FAILED"}; ${counts}${more}`;
  }
  return `Runtime Preflight Blocked; Resolve Local Runtime Requirements; Execution Not Started; Agents Not Started; ${result.primaryReason ?? "APPROVAL_MISSING"}; ${counts}${more}`;
}

function formatChecks(preflight: RuntimePreflightCollection["preflights"][number]) {
  const primary = preflight.checks.find((check) => check.status !== "Passed");
  const summary = preflight.checks
    .slice(0, 3)
    .map((check) => `${check.category}:${check.status}`)
    .join(" | ");
  return primary ? `${summary}; primary ${primary.reason}` : summary;
}
