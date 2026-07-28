import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncReadContext, RepositorySyncProvider } from "./RepositorySyncProvider";
import { createUnavailableRepositorySyncSnapshot, type RepositorySyncSnapshot } from "./RepositorySyncTypes";

export class RepositorySyncService {
  constructor(private readonly providers: Partial<Record<string, RepositorySyncProvider>>) {}

  async readRepositorySnapshot(
    identity: ProjectRegistryRepositoryIdentity,
    context: RepositorySyncReadContext,
    previous?: RepositorySyncSnapshot,
  ): Promise<RepositorySyncSnapshot> {
    const snapshot = await this.readFromRegisteredProvider(identity, context);

    return {
      ...snapshot,
      lastSuccessfulSyncAt:
        snapshot.syncStatus === "Succeeded" ? new Date().toISOString() : previous?.lastSuccessfulSyncAt,
    };
  }

  private async readFromRegisteredProvider(
    identity: ProjectRegistryRepositoryIdentity,
    context: RepositorySyncReadContext,
  ): Promise<RepositorySyncSnapshot> {
    const provider = this.providers[identity.provider];
    if (!provider) {
      return createUnavailableRepositorySyncSnapshot(
        identity,
        `No repository synchronization provider is registered for "${identity.provider}".`,
      );
    }

    try {
      return await provider.readRepositorySnapshot(identity, context);
    } catch {
      return createUnavailableRepositorySyncSnapshot(identity, "Repository synchronization failed unexpectedly.");
    }
  }
}
