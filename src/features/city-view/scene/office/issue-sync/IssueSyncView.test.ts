import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { createIssueSyncDisplayRows } from "./IssueSyncView";
import type { IssueSnapshot, IssueSnapshotCollection } from "./IssueSyncTypes";

const IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

const LOWER_ROW_WRAP_LENGTH = 78;

function createIssue(overrides: Partial<IssueSnapshot> = {}): IssueSnapshot {
  return {
    id: "ai-verse/daily-proof#1",
    number: 1,
    title: "Fix bug",
    state: "Open",
    assignees: [],
    labels: [],
    provider: "github",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    syncedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function createCollection(overrides: Partial<IssueSnapshotCollection> = {}): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    ...overrides,
  };
}

describe("createIssueSyncDisplayRows", () => {
  it("reports No repository identity when identity is absent", () => {
    expect(createIssueSyncDisplayRows(undefined, undefined)).toEqual({ statusText: "No repository identity" });
  });

  it("reports Not started when an identity exists but no collection has been produced yet", () => {
    expect(createIssueSyncDisplayRows(IDENTITY, undefined)).toEqual({ statusText: "Not started" });
  });

  it("reports Syncing while a fetch is in flight", () => {
    const collection = createCollection({ syncStatus: "Syncing" });
    expect(createIssueSyncDisplayRows(IDENTITY, collection)).toEqual({ statusText: "Syncing..." });
  });

  it("reports Succeeded with open/closed counts and no issue rows when the collection is empty", () => {
    const collection = createCollection({ syncStatus: "Succeeded", openCount: 0, closedCount: 0, issues: [] });
    expect(createIssueSyncDisplayRows(IDENTITY, collection)).toEqual({
      statusText: "Succeeded · 0 open, 0 closed",
    });
  });

  it("reports Succeeded with issues, the top issue's list line, and a +N more suffix", () => {
    const collection = createCollection({
      syncStatus: "Succeeded",
      openCount: 2,
      closedCount: 1,
      issues: [
        createIssue({ number: 12, title: "Fix crash on launch", state: "Open" }),
        createIssue({ number: 8, title: "Second issue", state: "Open" }),
        createIssue({ number: 3, title: "Third issue", state: "Closed" }),
      ],
    });

    const rows = createIssueSyncDisplayRows(IDENTITY, collection);

    expect(rows.statusText).toBe("Succeeded · 2 open, 1 closed");
    expect(rows.issueListText).toBe("#12 Fix crash on launch (Open); +2 more");
  });

  it("omits the +N more suffix when there is exactly one issue", () => {
    const collection = createCollection({
      syncStatus: "Succeeded",
      openCount: 1,
      closedCount: 0,
      issues: [createIssue({ number: 1, title: "Only issue", state: "Open" })],
    });

    const rows = createIssueSyncDisplayRows(IDENTITY, collection);

    expect(rows.issueListText).toBe("#1 Only issue (Open)");
  });

  it("appends a partial indicator when the collection is truncated", () => {
    const collection = createCollection({ syncStatus: "Succeeded", openCount: 5, closedCount: 0, isTruncated: true });
    expect(createIssueSyncDisplayRows(IDENTITY, collection).statusText).toBe("Succeeded · 5 open, 0 closed · partial");
  });

  it("reports the display-safe reason on a Failed collection", () => {
    const collection = createCollection({ syncStatus: "Failed", errorSummary: "Unable to reach GitHub." });
    expect(createIssueSyncDisplayRows(IDENTITY, collection)).toEqual({
      statusText: "Failed: Unable to reach GitHub.",
    });
  });

  it("reports the display-safe reason on an Unavailable collection", () => {
    const collection = createCollection({
      syncStatus: "Unavailable",
      provider: "local",
      errorSummary: "Local repository reads need server-side support.",
    });
    expect(createIssueSyncDisplayRows(IDENTITY, collection)).toEqual({
      statusText: "Unavailable: Local repository reads need server-side support.",
    });
  });

  it("includes a labels/assignees detail row when the top issue has either", () => {
    const collection = createCollection({
      syncStatus: "Succeeded",
      openCount: 1,
      closedCount: 0,
      issues: [createIssue({ labels: ["bug", "priority"], assignees: ["octocat"] })],
    });

    const rows = createIssueSyncDisplayRows(IDENTITY, collection);

    expect(rows.issueDetailText).toBe("Labels: bug, priority · Assignees: octocat");
  });

  it("omits the labels/assignees detail row when the top issue has neither", () => {
    const collection = createCollection({
      syncStatus: "Succeeded",
      openCount: 1,
      closedCount: 0,
      issues: [createIssue({ labels: [], assignees: [] })],
    });

    const rows = createIssueSyncDisplayRows(IDENTITY, collection);

    expect(rows.issueDetailText).toBeUndefined();
  });

  it("bounds a long title, worst-case labels/assignees, and a two-digit hidden count within the row wrap budget", () => {
    const longTitle = "X".repeat(200);
    const manyLabels = Array.from({ length: 5 }, () => "Y".repeat(50));
    const manyAssignees = Array.from({ length: 5 }, () => "Z".repeat(50));
    const collection = createCollection({
      syncStatus: "Succeeded",
      openCount: 50,
      closedCount: 0,
      isTruncated: true,
      issues: Array.from({ length: 50 }, (_, index) =>
        createIssue({
          number: 9999 - index,
          title: longTitle,
          state: "Closed",
          labels: manyLabels,
          assignees: manyAssignees,
        }),
      ),
    });

    const rows = createIssueSyncDisplayRows(IDENTITY, collection);

    expect(`[ISSUES] ${rows.statusText}`.length).toBeLessThanOrEqual(LOWER_ROW_WRAP_LENGTH);
    expect(`[ISSUE LIST] ${rows.issueListText}`.length).toBeLessThanOrEqual(LOWER_ROW_WRAP_LENGTH);
    expect(`[ISSUE DETAIL] ${rows.issueDetailText}`.length).toBeLessThanOrEqual(LOWER_ROW_WRAP_LENGTH);
    expect(rows.issueListText).toContain("+49 more");
  });
});
