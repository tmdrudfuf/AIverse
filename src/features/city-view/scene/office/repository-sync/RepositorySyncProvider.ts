import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncSnapshot } from "./RepositorySyncTypes";

export type RepositorySyncReadContext = {
  projectId: string;
};

export type RepositorySyncProvider = {
  readonly providerId: string;
  readRepositorySnapshot(
    identity: ProjectRegistryRepositoryIdentity,
    context: RepositorySyncReadContext,
  ): Promise<RepositorySyncSnapshot>;
};
