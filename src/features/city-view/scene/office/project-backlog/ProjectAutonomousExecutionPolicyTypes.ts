import type { ProjectBacklogPlanningStatus, ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";

export type ProjectAutonomyState = "off" | "waiting" | "eligible" | "running" | "blocked";

export type ProjectAutonomyReason =
  | "PolicyDisabled"
  | "ProjectMissing"
  | "ProjectUnavailable"
  | "ProjectMismatch"
  | "ProjectDisconnected"
  | "TaskNotReady"
  | "TaskContentMissing"
  | "TaskAlreadyAssociated"
  | "ActiveRunExists"
  | "ConcurrencyLimitReached"
  | "PriorityNotAllowed"
  | "ExecutionUnavailable"
  | "NoEligibleReadyTask";

export type ProjectAutonomyPolicy = {
  projectId: string;
  enabled: boolean;
  allowedPriorities: ProjectBacklogPriority[];
  maxConcurrentExecutions: number;
  requireNoActiveRun: boolean;
  allowedTaskStatuses: Extract<ProjectBacklogPlanningStatus, "ready">[];
  updatedAt: string;
  updatedByOperator: boolean;
  lastEvaluationReason?: ProjectAutonomyReason;
};

export type ProjectAutonomyPolicies = Record<string, ProjectAutonomyPolicy>;

export type ProjectAutonomyEvaluationResult = {
  projectId: string;
  policy: ProjectAutonomyPolicy;
  state: ProjectAutonomyState;
  reason?: ProjectAutonomyReason;
  selectedTask?: ProjectBacklogTask;
  eligibleTaskCount: number;
  activeExecutionCount: number;
};
