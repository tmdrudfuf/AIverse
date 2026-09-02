export type ProjectBacklogPlanningStatus =
  | "backlog"
  | "ready"
  | "in_progress"
  | "blocked"
  | "completed"
  | "cancelled";

export type ProjectBacklogPriority = "low" | "normal" | "high" | "urgent";

export type ProjectBacklogTask = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: ProjectBacklogPlanningStatus;
  priority: ProjectBacklogPriority;
  createdAt: string;
  updatedAt: string;
  blockedReason?: string;
  sourceBacklogTaskId?: string;
  developmentRequestId?: string;
  executionPreparationId?: string;
  executionRunId?: string;
  executionAcceptedAt?: string;
  sourceSuggestionId?: string;
  suggestionAcceptanceMode?: "manual" | "automatic";
  suggestionAcceptedAt?: string;
};

export type ProjectBacklogCollection = {
  projectId: string;
  tasks: ProjectBacklogTask[];
};

export type ProjectBacklogCollections = Record<string, ProjectBacklogCollection>;

export type ProjectBacklogSummary = {
  projectId: string;
  totalTaskCount: number;
  readyTaskCount: number;
  inDevelopmentTaskCount: number;
  executionBlockedTaskCount: number;
  blockedTaskCount: number;
  completedTaskCount: number;
  indicatorText: string;
  hasPlanningBlockedTasks: boolean;
  hasExecutionBlockedTasks: boolean;
};

export type ProjectBacklogMutationResult =
  | { ok: true; collection: ProjectBacklogCollection; task: ProjectBacklogTask }
  | { ok: false; reason: "MissingProject" | "UnavailableProject" | "TaskNotFound" | "ProjectMismatch" | "InvalidInput" };
