import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";

export type RepositorySyncStatus = "NotStarted" | "Syncing" | "Succeeded" | "Failed" | "Unavailable";

export type RepositorySyncAvailability = "available" | "unavailable" | "unknown";

export type RepositorySyncLatestCommit = {
  sha: string;
  message: string;
  committedAt: string;
};

export type RepositorySyncWorkingTreeState = "clean" | "dirty";

export type RepositorySyncSnapshot = {
  provider: string;
  availability: RepositorySyncAvailability;
  owner?: string;
  name?: string;
  defaultBranch?: string;
  currentBranch?: string;
  latestCommit?: RepositorySyncLatestCommit;
  workingTreeState?: RepositorySyncWorkingTreeState;
  syncStatus: RepositorySyncStatus;
  lastSuccessfulSyncAt?: string;
  errorSummary?: string;
};

export function createNotStartedRepositorySyncSnapshot(
  identity: ProjectRegistryRepositoryIdentity,
): RepositorySyncSnapshot {
  return {
    provider: identity.provider,
    availability: "unknown",
    owner: identity.owner,
    name: identity.name,
    defaultBranch: identity.defaultBranch,
    syncStatus: "NotStarted",
  };
}

export function createSyncingRepositorySyncSnapshot(
  identity: ProjectRegistryRepositoryIdentity,
  previous?: RepositorySyncSnapshot,
): RepositorySyncSnapshot {
  return {
    provider: identity.provider,
    availability: "unknown",
    owner: identity.owner,
    name: identity.name,
    defaultBranch: identity.defaultBranch,
    syncStatus: "Syncing",
    lastSuccessfulSyncAt: previous?.lastSuccessfulSyncAt,
  };
}

export function createUnavailableRepositorySyncSnapshot(
  identity: ProjectRegistryRepositoryIdentity,
  errorSummary: string,
): RepositorySyncSnapshot {
  return {
    provider: identity.provider,
    availability: "unavailable",
    owner: identity.owner,
    name: identity.name,
    defaultBranch: identity.defaultBranch,
    syncStatus: "Unavailable",
    errorSummary,
  };
}
