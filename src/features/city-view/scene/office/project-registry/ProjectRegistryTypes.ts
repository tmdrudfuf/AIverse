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

export type LocalProjectRepositoryBinding = {
  projectId: string;
  repositoryPath?: string;
  worktreePath?: string;
  branchName?: string;
  specPath?: string;
  source?: string;
  boundAt?: string;
};

export type NormalizedLocalProjectRepositoryBinding = {
  projectId: string;
  repositoryPath: string;
  worktreePath: string;
  branchName?: string;
  specPath?: string;
  source?: string;
  boundAt?: string;
};

export type LocalProjectRepositoryBindingRejectionReason = "UnknownProject" | "MissingLocalPath";

export type LocalProjectRepositoryBindingResult =
  | {
      projectId: string;
      status: "Bound";
      binding: NormalizedLocalProjectRepositoryBinding;
    }
  | {
      projectId: string;
      status: "Rejected";
      reason: LocalProjectRepositoryBindingRejectionReason;
    };

export type LocalProjectRepositoryBindingApplication = {
  entries: ProjectRegistryEntry[];
  results: LocalProjectRepositoryBindingResult[];
};

export type ProjectRegistryEntry = {
  id: string;
  displayName: string;
  shortDescription: string;
  lifecycleStatus: ProjectPortalProjectStatus;
  projectType: ProjectPortalProjectType;
  localRepository: ProjectRegistryLocalRepositoryIdentity;
  localRepositoryBinding?: NormalizedLocalProjectRepositoryBinding;
  remoteRepository?: GitHubRepositoryReference;
  repositoryIdentity: ProjectRegistryRepositoryIdentity;
  owner: ProjectRegistryOwner;
  createdAt: string;
  lastActivityAt: string;
};
