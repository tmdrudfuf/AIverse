import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

const DAILY_PROOF_SUMMARY: GitHubRepositorySummary = {
  owner: "ai-verse",
  name: "daily-proof",
  defaultBranch: "main",
  latestCommit: {
    sha: "abc1234",
    message: "Prepare Daily Proof workspace mock data",
    authorName: "AIverse",
    committedAt: "2026-06-26T18:00:00.000Z",
  },
  openIssueCount: 0,
  openPullRequestCount: 0,
  lastUpdatedAt: "2026-06-26T18:30:00.000Z",
  connectionStatus: "connected",
};

export class MockGitHubRepositoryProvider implements GitHubRepositoryProvider {
  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    if (projectId === "daily-proof") return cloneRepositorySummary(DAILY_PROOF_SUMMARY);

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
  };
}