import type { ExternalProjectAdosRunStatus } from "./ExternalProjectAdosRunStatusTypes";

const SIDE_EFFECT_BOUNDARY =
  "no validation, review, repository mutation, GitHub mutation, publish, merge, or deploy from status inspection";

export type ExternalProjectAdosRunStatusDisplayRows = {
  statusText: string;
  contextText: string;
  reasonText?: string;
  boundaryText: string;
};

export function createExternalProjectAdosRunStatusDisplayRows(
  status: ExternalProjectAdosRunStatus | undefined,
): ExternalProjectAdosRunStatusDisplayRows | undefined {
  if (!status) return undefined;

  const contextParts = [
    `source ${status.source}`,
    status.featureBranch ? `branch ${status.featureBranch}` : undefined,
    status.worktreePath ? `worktree ${compactPath(status.worktreePath)}` : undefined,
    !status.worktreePath && status.preparationId ? "preparation recorded" : undefined,
  ].filter((part): part is string => Boolean(part));

  return {
    statusText: `${status.stage} - ${status.status}`,
    contextText: contextParts.join("; "),
    reasonText: status.reasonCodes.length > 0 ? `reason ${status.reasonCodes[0]}` : undefined,
    boundaryText: SIDE_EFFECT_BOUNDARY,
  };
}

function compactPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.slice(-2).join("/") || path;
}
