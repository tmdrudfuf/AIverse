import type { ExternalProjectAdosExecutionReasonCode } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";

export const EXTERNAL_PROJECT_ADOS_RUN_STATUS_RULES_VERSION = "external-ados-run-status-v1";

export type ExternalProjectAdosRunStatusStage =
  | "NotPrepared"
  | "Prepared"
  | "Started"
  | "Completed"
  | "Blocked"
  | "Failed"
  | "TimedOut"
  | "Cancelled";

export type ExternalProjectAdosRunStatusSource = "preparation" | "execution" | "result";

export type ExternalProjectAdosRunStatus = {
  id: string;
  projectId: string;
  stage: ExternalProjectAdosRunStatusStage;
  status: string;
  source: ExternalProjectAdosRunStatusSource;
  preparationId?: string;
  executionId?: string;
  reasonCodes: ExternalProjectAdosExecutionReasonCode[];
  featureBranch?: string;
  worktreePath?: string;
  updatedAt: string;
  validationStarted: false;
  reviewStarted: false;
  repositoryMutationStarted: false;
  githubMutationStarted: false;
  publishStarted: false;
  mergeStarted: false;
  deployStarted: false;
  rulesVersion: string;
};

export type ExternalProjectAdosRunStatuses = Record<string, ExternalProjectAdosRunStatus>;

