export type ExternalProjectAdosRunPreparationStatus = "Prepared";

export type ExternalProjectAdosRunPreparation = {
  id: string;
  projectId: string;
  developmentRequestDraftId: string;
  status: ExternalProjectAdosRunPreparationStatus;
  featureId?: string;
  featureBranch: string;
  authoritativeBaseSha: string;
  specPath: string;
  requirementsFilePath?: string;
  requirementsFileContent?: string;
  requirementsPreview?: string;
  validationCommands: string[];
  reviewerCommand: string;
  executionPolicyVersion: number;
  createdAt: string;
  updatedAt: string;
  sideEffectBoundary: string;
};

export type ExternalProjectAdosRunPreparations = Record<string, ExternalProjectAdosRunPreparation>;
