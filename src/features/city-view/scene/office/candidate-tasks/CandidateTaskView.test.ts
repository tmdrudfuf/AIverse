import { describe, expect, it } from "vitest";
import { createCandidateTaskDisplayRows } from "./CandidateTaskView";
import type { CandidateTaskCollection } from "./CandidateTaskTypes";

describe("CandidateTaskView", () => {
  it("renders a candidate task count and top task separately from raw issues", () => {
    const rows = createCandidateTaskDisplayRows(collection());

    expect(rows.statusText).toBe("Succeeded - 1 candidate task");
    expect(rows.topTaskText).toBe("High/Bug #42 Fix candidate mapping bug (Open)");
  });

  it("renders honest unavailable and pending states without fabricated tasks", () => {
    expect(createCandidateTaskDisplayRows(undefined).statusText).toBe("Not mapped");
    expect(createCandidateTaskDisplayRows({ ...collection(), syncStatus: "Syncing", tasks: [], taskCount: 0 }).statusText)
      .toBe("Mapping after issue sync...");
    expect(createCandidateTaskDisplayRows({
      ...collection(),
      syncStatus: "Unavailable",
      tasks: [],
      taskCount: 0,
      errorSummary: "Issue sync unavailable",
    }).statusText).toBe("Unavailable: Issue sync unavailable");
  });
});

function collection(): CandidateTaskCollection {
  return {
    projectId: "daily-proof",
    sourceProvider: "github",
    syncStatus: "Succeeded",
    taskCount: 1,
    mappedAt: "2026-07-27T00:00:00.000Z",
    sourceIssueCount: 1,
    sourceIssueSyncStatus: "Succeeded",
    sourceIssueSyncedAt: "2026-07-27T00:00:00.000Z",
    tasks: [{
      id: "daily-proof:candidate-task:issue-42",
      originatingIssueId: "issue-42",
      issueNumber: 42,
      projectId: "daily-proof",
      title: "Fix candidate mapping bug",
      summary: "Fix candidate mapping bug",
      labels: ["bug"],
      assignees: [],
      state: "Open",
      estimatedPriority: "High",
      estimatedTaskType: "Bug",
      sourceProvider: "github",
      issueCreatedAt: "2026-07-01T00:00:00.000Z",
      issueUpdatedAt: "2026-07-02T00:00:00.000Z",
      mappedAt: "2026-07-27T00:00:00.000Z",
      syncedAt: "2026-07-27T00:00:00.000Z",
    }],
  };
}
