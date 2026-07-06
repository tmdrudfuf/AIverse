import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";
import { createGitHubExternalSourceStatus } from "./GitHubRepositoryTypes";

const REPOSITORY_FIXTURES: Record<string, GitHubRepositorySummary> = {
  "daily-proof": {
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    latestCommit: {
      sha: "dp7f3a2",
      message: "Stabilize office dashboard repository fixture flow",
      authorName: "AIverse Bot",
      committedAt: "2026-06-26T18:00:00.000Z",
    },
    openIssueCount: 4,
    openPullRequestCount: 2,
    checkStatus: {
      state: "passing",
      label: "CI passing",
      checkedAt: "2026-06-26T18:24:00.000Z",
      source: "local fixture checks",
    },
    sourceStatus: createGitHubExternalSourceStatus("fresh", {
      reason: "Local fixture repository data is current.",
      lastSuccessfulFetchAt: "2026-06-26T18:30:00.000Z",
    }),
    lastUpdatedAt: "2026-06-26T18:30:00.000Z",
    connectionStatus: "connected",
  },
  "daily-proof-stale": {
    owner: "ai-verse",
    name: "daily-proof-stale",
    defaultBranch: "main",
    latestCommit: {
      sha: "st4le91",
      message: "Cache repository source before offline review",
      authorName: "AIverse Bot",
      committedAt: "2026-06-20T09:15:00.000Z",
    },
    openIssueCount: 7,
    openPullRequestCount: 1,
    checkStatus: {
      state: "pending",
      label: "Checks pending",
      checkedAt: "2026-06-20T09:20:00.000Z",
      source: "local fixture checks",
    },
    sourceStatus: createGitHubExternalSourceStatus("stale", {
      reason: "Local fixture repository data is older than the expected freshness window.",
      lastSuccessfulFetchAt: "2026-06-20T09:30:00.000Z",
    }),
    lastUpdatedAt: "2026-06-20T09:30:00.000Z",
    connectionStatus: "connected",
  },
  "daily-proof-failing": {
    owner: "ai-verse",
    name: "daily-proof-failing",
    defaultBranch: "release/checks",
    latestCommit: {
      sha: "f41l8d2",
      message: "Expose failing build fixture for dashboard review",
      authorName: "AIverse QA",
      committedAt: "2026-06-25T14:40:00.000Z",
    },
    openIssueCount: 3,
    openPullRequestCount: 3,
    checkStatus: {
      state: "failing",
      label: "2 checks failing",
      checkedAt: "2026-06-25T15:00:00.000Z",
      source: "local fixture checks",
    },
    sourceStatus: createGitHubExternalSourceStatus("fresh", {
      reason: "Local fixture repository data is current, but checks are failing.",
      lastSuccessfulFetchAt: "2026-06-25T15:05:00.000Z",
    }),
    lastUpdatedAt: "2026-06-25T15:05:00.000Z",
    connectionStatus: "connected",
  },
};

export class MockGitHubRepositoryProvider implements GitHubRepositoryProvider {
  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    const fixture = REPOSITORY_FIXTURES[projectId];
    if (fixture) return cloneRepositorySummary(fixture);

    return {
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "not_connected",
      errorMessage: "Repository data is not configured for this project.",
    };
  }
}

function cloneRepositorySummary(summary: GitHubRepositorySummary): GitHubRepositorySummary {
  return {
    ...summary,
    latestCommit: summary.latestCommit ? { ...summary.latestCommit } : undefined,
    checkStatus: summary.checkStatus ? { ...summary.checkStatus } : undefined,
    sourceStatus: summary.sourceStatus ? { ...summary.sourceStatus } : undefined,
  };
}
