import type { GitHubRepositoryRefresher } from "./CachedGitHubRepositoryProvider";
import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

const UNAVAILABLE_SUMMARY: GitHubRepositorySummary = {
  owner: "",
  name: "",
  defaultBranch: "",
  openIssueCount: 0,
  openPullRequestCount: 0,
  connectionStatus: "error",
  errorMessage: "Unable to load repository summary.",
};

export class GitHubRepositoryService {
  constructor(private readonly provider: GitHubRepositoryProvider & Partial<GitHubRepositoryRefresher>) {}

  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    try {
      return await this.provider.getRepositorySummary(projectId);
    } catch (error) {
      return { ...UNAVAILABLE_SUMMARY };
    }
  }

  async refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    try {
      if (this.provider.refreshRepositorySummary) {
        return await this.provider.refreshRepositorySummary(projectId);
      }
      return await this.provider.getRepositorySummary(projectId);
    } catch (error) {
      return { ...UNAVAILABLE_SUMMARY };
    }
  }
}
