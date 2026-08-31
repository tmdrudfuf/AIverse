export type ExternalProjectDevelopmentRequestDraftStatus =
  | "Draft"
  | "Preparing"
  | "Prepared"
  | "Submitting"
  | "Started"
  | "AlreadyActive"
  | "Blocked"
  | "Failed"
  | "Completed";

export type ExternalProjectDevelopmentRequestDraft = {
  id: string;
  projectId: string;
  projectName: string;
  companyName?: string;
  status: ExternalProjectDevelopmentRequestDraftStatus;
  title: string;
  summary: string;
  requestText?: string;
  targetProjectIdentity?: string;
  localProjectPath?: string;
  requirementsArtifactPath?: string;
  requirementsArtifactContent?: string;
  adosRunId?: string;
  repositoryProvider: string;
  repositoryOwner?: string;
  repositoryName?: string;
  branchName?: string;
  specPath?: string;
  createdAt: string;
  updatedAt: string;
  sideEffectBoundary: string;
};

export type ExternalProjectDevelopmentRequestDrafts = Record<string, ExternalProjectDevelopmentRequestDraft>;
