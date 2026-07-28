import type { IssueSnapshot, IssueSnapshotCollection } from "../issue-sync/IssueSyncTypes";
import {
  copyCandidateTask,
  createCandidateTaskCollection,
  type CandidateTask,
  type CandidateTaskCollection,
  type CandidateTaskPriority,
  type CandidateTaskType,
} from "./CandidateTaskTypes";

const HIGH_PRIORITY_LABELS = new Set(["bug"]);
const MEDIUM_PRIORITY_LABELS = new Set(["enhancement"]);
const LOW_PRIORITY_LABELS = new Set(["documentation", "docs"]);

const TASK_TYPE_LABELS: Array<{ labels: ReadonlySet<string>; taskType: CandidateTaskType }> = [
  { labels: new Set(["bug"]), taskType: "Bug" },
  { labels: new Set(["enhancement", "feature"]), taskType: "Feature" },
  { labels: new Set(["documentation", "docs"]), taskType: "Documentation" },
  { labels: new Set(["maintenance", "chore", "refactor", "tech debt", "technical debt"]), taskType: "Maintenance" },
  { labels: new Set(["research", "investigation", "spike"]), taskType: "Research" },
];

export class CandidateTaskMapper {
  mapIssueCollection(projectId: string, collection: IssueSnapshotCollection): CandidateTaskCollection {
    if (collection.syncStatus !== "Succeeded") {
      return createCandidateTaskCollection({
        projectId,
        sourceProvider: collection.provider,
        syncStatus: collection.syncStatus,
        tasks: [],
        sourceIssueCount: collection.issues.length,
        sourceIssueSyncStatus: collection.syncStatus,
        sourceIssueSyncedAt: collection.lastSuccessfulSyncAt,
        errorSummary: collection.errorSummary ?? createUnavailableSummary(collection.syncStatus),
      });
    }

    const mappedAt = getCollectionMappedAt(collection);
    const uniqueIssues = uniqueIssueSnapshots(collection.issues);
    const tasks = uniqueIssues.map((issue) => this.mapIssue(projectId, collection, issue, mappedAt));

    return createCandidateTaskCollection({
      projectId,
      sourceProvider: collection.provider,
      syncStatus: "Succeeded",
      tasks,
      mappedAt,
      sourceIssueCount: uniqueIssues.length,
      sourceIssueSyncStatus: collection.syncStatus,
      sourceIssueSyncedAt: mappedAt,
    });
  }

  inferPriority(labels: ReadonlyArray<string>): CandidateTaskPriority {
    const normalizedLabels = normalizeLabels(labels);
    if (normalizedLabels.some((label) => HIGH_PRIORITY_LABELS.has(label))) return "High";
    if (normalizedLabels.some((label) => MEDIUM_PRIORITY_LABELS.has(label))) return "Medium";
    if (normalizedLabels.some((label) => LOW_PRIORITY_LABELS.has(label))) return "Low";
    return "Normal";
  }

  inferTaskType(labels: ReadonlyArray<string>): CandidateTaskType {
    const normalizedLabels = normalizeLabels(labels);
    for (const rule of TASK_TYPE_LABELS) {
      if (normalizedLabels.some((label) => rule.labels.has(label))) return rule.taskType;
    }
    return "Unknown";
  }

  private mapIssue(
    projectId: string,
    collection: IssueSnapshotCollection,
    issue: IssueSnapshot,
    mappedAt: string,
  ): CandidateTask {
    const labels = [...issue.labels];
    const assignees = [...issue.assignees];
    return copyCandidateTask({
      id: createCandidateTaskId(projectId, issue),
      originatingIssueId: issue.id,
      issueNumber: issue.number,
      projectId,
      title: issue.title,
      summary: issue.bodySummary?.trim() || issue.title,
      labels,
      assignees,
      state: issue.state,
      estimatedPriority: this.inferPriority(labels),
      estimatedTaskType: this.inferTaskType(labels),
      sourceProvider: issue.provider || collection.provider,
      sourceRepositoryOwner: issue.owner ?? collection.owner,
      sourceRepositoryName: issue.name ?? collection.name,
      sourceUrl: issue.url,
      issueCreatedAt: issue.createdAt,
      issueUpdatedAt: issue.updatedAt,
      issueClosedAt: issue.closedAt,
      mappedAt,
      syncedAt: issue.syncedAt,
    });
  }
}

function normalizeLabels(labels: ReadonlyArray<string>): string[] {
  return labels
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean);
}

function uniqueIssueSnapshots(issues: ReadonlyArray<IssueSnapshot>): IssueSnapshot[] {
  const seen = new Set<string>();
  const unique: IssueSnapshot[] = [];

  for (const issue of issues) {
    const key = issue.id || `#${issue.number}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({
      ...issue,
      labels: [...issue.labels],
      assignees: [...issue.assignees],
    });
  }

  return unique;
}

function createCandidateTaskId(projectId: string, issue: IssueSnapshot) {
  const issueIdentity = issue.id || `issue-${issue.number}`;
  return `${projectId}:candidate-task:${issueIdentity}`;
}

function getCollectionMappedAt(collection: IssueSnapshotCollection) {
  return collection.lastSuccessfulSyncAt
    ?? collection.issues[0]?.syncedAt
    ?? new Date(0).toISOString();
}

function createUnavailableSummary(syncStatus: IssueSnapshotCollection["syncStatus"]) {
  if (syncStatus === "NotStarted") return "Issue synchronization has not started.";
  if (syncStatus === "Syncing") return "Issue synchronization is still running.";
  return "Issue synchronization is not available for candidate task mapping.";
}
