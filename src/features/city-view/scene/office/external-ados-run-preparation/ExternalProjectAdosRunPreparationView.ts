import type { ExternalProjectAdosRunPreparation } from "./ExternalProjectAdosRunPreparationTypes";

export type ExternalProjectAdosRunPreparationDisplayRows = {
  statusText: string;
  contextText: string;
  boundaryText: string;
};

export function createExternalProjectAdosRunPreparationDisplayRows(
  preparation: ExternalProjectAdosRunPreparation | undefined,
): ExternalProjectAdosRunPreparationDisplayRows | undefined {
  if (!preparation) return undefined;

  return {
    statusText: `${preparation.status} - ${preparation.featureBranch}`,
    contextText: [
      preparation.featureId,
      `base ${preparation.authoritativeBaseSha.slice(0, 7)}`,
      preparation.specPath,
      preparation.requirementsFilePath ? `requirements ${preparation.requirementsFilePath}` : undefined,
      `${preparation.validationCommands.length} validation commands`,
      `reviewer ${preparation.reviewerCommand}`,
      `policy v${preparation.executionPolicyVersion}`,
    ].filter((item): item is string => Boolean(item)).join("; "),
    boundaryText: preparation.sideEffectBoundary,
  };
}
