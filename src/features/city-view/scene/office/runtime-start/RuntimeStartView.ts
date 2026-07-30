import type {
  RuntimeStartCollection,
  RuntimeStartResult,
  RuntimeStartResultCollection,
} from "./RuntimeStartTypes";
import type { RuntimePreflightResultCollection } from "../runtime-preflight/RuntimePreflightTypes";
import type { HumanExecutionApprovalCollection } from "../human-execution-approvals/HumanExecutionApprovalTypes";

export type RuntimeStartDisplayRows = {
  statusText: string;
  resultText?: string;
  startText?: string;
};

export function createRuntimeStartDisplayRows(
  starts: RuntimeStartCollection | undefined,
  results: RuntimeStartResultCollection | undefined,
  preflightResults?: RuntimePreflightResultCollection,
  approvals?: HumanExecutionApprovalCollection,
): RuntimeStartDisplayRows {
  const latestResult = results?.results[results.results.length - 1];
  const latestStart = starts?.starts[starts.starts.length - 1];
  if (latestResult || latestStart) {
    const count = starts?.startCount ?? results?.resultCount ?? 0;
    return {
      statusText: `${count || 1} runtime start${(count || 1) === 1 ? "" : "s"}`,
      resultText: latestResult ? formatResult(latestResult, Math.max(0, (results?.resultCount ?? 1) - 1)) : undefined,
      startText: latestStart
        ? `Runtime Start Recorded; Execution Started; Agents Not Started; Awaiting Implementer Start; ${compactId(latestStart.runtimeStartId)}`
        : undefined,
    };
  }

  const latestPreflight = preflightResults?.results[preflightResults.results.length - 1];
  if (!approvals || approvals.approvalCount === 0) {
    return {
      statusText: "Runtime Start Unavailable; Human Approval Required; Execution Not Started; Agents Not Started",
    };
  }
  if (!latestPreflight) {
    return {
      statusText: "Runtime Start Unavailable; Runtime Preflight Required; Execution Not Started; Agents Not Started",
    };
  }
  if (latestPreflight.status !== "Ready") {
    return {
      statusText: `Runtime Start Blocked; Resolve Runtime Preflight; Execution Not Started; Agents Not Started; ${latestPreflight.primaryReason ?? "RUNTIME_START_PREFLIGHT_BLOCKED"}`,
    };
  }
  return {
    statusText: "Runtime Start Available; Explicit Human Start Required; Execution Not Started; Agents Not Started",
  };
}

function formatResult(result: RuntimeStartResult, hiddenCount: number) {
  const more = hiddenCount > 0 ? `; +${hiddenCount} more` : "";
  const reason = result.reasonCodes[0] ?? "RUNTIME_START_CONTEXT_MISMATCH";
  if (result.status === "Started" || result.status === "AlreadyStarted") {
    return `Runtime Start Recorded; Execution Started; Agents Not Started; Awaiting Implementer Start${more}`;
  }
  if (result.status === "Failed") {
    return `Runtime Start Failed; Execution Not Started; Agents Not Started; ${reason}${more}`;
  }
  return `Runtime Start Blocked; Resolve Runtime Preflight; Execution Not Started; Agents Not Started; ${reason}${more}`;
}

function compactId(value: string) {
  return value.length > 64 ? `${value.slice(0, 61)}...` : value;
}
