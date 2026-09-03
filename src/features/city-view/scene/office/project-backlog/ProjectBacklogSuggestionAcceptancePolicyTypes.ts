import type { ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCandidate } from "./ProjectBacklogSuggestionTypes";

export type ProjectBacklogSuggestionAcceptanceReason =
  | "PolicyDisabled"
  | "ProjectMissing"
  | "ProjectUnavailable"
  | "ProjectMismatch"
  | "ProjectDisconnected"
  | "SuggestionNotProposed"
  | "InvalidSuggestion"
  | "PriorityNotAllowed"
  | "DuplicateBacklogItem"
  | "AlreadyAccepted"
  | "BoundedLimitReached";

export type ProjectBacklogSuggestionAcceptancePolicy = {
  projectId: string;
  enabled: boolean;
  allowedPriorities: ProjectBacklogPriority[];
  maxAutoAcceptPerEvaluation: number;
  requireNonDuplicate: true;
  requireValidStructuredSuggestion: true;
  createdTaskInitialStatus: "backlog";
  updatedAt: string;
  updatedByOperator: boolean;
  lastEvaluation?: ProjectBacklogSuggestionAcceptanceAudit;
};

export type ProjectBacklogSuggestionAcceptancePolicies = Record<string, ProjectBacklogSuggestionAcceptancePolicy>;

export type ProjectBacklogSuggestionAcceptanceAudit = {
  evaluatedAt: string;
  acceptedCount: number;
  skippedCount: number;
  latestResultText: string;
  acceptedSuggestionIds: string[];
  skipped: ProjectBacklogSuggestionAcceptanceSkip[];
};

export type ProjectBacklogSuggestionAcceptanceSkip = {
  suggestionId: string;
  title?: string;
  reason: ProjectBacklogSuggestionAcceptanceReason;
};

export type ProjectBacklogSuggestionAcceptanceAccepted = {
  suggestion: ProjectBacklogSuggestionCandidate;
  task: ProjectBacklogTask;
  reason: string;
};

export type ProjectBacklogSuggestionAcceptanceEvaluationResult = {
  projectId: string;
  policy: ProjectBacklogSuggestionAcceptancePolicy;
  accepted: ProjectBacklogSuggestionAcceptanceAccepted[];
  skipped: ProjectBacklogSuggestionAcceptanceSkip[];
  evaluatedAt: string;
  latestResultText: string;
};
