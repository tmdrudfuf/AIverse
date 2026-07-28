import type { IssueState, IssueSyncStatus } from "../issue-sync/IssueSyncTypes";

export type CandidateTaskPriority = "High" | "Medium" | "Low" | "Normal";

export type CandidateTaskType =
  | "Bug"
  | "Feature"
  | "Documentation"
  | "Maintenance"
  | "Research"
  | "Unknown";

export type CandidateTask = {
  id: string;
  originatingIssueId: string;
  issueNumber: number;
  projectId: string;
  title: string;
  summary: string;
  labels: string[];
  assignees: string[];
  state: IssueState;
  estimatedPriority: CandidateTaskPriority;
  estimatedTaskType: CandidateTaskType;
  sourceProvider: string;
  sourceRepositoryOwner?: string;
  sourceRepositoryName?: string;
  sourceUrl?: string;
  issueCreatedAt: string;
  issueUpdatedAt: string;
  issueClosedAt?: string;
  mappedAt: string;
  syncedAt: string;
};

export type CandidateTaskCollection = {
  projectId: string;
  sourceProvider: string;
  syncStatus: IssueSyncStatus;
  tasks: CandidateTask[];
  taskCount: number;
  mappedAt?: string;
  sourceIssueCount: number;
  sourceIssueSyncStatus: IssueSyncStatus;
  sourceIssueSyncedAt?: string;
  errorSummary?: string;
};

export function createCandidateTaskCollection(
  input: Omit<CandidateTaskCollection, "tasks" | "taskCount"> & { tasks: ReadonlyArray<CandidateTask> },
): CandidateTaskCollection {
  const tasks = input.tasks.map(copyCandidateTask);
  return {
    ...input,
    tasks,
    taskCount: tasks.length,
  };
}

export function copyCandidateTask(task: CandidateTask): CandidateTask {
  return {
    ...task,
    labels: [...task.labels],
    assignees: [...task.assignees],
  };
}
