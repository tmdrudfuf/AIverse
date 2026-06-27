import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

export interface GitHubRepositoryProvider {
  getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>;
}