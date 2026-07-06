import { describe, expect, it, vi } from "vitest";

import { MockGitHubRepositoryProvider } from "./MockGitHubRepositoryProvider";
import { GITHUB_PUBLIC_READ_SUMMARY_FIELDS } from "./GitHubRepositoryTypes";

describe("MockGitHubRepositoryProvider", () => {
  it("returns deterministic rich fixture summaries for Daily Proof", async () => {
    const provider = new MockGitHubRepositoryProvider();

    const first = await provider.getRepositorySummary("daily-proof");
    const second = await provider.getRepositorySummary("daily-proof");

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 4,
      openPullRequestCount: 2,
      connectionStatus: "connected",
      checkStatus: {
        state: "passing",
        label: "CI passing",
        source: "local fixture checks",
      },
      sourceStatus: {
        state: "fresh",
        label: "Fresh",
        reason: "Local fixture repository data is current.",
      },
    });
    expect(first.latestCommit).toMatchObject({
      sha: "dp7f3a2",
      message: "Stabilize office dashboard repository fixture flow",
      authorName: "AIverse Bot",
    });
  });

  it("returns stale and failing-check fixture scenarios", async () => {
    const provider = new MockGitHubRepositoryProvider();

    await expect(provider.getRepositorySummary("daily-proof-stale")).resolves.toMatchObject({
      name: "daily-proof-stale",
      openIssueCount: 7,
      openPullRequestCount: 1,
      checkStatus: {
        state: "pending",
        label: "Checks pending",
      },
      sourceStatus: {
        state: "stale",
        label: "Stale",
      },
    });
    await expect(provider.getRepositorySummary("daily-proof-failing")).resolves.toMatchObject({
      name: "daily-proof-failing",
      defaultBranch: "release/checks",
      openIssueCount: 3,
      openPullRequestCount: 3,
      checkStatus: {
        state: "failing",
        label: "2 checks failing",
      },
      sourceStatus: {
        state: "fresh",
        label: "Fresh",
      },
    });
  });

  it("returns explicit unavailable summaries for unknown fixture projects", async () => {
    const provider = new MockGitHubRepositoryProvider();

    await expect(provider.getRepositorySummary("missing-project")).resolves.toEqual({
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "not_connected",
      errorMessage: "Repository data is not configured for this project.",
    });
  });

  it("clones fixture records so callers cannot mutate later reads", async () => {
    const provider = new MockGitHubRepositoryProvider();
    const summary = await provider.getRepositorySummary("daily-proof");

    summary.latestCommit!.message = "mutated";
    summary.checkStatus!.label = "mutated";
    summary.sourceStatus!.reason = "mutated";

    await expect(provider.getRepositorySummary("daily-proof")).resolves.toMatchObject({
      latestCommit: {
        message: "Stabilize office dashboard repository fixture flow",
      },
      checkStatus: {
        label: "CI passing",
      },
      sourceStatus: {
        reason: "Local fixture repository data is current.",
      },
    });
  });

  it("uses only local fixture data without calling external network primitives", async () => {
    const provider = new MockGitHubRepositoryProvider();
    const fetchSpy = vi.fn();

    vi.stubGlobal("fetch", fetchSpy);
    try {
      await provider.getRepositorySummary("daily-proof");
      await provider.getRepositorySummary("daily-proof-stale");
      await provider.getRepositorySummary("daily-proof-failing");
      await provider.getRepositorySummary("missing-project");
    } finally {
      vi.unstubAllGlobals();
    }

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns summaries that stay within the approved public read boundary", async () => {
    const provider = new MockGitHubRepositoryProvider();
    const summaries = await Promise.all([
      provider.getRepositorySummary("daily-proof"),
      provider.getRepositorySummary("daily-proof-stale"),
      provider.getRepositorySummary("daily-proof-failing"),
      provider.getRepositorySummary("missing-project"),
    ]);

    summaries.forEach((summary) => {
      expect(Object.keys(summary).every((key) => GITHUB_PUBLIC_READ_SUMMARY_FIELDS.includes(
        key as (typeof GITHUB_PUBLIC_READ_SUMMARY_FIELDS)[number],
      ))).toBe(true);
    });
  });
});
