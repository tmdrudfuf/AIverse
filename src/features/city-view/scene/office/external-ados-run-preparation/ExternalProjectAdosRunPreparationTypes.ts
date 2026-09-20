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
  // Carried from the project's local repository binding when known (see
  // LocalProjectRepositoryBinding.durableAdosRunId): the durable ADOS run
  // identity this request's bound repository/branch corresponds to.
  durableAdosRunId?: string;
};

export type ExternalProjectAdosRunPreparations = Record<string, ExternalProjectAdosRunPreparation>;
