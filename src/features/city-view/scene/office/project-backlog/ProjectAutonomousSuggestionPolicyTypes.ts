import type { ExternalProjectAdosExecution } from "../external-ados-execution/ExternalProjectAdosExecutionTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ExternalProjectDevelopmentRequestDraft } from "../external-development-requests/ExternalProjectDevelopmentRequestTypes";
import type { ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCandidate } from "./ProjectBacklogSuggestionTypes";

export type ProjectAutonomousSuggestionEventType =
  | "policy-change"
  | "explicit-evaluation"
  | "execution-completion"
  | "task-completion"
  | "project-idle";

export type ProjectAutonomousSuggestionReason =
  | "Generated"
  | "PolicyDisabled"
  | "ProjectMissing"
  | "ProjectUnavailable"
  | "ProjectMismatch"
  | "ProjectDisconnected"
  | "MalformedPolicy"
  | "CooldownActive"
  | "ActiveExecutionExists"
  | "ReadyWorkPending"
  | "PendingSuggestionExists"
  | "PlanningCapacityReached"
  | "DuplicateEvent"
  | "DuplicateWorkExists"
  | "GenerationUnavailable"
  | "NoSuggestionsGenerated";

export type ProjectAutonomousSuggestionPolicy = {
  projectId: string;
  enabled: boolean;
  maxSuggestionsPerEvaluation: number;
  cooldownMs: number;
  requireNoActiveExecution: boolean;
  requireNoPendingReadyTask: boolean;
  requireNoExistingEligibleSuggestion: boolean;
  minimumPlanningCapacity: number;
  maxUnresolvedPlanningItems: number;
  updatedAt: string;
  updatedByOperator: boolean;
  lastEvaluation?: ProjectAutonomousSuggestionAudit;
};

export type ProjectAutonomousSuggestionPolicies = Record<string, ProjectAutonomousSuggestionPolicy>;

export type ProjectAutonomousSuggestionAudit = {
  evaluatedAt: string;
  eventId: string;
  eventType: ProjectAutonomousSuggestionEventType;
  latestResultText: string;
  reason: ProjectAutonomousSuggestionReason;
  generatedCount: number;
  skippedCount: number;
  providerInvoked: boolean;
  lastAutomaticGenerationAt?: string;
  lastGeneratedSuggestionId?: string;
  evaluatedEventIds: string[];
};

export type ProjectAutonomousSuggestionEvaluationEvent = {
  projectId: string;
  eventId: string;
  eventType: ProjectAutonomousSuggestionEventType;
  occurredAt: string;
};

export type ProjectAutonomousSuggestionEvaluationResult = {
  projectId: string;
  policy: ProjectAutonomousSuggestionPolicy;
  event: ProjectAutonomousSuggestionEvaluationEvent;
  allowed: boolean;
  reason: ProjectAutonomousSuggestionReason;
  evaluatedAt: string;
  latestResultText: string;
  generated: ProjectBacklogSuggestionCandidate[];
  skippedCount: number;
  providerInvoked: boolean;
};

export type ProjectAutonomousSuggestionPlanningState = {
  backlogTasks: ReadonlyArray<ProjectBacklogTask>;
  suggestions: ReadonlyArray<ProjectBacklogSuggestionCandidate>;
  developmentDrafts?: Readonly<Record<string, ExternalProjectDevelopmentRequestDraft>>;
  activeRunStatus?: ExternalProjectAdosRunStatus;
  activeExecutions?: ReadonlyArray<ExternalProjectAdosExecution>;
};
