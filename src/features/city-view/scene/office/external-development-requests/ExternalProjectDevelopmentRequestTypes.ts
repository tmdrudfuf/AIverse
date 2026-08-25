export type ExternalProjectDevelopmentRequestDraftStatus = "Draft";

export type ExternalProjectDevelopmentRequestDraft = {
  id: string;
  projectId: string;
  projectName: string;
  status: ExternalProjectDevelopmentRequestDraftStatus;
  title: string;
  summary: string;
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
