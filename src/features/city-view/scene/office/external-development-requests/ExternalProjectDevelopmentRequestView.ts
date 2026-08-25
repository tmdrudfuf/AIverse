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

  return {
    statusText: `${draft.status} - ${draft.title}`,
    contextText: `${repositoryText}${branchText}${specText}`,
    boundaryText: draft.sideEffectBoundary,
  };
}
