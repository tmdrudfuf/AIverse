import { describe, expect, it, vi } from "vitest";

import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import { GitHubRepositoryService } from "./GitHubRepositoryService";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

describe("GitHubRepositoryService", () => {
  it("returns provider summaries without adding network, sync, auth, or mutation controls", async () => {
    const fetchSpy = vi.fn();
    const summary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    };
    const provider: GitHubRepositoryProvider = {
      getRepositorySummary: vi.fn(async () => summary),
    };
    const service = new GitHubRepositoryService(provider);

    vi.stubGlobal("fetch", fetchSpy);
    try {
      await expect(service.getRepositorySummary("daily-proof")).resolves.toMatchObject({
        owner: "ai-verse",
        name: "daily-proof",
        connectionStatus: "connected",
      });
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(service)).sort()).toEqual([
      "constructor",
      "getRepositorySummary",
    ]);
  });

  it("maps thrown provider failures into display-safe unavailable summaries", async () => {
    const provider: GitHubRepositoryProvider = {
      getRepositorySummary: vi.fn(async () => {
        throw new Error("token ghp_secret failed against https://api.github.com/repos/private/repo");
      }),
    };
    const service = new GitHubRepositoryService(provider);

    const summary = await service.getRepositorySummary("daily-proof");

    expect(summary).toEqual({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "error",
      errorMessage: "Unable to load repository summary.",
    });
    expect(summary.errorMessage).not.toContain("token");
    expect(summary.errorMessage).not.toContain("github.com");
  });
});
