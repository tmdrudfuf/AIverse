import type { GitHubRepositoryReference } from "../github/GitHubRepositoryTypes";
import type { ProjectPortalProjectStatus, ProjectPortalProjectType } from "../OfficeProjectPortalTypes";

export type ProjectRegistryLocalRepositoryIdentity = {
  connected: boolean;
  label: string;
};

export type ProjectRegistryOwner = {
  companyName: string;
};

export type ProjectRegistryRepositoryProvider = "local" | "github" | (string & {});

export type ProjectRegistryRepositoryConnectionState = "Configured" | "Available" | "Unavailable" | "Unknown";

export type ProjectRegistryRepositoryIdentity = {
  provider: ProjectRegistryRepositoryProvider;
  owner?: string;
  name?: string;
  defaultBranch?: string;
  url?: string;
  localPath?: string;
  connectionState: ProjectRegistryRepositoryConnectionState;
  lastVerifiedAt?: string;
};

export type ProjectRegistryEntry = {
  id: string;
  displayName: string;
  shortDescription: string;
  lifecycleStatus: ProjectPortalProjectStatus;
  projectType: ProjectPortalProjectType;
  localRepository: ProjectRegistryLocalRepositoryIdentity;
  remoteRepository?: GitHubRepositoryReference;
  repositoryIdentity: ProjectRegistryRepositoryIdentity;
  owner: ProjectRegistryOwner;
  createdAt: string;
  lastActivityAt: string;
};
