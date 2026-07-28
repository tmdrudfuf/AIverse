import type { GitHubRepositoryReference } from "../github/GitHubRepositoryTypes";
import type { ProjectPortalProjectStatus, ProjectPortalProjectType } from "../OfficeProjectPortalTypes";

export type ProjectRegistryLocalRepositoryIdentity = {
  connected: boolean;
  label: string;
};

export type ProjectRegistryOwner = {
  companyName: string;
};

export type ProjectRegistryEntry = {
  id: string;
  displayName: string;
  shortDescription: string;
  lifecycleStatus: ProjectPortalProjectStatus;
  projectType: ProjectPortalProjectType;
  localRepository: ProjectRegistryLocalRepositoryIdentity;
  remoteRepository?: GitHubRepositoryReference;
  owner: ProjectRegistryOwner;
  createdAt: string;
  lastActivityAt: string;
};
