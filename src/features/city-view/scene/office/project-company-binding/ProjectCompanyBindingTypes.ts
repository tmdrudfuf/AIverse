import type { NormalizedLocalProjectRepositoryBinding, ProjectRegistryEntry, ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";

export type ProjectCompanyBindingStatus = "bound" | "unavailable";

export type ProjectCompanyBindingUnavailableReason =
  | "MissingProject"
  | "MissingLocalPath";

export type ProjectCompanyBinding = {
  bindingId: string;
  buildingId: string;
  projectId: string;
  companyName: string;
  status: ProjectCompanyBindingStatus;
  unavailableReason?: ProjectCompanyBindingUnavailableReason;
};

export type ActiveProjectCompanyContext = {
  binding: ProjectCompanyBinding;
  projectId: string;
  project?: ProjectRegistryEntry;
  displayName: string;
  companyName: string;
  localRepositoryBinding?: NormalizedLocalProjectRepositoryBinding;
  repositoryIdentity?: ProjectRegistryRepositoryIdentity;
  status: ProjectCompanyBindingStatus;
  unavailableReason?: ProjectCompanyBindingUnavailableReason;
};
