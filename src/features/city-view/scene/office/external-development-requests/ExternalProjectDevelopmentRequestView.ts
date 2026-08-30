import type { ExternalProjectDevelopmentRequestDraft } from "./ExternalProjectDevelopmentRequestTypes";

export type ExternalProjectDevelopmentRequestDisplayRows = {
  statusText: string;
  contextText: string;
  boundaryText: string;
};

export function createExternalProjectDevelopmentRequestDisplayRows(
  draft: ExternalProjectDevelopmentRequestDraft | undefined,
): ExternalProjectDevelopmentRequestDisplayRows | undefined {
  if (!draft) return undefined;

  const repositoryText = draft.repositoryOwner && draft.repositoryName
    ? `${draft.repositoryProvider}:${draft.repositoryOwner}/${draft.repositoryName}`
    : draft.repositoryName
      ? `${draft.repositoryProvider}:${draft.repositoryName}`
      : draft.repositoryProvider;
  const branchText = draft.branchName ? ` @ ${draft.branchName}` : "";
  const specText = draft.specPath ? `; ${draft.specPath}` : "";
  const localPathText = draft.localProjectPath ? `; path ${compactPath(draft.localProjectPath)}` : "";
  const requirementsText = draft.requirementsArtifactPath ? `; req ${draft.requirementsArtifactPath}` : "";
  const runText = draft.adosRunId ? `; run ${compact(draft.adosRunId, 36)}` : "";
  const targetText = draft.targetProjectIdentity ? `${draft.targetProjectIdentity}; ` : "";

  return {
    statusText: `${draft.status} - ${draft.title}`,
    contextText: `${targetText}${repositoryText}${branchText}${specText}${localPathText}${requirementsText}${runText}`,
    boundaryText: draft.sideEffectBoundary,
  };
}

function compactPath(path: string) {
  const parts = path.split(/[\\/]/).filter(Boolean);
  return parts.slice(-3).join("/") || path;
}

function compact(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3))}...`;
}
