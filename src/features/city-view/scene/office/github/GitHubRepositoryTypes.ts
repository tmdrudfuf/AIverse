export type GitHubRepositoryConnectionStatus = "not_connected" | "loading" | "connected" | "error";

export type GitHubLatestCommit = {
  sha: string;
  message: string;
  authorName: string;
  committedAt: string;
};

export type GitHubRepositorySummary = {
  owner: string;
  name: string;
  defaultBranch: string;
  latestCommit?: GitHubLatestCommit;
  openIssueCount: number;
  openPullRequestCount: number;
  lastUpdatedAt?: string;
  connectionStatus: GitHubRepositoryConnectionStatus;
  errorMessage?: string;
};