import { describe, expect, it, vi } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { IssueSyncProvider } from "./IssueSyncProvider";
import { IssueSyncService } from "./IssueSyncService";
import type { IssueSnapshotCollection } from "./IssueSyncTypes";

const GITHUB_IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

function createProvider(providerId: string, collection: IssueSnapshotCollection): IssueSyncProvider {
  return {
    providerId,
    readIssueSnapshots: vi.fn(async () => collection),
  };
}

function emptyCollection(overrides: Partial<IssueSnapshotCollection> = {}): IssueSnapshotCollection {
  return {
    provider: "github",
    syncStatus: "Succeeded",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    ...overrides,
  };
}

describe("IssueSyncService", () => {
  it("dispatches to the provider registered for the identity's provider", async () => {
    const githubProvider = createProvider("github", emptyCollection({ syncStatus: "Succeeded" }));
    const localProvider = createProvider("local", emptyCollection({ provider: "local", syncStatus: "Unavailable" }));
    const service = new IssueSyncService({ github: githubProvider, local: localProvider });

    const collection = await service.readIssueSnapshots(GITHUB_IDENTITY);

    expect(githubProvider.readIssueSnapshots).toHaveBeenCalledWith(GITHUB_IDENTITY);
    expect(localProvider.readIssueSnapshots).not.toHaveBeenCalled();
    expect(collection.syncStatus).toBe("Succeeded");
  });

  it("falls back to an Unavailable collection when no provider is registered for the identity's provider", async () => {
    const service = new IssueSyncService({});

    const collection = await service.readIssueSnapshots({ provider: "gitlab", connectionState: "Unknown" });

    expect(collection.syncStatus).toBe("Unavailable");
    expect(collection.errorSummary).toContain("gitlab");
  });

  it("catches a thrown provider error and normalizes it to an Unavailable collection", async () => {
    const throwingProvider: IssueSyncProvider = {
      providerId: "github",
      readIssueSnapshots: vi.fn(async () => {
        throw new Error("token ghp_secret leaked in stack trace");
      }),
    };
    const service = new IssueSyncService({ github: throwingProvider });

    const collection = await service.readIssueSnapshots(GITHUB_IDENTITY);

    expect(collection.syncStatus).toBe("Unavailable");
    expect(collection.errorSummary).not.toContain("token");
    expect(collection.errorSummary).not.toContain("ghp_secret");
  });

  it("stamps lastSuccessfulSyncAt with the current time only when the result Succeeded", async () => {
    const service = new IssueSyncService({ github: createProvider("github", emptyCollection()) });

    const before = Date.now();
    const collection = await service.readIssueSnapshots(GITHUB_IDENTITY);
    const after = Date.now();

    expect(collection.lastSuccessfulSyncAt).toBeDefined();
    const stamped = new Date(collection.lastSuccessfulSyncAt!).getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);
  });

  it("carries the previous lastSuccessfulSyncAt forward when the result did not Succeed", async () => {
    const failed = emptyCollection({ syncStatus: "Failed", errorSummary: "boom" });
    const service = new IssueSyncService({ github: createProvider("github", failed) });
    const previous = emptyCollection({ syncStatus: "Succeeded", lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z" });

    const collection = await service.readIssueSnapshots(GITHUB_IDENTITY, previous);

    expect(collection.syncStatus).toBe("Failed");
    expect(collection.lastSuccessfulSyncAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
