import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { createRepositorySyncDisplayRows } from "./RepositorySyncView";
import type { RepositorySyncSnapshot } from "./RepositorySyncTypes";

const IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

describe("createRepositorySyncDisplayRows", () => {
  it("returns no rows when no repository identity is present", () => {
    expect(createRepositorySyncDisplayRows(undefined, undefined)).toEqual([]);
  });

  it("reports Not started when an identity exists but no snapshot has been produced yet", () => {
    expect(createRepositorySyncDisplayRows(IDENTITY, undefined)).toEqual(["Not started"]);
  });

  it("reports Syncing while a read is in flight", () => {
    const snapshot: RepositorySyncSnapshot = { provider: "github", availability: "unknown", syncStatus: "Syncing" };
    expect(createRepositorySyncDisplayRows(IDENTITY, snapshot)).toEqual(["Syncing..."]);
  });

  it("reports branch and short commit sha on a Succeeded snapshot", () => {
    const snapshot: RepositorySyncSnapshot = {
      provider: "github",
      availability: "available",
      defaultBranch: "main",
      latestCommit: { sha: "a1b2c3d4e5f6", message: "Fix bug", committedAt: "2026-01-01T00:00:00.000Z" },
      syncStatus: "Succeeded",
    };
    expect(createRepositorySyncDisplayRows(IDENTITY, snapshot)).toEqual(["Succeeded · main · a1b2c3d"]);
  });

  it("reports a Succeeded snapshot with no branch or commit safely", () => {
    const snapshot: RepositorySyncSnapshot = { provider: "github", availability: "available", syncStatus: "Succeeded" };
    expect(createRepositorySyncDisplayRows(IDENTITY, snapshot)).toEqual(["Succeeded"]);
  });

  it("reports the display-safe reason on a Failed snapshot", () => {
    const snapshot: RepositorySyncSnapshot = {
      provider: "github",
      availability: "unavailable",
      syncStatus: "Failed",
      errorSummary: "Repository synchronization failed.",
    };
    expect(createRepositorySyncDisplayRows(IDENTITY, snapshot)).toEqual(["Failed: Repository synchronization failed."]);
  });

  it("reports the display-safe reason on an Unavailable snapshot", () => {
    const snapshot: RepositorySyncSnapshot = {
      provider: "local",
      availability: "unavailable",
      syncStatus: "Unavailable",
      errorSummary: "Local repository reads need server-side support.",
    };
    expect(createRepositorySyncDisplayRows(IDENTITY, snapshot)).toEqual([
      "Unavailable: Local repository reads need server-side support.",
    ]);
  });
});
