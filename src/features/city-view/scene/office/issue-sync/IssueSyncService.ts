import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { IssueSyncProvider } from "./IssueSyncProvider";
import { createUnavailableIssueSnapshotCollection, type IssueSnapshotCollection } from "./IssueSyncTypes";

export class IssueSyncService {
  constructor(private readonly providers: Partial<Record<string, IssueSyncProvider>>) {}

  async readIssueSnapshots(
    identity: ProjectRegistryRepositoryIdentity,
    previous?: IssueSnapshotCollection,
  ): Promise<IssueSnapshotCollection> {
    const collection = await this.readFromRegisteredProvider(identity);

    return {
      ...collection,
      lastSuccessfulSyncAt:
        collection.syncStatus === "Succeeded" ? new Date().toISOString() : previous?.lastSuccessfulSyncAt,
    };
  }

  private async readFromRegisteredProvider(
    identity: ProjectRegistryRepositoryIdentity,
  ): Promise<IssueSnapshotCollection> {
    const provider = this.providers[identity.provider];
    if (!provider) {
      return createUnavailableIssueSnapshotCollection(
        identity,
        `No issue synchronization provider is registered for "${identity.provider}".`,
      );
    }

    try {
      return await provider.readIssueSnapshots(identity);
    } catch {
      return createUnavailableIssueSnapshotCollection(identity, "Issue synchronization failed unexpectedly.");
    }
  }
}
