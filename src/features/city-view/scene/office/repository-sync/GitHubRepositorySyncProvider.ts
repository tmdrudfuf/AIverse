import type { GitHubRepositoryService } from "../github/GitHubRepositoryService";
import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncReadContext, RepositorySyncProvider } from "./RepositorySyncProvider";
import type { RepositorySyncSnapshot } from "./RepositorySyncTypes";

export class GitHubRepositorySyncProvider implements RepositorySyncProvider {
  readonly providerId = "github";

  constructor(private readonly repositoryService: GitHubRepositoryService) {}

  async readRepositorySnapshot(
    identity: ProjectRegistryRepositoryIdentity,
    context: RepositorySyncReadContext,
  ): Promise<RepositorySyncSnapshot> {
    const summary = await this.repositoryService.getRepositorySummary(context.projectId);
    const owner = summary.owner || identity.owner;
    const name = summary.name || identity.name;
    const defaultBranch = summary.defaultBranch || identity.defaultBranch;

    if (summary.connectionStatus === "connected") {
      return {
        provider: identity.provider,
        availability: "available",
        owner,
        name,
        defaultBranch,
        latestCommit: summary.latestCommit
          ? {
              sha: summary.latestCommit.sha,
              message: summary.latestCommit.message,
              committedAt: summary.latestCommit.committedAt,
            }
          : undefined,
        syncStatus: "Succeeded",
      };
    }

    if (summary.connectionStatus === "loading") {
      return {
        provider: identity.provider,
        availability: "unknown",
        owner,
        name,
        defaultBranch,
        syncStatus: "Syncing",
      };
    }

    if (summary.connectionStatus === "not_connected") {
      return {
        provider: identity.provider,
        availability: "unavailable",
        owner,
        name,
        defaultBranch,
        syncStatus: "Unavailable",
        errorSummary: summary.errorMessage ?? "No repository mapping is configured for this project.",
      };
    }

    return {
      provider: identity.provider,
      availability: "unavailable",
      owner,
      name,
      defaultBranch,
      syncStatus: "Failed",
      errorSummary: summary.errorMessage ?? "Repository synchronization failed.",
    };
  }
}
