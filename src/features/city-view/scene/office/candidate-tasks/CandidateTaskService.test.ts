import { describe, expect, it } from "vitest";
import type { IssueSnapshotCollection } from "../issue-sync/IssueSyncTypes";
import { CandidateTaskService } from "./CandidateTaskService";

describe("CandidateTaskService", () => {
  it("delegates issue collection mapping without provider reads", () => {
    const service = new CandidateTaskService();
    const collection = service.mapIssueCollection("daily-proof", {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      syncStatus: "Succeeded",
      issues: [{
        id: "issue-7",
        number: 7,
        title: "Document setup",
        state: "Open",
        labels: ["documentation"],
        assignees: [],
        provider: "github",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-02T00:00:00.000Z",
        syncedAt: "2026-07-27T00:00:00.000Z",
      }],
      openCount: 1,
      closedCount: 0,
      isTruncated: false,
      lastSuccessfulSyncAt: "2026-07-27T00:00:00.000Z",
    } satisfies IssueSnapshotCollection);

    expect(collection.taskCount).toBe(1);
    expect(collection.tasks[0]).toMatchObject({
      id: "daily-proof:candidate-task:issue-7",
      estimatedPriority: "Low",
      estimatedTaskType: "Documentation",
    });
  });
});
