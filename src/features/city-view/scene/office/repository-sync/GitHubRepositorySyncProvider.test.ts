import { describe, expect, it, vi } from "vitest";

import type { GitHubRepositoryProvider } from "../github/GitHubRepositoryProvider";
import { GitHubRepositoryService } from "../github/GitHubRepositoryService";
import type { GitHubRepositorySummary } from "../github/GitHubRepositoryTypes";
import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { GitHubRepositorySyncProvider } from "./GitHubRepositorySyncProvider";

const IDENTITY: ProjectRegistryRepositoryIdentity = {
  provider: "github",
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  connectionState: "Configured",
};

function createSyncProvider(summary: GitHubRepositorySummary) {
  const provider: GitHubRepositoryProvider = {
    getRepositorySummary: vi.fn(async () => summary),
  };
  const service = new GitHubRepositoryService(provider);
  return new GitHubRepositorySyncProvider(service);
}

describe("GitHubRepositorySyncProvider", () => {
  it("maps a connected summary to a Succeeded, available snapshot", async () => {
    const syncProvider = createSyncProvider({
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      latestCommit: { sha: "a1b2c3d4e5f6", message: "Fix bug", authorName: "octocat", committedAt: "2026-01-01T00:00:00.000Z" },
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    });

    const snapshot = await syncProvider.readRepositorySnapshot(IDENTITY, { projectId: "daily-proof" });

    expect(snapshot).toEqual({
      provider: "github",
      availability: "available",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      latestCommit: { sha: "a1b2c3d4e5f6", message: "Fix bug", committedAt: "2026-01-01T00:00:00.000Z" },
      syncStatus: "Succeeded",
    });
  });

  it("maps a loading summary to a Syncing, unknown-availability snapshot", async () => {
    const syncProvider = createSyncProvider({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "loading",
    });

    const snapshot = await syncProvider.readRepositorySnapshot(IDENTITY, { projectId: "daily-proof" });

    expect(snapshot.syncStatus).toBe("Syncing");
    expect(snapshot.availability).toBe("unknown");
  });

  it("maps a not_connected summary to an Unavailable snapshot with a display-safe reason", async () => {
    const syncProvider = createSyncProvider({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "not_connected",
    });

    const snapshot = await syncProvider.readRepositorySnapshot(IDENTITY, { projectId: "daily-proof" });

    expect(snapshot.syncStatus).toBe("Unavailable");
    expect(snapshot.errorSummary).toBe("No repository mapping is configured for this project.");
  });

  it("maps an error summary to a Failed snapshot with a display-safe reason", async () => {
    const syncProvider = createSyncProvider({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "error",
      errorMessage: "Unable to load repository summary.",
    });

    const snapshot = await syncProvider.readRepositorySnapshot(IDENTITY, { projectId: "daily-proof" });

    expect(snapshot.syncStatus).toBe("Failed");
    expect(snapshot.errorSummary).toBe("Unable to load repository summary.");
  });

  it("falls back to the repository identity's owner/name/defaultBranch when the summary omits them", async () => {
    const syncProvider = createSyncProvider({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    });

    const snapshot = await syncProvider.readRepositorySnapshot(IDENTITY, { projectId: "daily-proof" });

    expect(snapshot.owner).toBe("ai-verse");
    expect(snapshot.name).toBe("daily-proof");
    expect(snapshot.defaultBranch).toBe("main");
  });
});
