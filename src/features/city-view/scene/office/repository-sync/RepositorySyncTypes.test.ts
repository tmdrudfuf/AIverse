import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import {
  createNotStartedRepositorySyncSnapshot,
  createSyncingRepositorySyncSnapshot,
  createUnavailableRepositorySyncSnapshot,
} from "./RepositorySyncTypes";

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

describe("createNotStartedRepositorySyncSnapshot", () => {
  it("carries identity fields and reports NotStarted/unknown availability", () => {
    expect(createNotStartedRepositorySyncSnapshot(GITHUB_IDENTITY)).toEqual({
      provider: "github",
      availability: "unknown",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      syncStatus: "NotStarted",
    });
  });

  it("degrades safely for a sparse identity with no owner/name/branch", () => {
    expect(createNotStartedRepositorySyncSnapshot(LOCAL_IDENTITY)).toEqual({
      provider: "local",
      availability: "unknown",
      owner: undefined,
      name: undefined,
      defaultBranch: undefined,
      syncStatus: "NotStarted",
    });
  });
});

describe("createSyncingRepositorySyncSnapshot", () => {
  it("reports Syncing/unknown availability with no previous snapshot", () => {
    expect(createSyncingRepositorySyncSnapshot(GITHUB_IDENTITY)).toMatchObject({
      syncStatus: "Syncing",
      availability: "unknown",
      lastSuccessfulSyncAt: undefined,
    });
  });

  it("carries the previous snapshot's lastSuccessfulSyncAt forward", () => {
    const previous = createUnavailableRepositorySyncSnapshot(GITHUB_IDENTITY, "unused");
    previous.lastSuccessfulSyncAt = "2026-01-01T00:00:00.000Z";

    const syncing = createSyncingRepositorySyncSnapshot(GITHUB_IDENTITY, previous);

    expect(syncing.lastSuccessfulSyncAt).toBe("2026-01-01T00:00:00.000Z");
  });
});

describe("createUnavailableRepositorySyncSnapshot", () => {
  it("reports Unavailable/unavailable availability with the given display-safe reason", () => {
    expect(createUnavailableRepositorySyncSnapshot(LOCAL_IDENTITY, "No provider is registered.")).toEqual({
      provider: "local",
      availability: "unavailable",
      owner: undefined,
      name: undefined,
      defaultBranch: undefined,
      syncStatus: "Unavailable",
      errorSummary: "No provider is registered.",
    });
  });
});
