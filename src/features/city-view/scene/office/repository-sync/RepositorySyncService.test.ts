import { describe, expect, it, vi } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncProvider } from "./RepositorySyncProvider";
import { RepositorySyncService } from "./RepositorySyncService";
import type { RepositorySyncSnapshot } from "./RepositorySyncTypes";

const GITHUB_IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

function createProvider(providerId: string, snapshot: RepositorySyncSnapshot): RepositorySyncProvider {
  return {
    providerId,
    readRepositorySnapshot: vi.fn(async () => snapshot),
  };
}

describe("RepositorySyncService", () => {
  it("dispatches to the provider registered for the identity's provider", async () => {
    const succeeded: RepositorySyncSnapshot = { provider: "github", availability: "available", syncStatus: "Succeeded" };
    const githubProvider = createProvider("github", succeeded);
    const localProvider = createProvider("local", { provider: "local", availability: "unavailable", syncStatus: "Unavailable" });
    const service = new RepositorySyncService({ github: githubProvider, local: localProvider });

    const snapshot = await service.readRepositorySnapshot(GITHUB_IDENTITY, { projectId: "daily-proof" });

    expect(githubProvider.readRepositorySnapshot).toHaveBeenCalledWith(GITHUB_IDENTITY, { projectId: "daily-proof" });
    expect(localProvider.readRepositorySnapshot).not.toHaveBeenCalled();
    expect(snapshot.syncStatus).toBe("Succeeded");
  });

  it("falls back to an Unavailable snapshot when no provider is registered for the identity's provider", async () => {
    const service = new RepositorySyncService({});

    const snapshot = await service.readRepositorySnapshot(
      { provider: "gitlab", connectionState: "Unknown" },
      { projectId: "some-project" },
    );

    expect(snapshot.syncStatus).toBe("Unavailable");
    expect(snapshot.errorSummary).toContain("gitlab");
  });

  it("catches a thrown provider error and normalizes it to an Unavailable snapshot", async () => {
    const throwingProvider: RepositorySyncProvider = {
      providerId: "github",
      readRepositorySnapshot: vi.fn(async () => {
        throw new Error("token ghp_secret leaked in stack trace");
      }),
    };
    const service = new RepositorySyncService({ github: throwingProvider });

    const snapshot = await service.readRepositorySnapshot(GITHUB_IDENTITY, { projectId: "daily-proof" });

    expect(snapshot.syncStatus).toBe("Unavailable");
    expect(snapshot.errorSummary).not.toContain("token");
    expect(snapshot.errorSummary).not.toContain("ghp_secret");
  });

  it("stamps lastSuccessfulSyncAt with the current time only when the result Succeeded", async () => {
    const succeeded: RepositorySyncSnapshot = { provider: "github", availability: "available", syncStatus: "Succeeded" };
    const service = new RepositorySyncService({ github: createProvider("github", succeeded) });

    const before = Date.now();
    const snapshot = await service.readRepositorySnapshot(GITHUB_IDENTITY, { projectId: "daily-proof" });
    const after = Date.now();

    expect(snapshot.lastSuccessfulSyncAt).toBeDefined();
    const stamped = new Date(snapshot.lastSuccessfulSyncAt!).getTime();
    expect(stamped).toBeGreaterThanOrEqual(before);
    expect(stamped).toBeLessThanOrEqual(after);
  });

  it("carries the previous lastSuccessfulSyncAt forward when the result did not Succeed", async () => {
    const failed: RepositorySyncSnapshot = { provider: "github", availability: "unavailable", syncStatus: "Failed", errorSummary: "boom" };
    const service = new RepositorySyncService({ github: createProvider("github", failed) });
    const previous: RepositorySyncSnapshot = {
      provider: "github",
      availability: "available",
      syncStatus: "Succeeded",
      lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
    };

    const snapshot = await service.readRepositorySnapshot(GITHUB_IDENTITY, { projectId: "daily-proof" }, previous);

    expect(snapshot.syncStatus).toBe("Failed");
    expect(snapshot.lastSuccessfulSyncAt).toBe("2026-01-01T00:00:00.000Z");
  });
});
