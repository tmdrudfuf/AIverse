import { describe, expect, it } from "vitest";
import type { IssueSnapshot, IssueSnapshotCollection } from "../issue-sync/IssueSyncTypes";
import { CandidateTaskMapper } from "./CandidateTaskMapper";

describe("CandidateTaskMapper", () => {
  it.each([
    [["bug"], "High", "Bug"],
    [["enhancement"], "Medium", "Feature"],
    [["documentation"], "Low", "Documentation"],
    [["maintenance"], "Normal", "Maintenance"],
    [["research"], "Normal", "Research"],
    [["unknown"], "Normal", "Unknown"],
    [[], "Normal", "Unknown"],
  ] as const)("infers priority and task type from labels %j", (labels, priority, taskType) => {
    const mapper = new CandidateTaskMapper();
    const collection = mapper.mapIssueCollection("daily-proof", succeededCollection([
      issue({ id: "issue-1", number: 1, labels: [...labels] }),
    ]));

    expect(collection.tasks[0]!.estimatedPriority).toBe(priority);
    expect(collection.tasks[0]!.estimatedTaskType).toBe(taskType);
  });

  it("maps each unique issue snapshot to one deterministic candidate task", () => {
    const mapper = new CandidateTaskMapper();
    const input = succeededCollection([
      issue({ id: "issue-1", number: 1, title: "Fix crash", labels: ["Bug"], assignees: ["octocat"] }),
      issue({ id: "issue-2", number: 2, title: "Add export", labels: [" enhancement "] }),
    ]);

    const first = mapper.mapIssueCollection("daily-proof", input);
    const second = mapper.mapIssueCollection("daily-proof", input);

    expect(first).toEqual(second);
    expect(first.syncStatus).toBe("Succeeded");
    expect(first.taskCount).toBe(2);
    expect(first.tasks.map((task) => task.id)).toEqual([
      "daily-proof:candidate-task:issue-1",
      "daily-proof:candidate-task:issue-2",
    ]);
    expect(first.tasks[0]).toMatchObject({
      originatingIssueId: "issue-1",
      issueNumber: 1,
      projectId: "daily-proof",
      title: "Fix crash",
      summary: "Body summary",
      labels: ["Bug"],
      assignees: ["octocat"],
      state: "Open",
      sourceProvider: "github",
      sourceRepositoryOwner: "ai-verse",
      sourceRepositoryName: "daily-proof",
      mappedAt: "2026-07-27T00:00:00.000Z",
      syncedAt: "2026-07-27T00:00:00.000Z",
    });
  });

  it("deduplicates duplicate issue identities without creating duplicate tasks", () => {
    const mapper = new CandidateTaskMapper();
    const collection = mapper.mapIssueCollection("daily-proof", succeededCollection([
      issue({ id: "issue-1", number: 1, title: "First" }),
      issue({ id: "issue-1", number: 1, title: "Duplicate" }),
    ]));

    expect(collection.taskCount).toBe(1);
    expect(collection.tasks[0]!.title).toBe("First");
  });

  it("defensively copies issue labels and assignees", () => {
    const mapper = new CandidateTaskMapper();
    const inputIssue = issue({ id: "issue-1", number: 1, labels: ["bug"], assignees: ["octocat"] });
    const collection = mapper.mapIssueCollection("daily-proof", succeededCollection([inputIssue]));

    inputIssue.labels.push("mutated");
    inputIssue.assignees.push("mutated");
    collection.tasks[0]!.labels.push("caller mutation");

    const next = mapper.mapIssueCollection("daily-proof", succeededCollection([issue({
      id: "issue-1",
      number: 1,
      labels: ["bug"],
      assignees: ["octocat"],
    })]));

    expect(next.tasks[0]!.labels).toEqual(["bug"]);
    expect(next.tasks[0]!.assignees).toEqual(["octocat"]);
  });

  it("maps an empty succeeded issue collection to an empty succeeded candidate collection", () => {
    const mapper = new CandidateTaskMapper();
    const collection = mapper.mapIssueCollection("daily-proof", succeededCollection([]));

    expect(collection.syncStatus).toBe("Succeeded");
    expect(collection.taskCount).toBe(0);
    expect(collection.tasks).toEqual([]);
    expect(collection.sourceIssueCount).toBe(0);
  });

  it.each(["NotStarted", "Syncing", "Failed", "Unavailable"] as const)(
    "does not fabricate tasks when issue sync is %s",
    (syncStatus) => {
      const mapper = new CandidateTaskMapper();
      const collection = mapper.mapIssueCollection("daily-proof", {
        provider: "github",
        syncStatus,
        issues: [issue({ id: "issue-1", number: 1 })],
        openCount: 1,
        closedCount: 0,
        isTruncated: false,
        errorSummary: syncStatus === "Failed" ? "network failed" : undefined,
      });

      expect(collection.syncStatus).toBe(syncStatus);
      expect(collection.tasks).toEqual([]);
      expect(collection.taskCount).toBe(0);
    },
  );
});

function succeededCollection(issues: IssueSnapshot[]): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues,
    openCount: issues.filter((item) => item.state === "Open").length,
    closedCount: issues.filter((item) => item.state === "Closed").length,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-07-27T00:00:00.000Z",
  };
}

function issue(overrides: Partial<IssueSnapshot>): IssueSnapshot {
  return {
    id: "issue-1",
    number: 1,
    title: "Issue title",
    bodySummary: "Body summary",
    state: "Open",
    assignees: [],
    labels: [],
    owner: "ai-verse",
    name: "daily-proof",
    provider: "github",
    url: "https://github.com/ai-verse/daily-proof/issues/1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-02T00:00:00.000Z",
    syncedAt: "2026-07-27T00:00:00.000Z",
    ...overrides,
  };
}
