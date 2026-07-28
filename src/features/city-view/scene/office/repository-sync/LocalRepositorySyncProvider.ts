import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncReadContext, RepositorySyncProvider } from "./RepositorySyncProvider";
import { createUnavailableRepositorySyncSnapshot, type RepositorySyncSnapshot } from "./RepositorySyncTypes";

const LOCAL_REPOSITORY_UNAVAILABLE_REASON = "Local repository reads need server-side support.";

export class LocalRepositorySyncProvider implements RepositorySyncProvider {
  readonly providerId = "local";

  async readRepositorySnapshot(
    identity: ProjectRegistryRepositoryIdentity,
    _context: RepositorySyncReadContext,
  ): Promise<RepositorySyncSnapshot> {
    return createUnavailableRepositorySyncSnapshot(identity, LOCAL_REPOSITORY_UNAVAILABLE_REASON);
  }
}
