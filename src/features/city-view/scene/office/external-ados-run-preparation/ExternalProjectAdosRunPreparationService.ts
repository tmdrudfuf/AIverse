import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import type { ExternalProjectAdosRunPreparation } from "./ExternalProjectAdosRunPreparationTypes";

export const EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY =
  "Local preparation only; validation, review, runtime, repository, GitHub, publish, merge, and deploy are not started.";

export const EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS = {
  featureBranch: "codex/129-trusted-local-ados-execution-bridge",
  authoritativeBaseSha: "00f22e1997979c087a1d85f9a6b01fe5450bfdf5",
  specPath: "specs/129-trusted-local-ados-execution-bridge/spec.md",
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

  return {
    id: `${input.projectId}:external-ados-run-preparation`,
    projectId: input.projectId,
    developmentRequestDraftId: input.developmentRequestDraft.id,
    status: "Prepared",
    featureBranch: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.featureBranch,
    authoritativeBaseSha: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.authoritativeBaseSha,
    specPath: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.specPath,
    validationCommands: [...EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.validationCommands],
    reviewerCommand: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.reviewerCommand,
    executionPolicyVersion: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.executionPolicyVersion,
    createdAt: timestamp,
    updatedAt: timestamp,
    sideEffectBoundary: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_BOUNDARY,
  };
}
