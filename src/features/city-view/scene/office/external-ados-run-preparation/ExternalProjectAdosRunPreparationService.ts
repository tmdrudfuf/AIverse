import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import type { ExternalProjectAdosRunPreparation } from "./ExternalProjectAdosRunPreparationTypes";

export const EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY =
  "Local preparation only; validation, review, runtime, repository, GitHub, publish, merge, and deploy are not started.";

export const EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS = {
  authoritativeBaseSha: "runtime-derived",
  validationCommands: [
    "npm test",
    "npx tsc --noEmit",
    "npm run build",
    "npm run test:e2e:home-canvas",
    "git diff --check",
    "git diff --cached --check",
  ],
  reviewerCommand: "claude -p",
  executionPolicyVersion: 1,
} as const;

export type CreateExternalProjectAdosRunPreparationInput = {
  projectId: string;
  developmentRequestDraft?: ExternalProjectDevelopmentRequestDraft;
  existingPreparation?: ExternalProjectAdosRunPreparation;
  now?: string;
};

export function canCreateExternalProjectAdosRunPreparation(
  developmentRequestDraft: ExternalProjectDevelopmentRequestDraft | undefined,
) {
  return Boolean(developmentRequestDraft?.id && developmentRequestDraft.projectId);
}

export function createExternalProjectAdosRunPreparation(
  input: CreateExternalProjectAdosRunPreparationInput,
): ExternalProjectAdosRunPreparation | undefined {
  if (!input.developmentRequestDraft || input.developmentRequestDraft.projectId !== input.projectId) return undefined;

  const timestamp = input.now ?? new Date().toISOString();
  if (input.existingPreparation) {
    return {
      ...input.existingPreparation,
      validationCommands: [...input.existingPreparation.validationCommands],
      updatedAt: timestamp,
    };
  }
  const featureId = createAdosFeatureId(input.developmentRequestDraft, timestamp);

  return {
    id: createExternalProjectAdosRunPreparationId(input.projectId, input.developmentRequestDraft),
    projectId: input.projectId,
    developmentRequestDraftId: input.developmentRequestDraft.id,
    status: "Prepared",
    featureId,
    featureBranch: `codex/${featureId}`,
    authoritativeBaseSha: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.authoritativeBaseSha,
    specPath: `specs/${featureId}/spec.md`,
    requirementsFilePath: input.developmentRequestDraft.requirementsArtifactPath,
    requirementsFileContent: input.developmentRequestDraft.requirementsArtifactContent,
    requirementsPreview: compactRequirements(input.developmentRequestDraft.requirementsArtifactContent ?? input.developmentRequestDraft.requestText ?? ""),
    validationCommands: [...EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.validationCommands],
    reviewerCommand: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.reviewerCommand,
    executionPolicyVersion: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.executionPolicyVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
    sideEffectBoundary: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY,
  };
}

function createExternalProjectAdosRunPreparationId(
  projectId: string,
  developmentRequestDraft: ExternalProjectDevelopmentRequestDraft,
) {
  return developmentRequestDraft.sourceBacklogTaskId
    ? `${developmentRequestDraft.id}:external-ados-run-preparation`
    : `${projectId}:external-ados-run-preparation`;
}

function createAdosFeatureId(draft: ExternalProjectDevelopmentRequestDraft, timestamp: string) {
  const datePrefix = timestamp.replace(/[^0-9]/g, "").slice(0, 12) || "request";
  const slugSource = draft.title || draft.projectName || draft.projectId;
  const slug = slugSource.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48) || "development-request";
  return `${datePrefix}-${slug}`;
}

function compactRequirements(content: string) {
  return content.length <= 500 ? content : `${content.slice(0, 497)}...`;
}
