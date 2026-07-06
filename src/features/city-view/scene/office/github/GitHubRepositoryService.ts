import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

export class GitHubRepositoryService {
  constructor(private readonly provider: GitHubRepositoryProvider) {}

  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    try {
      return await this.provider.getRepositorySummary(projectId);
    } catch (error) {
      return {
        owner: "",
        name: "",
        defaultBranch: "",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "error",
        errorMessage: "Unable to load repository summary.",
      };
    }
  }
}
