import type { ExternalProjectAdosExecution, ExternalProjectAdosExecutionResult } from "./ExternalProjectAdosExecutionTypes";

export type ExternalProjectAdosExecutionDisplayRows = {
  statusText: string;
  contextText: string;
  boundaryText: string;
};

export function createExternalProjectAdosExecutionDisplayRows(
  execution: ExternalProjectAdosExecution | undefined,
  result: ExternalProjectAdosExecutionResult | undefined,
): ExternalProjectAdosExecutionDisplayRows | undefined {
  if (!execution && !result) return undefined;

  if (execution) {
    return {
      statusText: `${execution.status} - ${execution.featureBranch}`,
      contextText: [
        compactPath(execution.worktreePath),
        `base ${execution.authoritativeBaseSha.slice(0, 7)}`,
        `policy v${execution.executionPolicyVersion}`,
        execution.implementerStarted ? "implementer started" : "implementer not started",
      ].join("; "),
      boundaryText: "Validation, review, repository mutation, GitHub, publish, merge, and deploy not started.",
    };
  }

  return {
    statusText: `${result!.status} - ${result!.reasonCodes[0]}`,
    contextText: result!.preparationId ? `preparation ${result!.preparationId}` : "preparation missing",
    boundaryText:
      "Provider not invoked; validation, review, repository mutation, GitHub, publish, merge, and deploy not started.",
  };
}

function compactPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.slice(-2).join("/") || path;
}
