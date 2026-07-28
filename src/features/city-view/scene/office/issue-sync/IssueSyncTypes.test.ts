import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import {
  createFailedIssueSnapshotCollection,
  createNotStartedIssueSnapshotCollection,
  createSyncingIssueSnapshotCollection,
  createUnavailableIssueSnapshotCollection,
} from "./IssueSyncTypes";

const GITHUB_IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

const LOCAL_IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "local",
  connectionState: "Unknown",
};

describe("createNotStartedIssueSnapshotCollection", () => {
  it("carries identity fields and reports NotStarted with an empty collection", () => {
    expect(createNotStartedIssueSnapshotCollection(GITHUB_IDENTITY)).toEqual({
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      syncStatus: "NotStarted",
      issues: [],
      openCount: 0,
      closedCount: 0,
      isTruncated: false,
    });
  });

  it("degrades safely for a sparse identity with no owner/name", () => {
    expect(createNotStartedIssueSnapshotCollection(LOCAL_IDENTITY)).toEqual({
      provider: "local",
      owner: undefined,
      name: undefined,
      syncStatus: "NotStarted",
      issues: [],
      openCount: 0,
      closedCount: 0,
      isTruncated: false,
    });
  });

  it("returns a fresh issues array on every call", () => {
    const first = createNotStartedIssueSnapshotCollection(GITHUB_IDENTITY);
    const second = createNotStartedIssueSnapshotCollection(GITHUB_IDENTITY);
    expect(first.issues).not.toBe(second.issues);
  });
});

describe("createSyncingIssueSnapshotCollection", () => {
  it("reports Syncing with an empty collection and no previous timestamp", () => {
    expect(createSyncingIssueSnapshotCollection(GITHUB_IDENTITY)).toMatchObject({
      syncStatus: "Syncing",
      issues: [],
      lastSuccessfulSyncAt: undefined,
    });
  });

  it("carries the previous collection's lastSuccessfulSyncAt forward", () => {
    const previous = createUnavailableIssueSnapshotCollection(GITHUB_IDENTITY, "unused");
    previous.lastSuccessfulSyncAt = "2026-01-01T00:00:00.000Z";

    const syncing = createSyncingIssueSnapshotCollection(GITHUB_IDENTITY, previous);

    expect(syncing.lastSuccessfulSyncAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("createUnavailableIssueSnapshotCollection", () => {
  it("reports Unavailable with the given display-safe reason and an empty collection", () => {
    expect(createUnavailableIssueSnapshotCollection(LOCAL_IDENTITY, "No provider is registered.")).toEqual({
      provider: "local",
      owner: undefined,
      name: undefined,
      syncStatus: "Unavailable",
      issues: [],
      openCount: 0,
      closedCount: 0,
      isTruncated: false,
      errorSummary: "No provider is registered.",
    });
  });
});

describe("createFailedIssueSnapshotCollection", () => {
  it("reports Failed with the given display-safe reason and an empty collection", () => {
    expect(createFailedIssueSnapshotCollection(GITHUB_IDENTITY, "Unable to reach GitHub.")).toEqual({
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      syncStatus: "Failed",
      issues: [],
      openCount: 0,
      closedCount: 0,
      isTruncated: false,
      errorSummary: "Unable to reach GitHub.",
    });
  });
});
