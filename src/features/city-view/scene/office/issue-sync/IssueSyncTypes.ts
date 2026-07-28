import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import type { RepositorySyncStatus } from "../repository-sync/RepositorySyncTypes";

export type IssueSyncStatus = RepositorySyncStatus;

export type IssueState = "Open" | "Closed";

export type IssueAuthor = {
  login: string;
};

export type IssueSnapshot = {
  id: string;
  number: number;
  title: string;
  bodySummary?: string;
  state: IssueState;
  author?: IssueAuthor;
  assignees: string[];
  labels: string[];
  owner?: string;
  name?: string;
  provider: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  syncedAt: string;
};

export type IssueSnapshotCollection = {
  provider: string;
  owner?: string;
  name?: string;
  syncStatus: IssueSyncStatus;
  issues: IssueSnapshot[];
  openCount: number;
  closedCount: number;
  isTruncated: boolean;
  lastSuccessfulSyncAt?: string;
  errorSummary?: string;
};

export function createNotStartedIssueSnapshotCollection(
  identity: ProjectRegistryRepositoryIdentity,
): IssueSnapshotCollection {
  return {
    provider: identity.provider,
    owner: identity.owner,
    name: identity.name,
    syncStatus: "NotStarted",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
  };
}

export function createSyncingIssueSnapshotCollection(
  identity: ProjectRegistryRepositoryIdentity,
  previous?: IssueSnapshotCollection,
): IssueSnapshotCollection {
  return {
    provider: identity.provider,
    owner: identity.owner,
    name: identity.name,
    syncStatus: "Syncing",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: previous?.lastSuccessfulSyncAt,
  };
}

export function createUnavailableIssueSnapshotCollection(
  identity: ProjectRegistryRepositoryIdentity,
  errorSummary: string,
): IssueSnapshotCollection {
  return {
    provider: identity.provider,
    owner: identity.owner,
    name: identity.name,
    syncStatus: "Unavailable",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    errorSummary,
  };
}

export function createFailedIssueSnapshotCollection(
  identity: ProjectRegistryRepositoryIdentity,
  errorSummary: string,
): IssueSnapshotCollection {
  return {
    provider: identity.provider,
    owner: identity.owner,
    name: identity.name,
    syncStatus: "Failed",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    errorSummary,
  };
}
