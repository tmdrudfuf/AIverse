import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import type { ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";

export type ProjectBacklogReadinessOrigin =
  | "operator-created"
  | "ai-suggestion-manual"
  | "ai-suggestion-automatic";

export type ProjectBacklogReadinessPromotionReason =
  | "PolicyDisabled"
  | "ProjectMissing"
  | "ProjectUnavailable"
  | "ProjectMismatch"
  | "ProjectDisconnected"
  | "TaskNotBacklog"
  | "TaskInvalid"
  | "TaskStale"
  | "PriorityNotAllowed"
  | "OriginNotAllowed"
  | "DuplicateReadyOrActiveWork"
  | "AlreadyPromoted"
  | "ActiveExecutionExists"
  | "BoundedLimitReached"
  | "PromotionFailed"
  | "NoEligibleBacklogTask";

export type ProjectBacklogReadinessPromotionPolicy = {
  projectId: string;
  enabled: boolean;
  allowedPriorities: ProjectBacklogPriority[];
  allowedOrigins: ProjectBacklogReadinessOrigin[];
  maxPromotionsPerEvaluation: number;
  requireNoActiveExecution: boolean;
  requireValidTask: true;
  requireNonDuplicate: true;
  updatedAt: string;
  updatedByOperator: boolean;
  lastEvaluation?: ProjectBacklogReadinessPromotionAudit;
};

export type ProjectBacklogReadinessPromotionPolicies = Record<string, ProjectBacklogReadinessPromotionPolicy>;

export type ProjectBacklogReadinessPromotionAudit = {
  evaluatedAt: string;
  promotedCount: number;
  skippedCount: number;
  latestResultText: string;
  promotedTaskIds: string[];
  skipped: ProjectBacklogReadinessPromotionSkip[];
};

export type ProjectBacklogReadinessPromotionSkip = {
  taskId: string;
  title?: string;
  reason: ProjectBacklogReadinessPromotionReason;
};

export type ProjectBacklogReadinessPromotionPromoted = {
  task: ProjectBacklogTask;
  reason: string;
};

export type ProjectBacklogReadinessPromotionEvaluationResult = {
  projectId: string;
  policy: ProjectBacklogReadinessPromotionPolicy;
  promoted: ProjectBacklogReadinessPromotionPromoted[];
  skipped: ProjectBacklogReadinessPromotionSkip[];
  evaluatedAt: string;
  latestResultText: string;
  activeExecutionCount: number;
};

export type ProjectBacklogReadinessDuplicateState = {
  developmentDrafts?: Readonly<Record<string, ExternalProjectDevelopmentRequestDraft>>;
  activeRunStatus?: ExternalProjectAdosRunStatus;
  activeExecutions?: ReadonlyArray<ExternalProjectAdosExecution>;
};
