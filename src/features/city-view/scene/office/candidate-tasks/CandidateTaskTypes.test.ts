import { describe, expect, it } from "vitest";
import { createCandidateTaskCollection, type CandidateTask } from "./CandidateTaskTypes";

describe("CandidateTaskTypes", () => {
  it("defensively copies task labels and assignees", () => {
    const task = createTask();
    const collection = createCandidateTaskCollection({
      projectId: "daily-proof",
      sourceProvider: "github",
      syncStatus: "Succeeded",
      tasks: [task],
      mappedAt: "2026-07-27T00:00:00.000Z",
      sourceIssueCount: 1,
      sourceIssueSyncStatus: "Succeeded",
      sourceIssueSyncedAt: "2026-07-27T00:00:00.000Z",
    });

    task.labels.push("mutated");
    task.assignees.push("mutated");
    collection.tasks[0]!.labels.push("caller mutation");

    const nextCollection = createCandidateTaskCollection({
      projectId: "daily-proof",
      sourceProvider: "github",
      syncStatus: "Succeeded",
      tasks: [createTask()],
      mappedAt: "2026-07-27T00:00:00.000Z",
      sourceIssueCount: 1,
      sourceIssueSyncStatus: "Succeeded",
      sourceIssueSyncedAt: "2026-07-27T00:00:00.000Z",
    });

    expect(collection.taskCount).toBe(1);
    expect(collection.tasks[0]!.labels).toEqual(["bug", "caller mutation"]);
    expect(nextCollection.tasks[0]!.labels).toEqual(["bug"]);
    expect(nextCollection.tasks[0]!.assignees).toEqual(["octocat"]);
  });
});

function createTask(): CandidateTask {
  return {
    id: "daily-proof:candidate-task:ai-verse/daily-proof#1",
    originatingIssueId: "ai-verse/daily-proof#1",
    issueNumber: 1,
    projectId: "daily-proof",
    title: "Fix a bug",
    summary: "Fix a bug",
    labels: ["bug"],
    assignees: ["octocat"],
    state: "Open",
    estimatedPriority: "High",
    estimatedTaskType: "Bug",
    sourceProvider: "github",
    sourceRepositoryOwner: "ai-verse",
    sourceRepositoryName: "daily-proof",
    issueCreatedAt: "2026-07-01T00:00:00.000Z",
    issueUpdatedAt: "2026-07-02T00:00:00.000Z",
    mappedAt: "2026-07-27T00:00:00.000Z",
    syncedAt: "2026-07-27T00:00:00.000Z",
  };
}
