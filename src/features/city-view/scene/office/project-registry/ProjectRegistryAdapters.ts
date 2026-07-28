import type { AIverseProjectRepositoryMapping } from "../github/GitHubRepositoryTypes";
import type { ProjectPortalNextAction, ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectRegistryEntry } from "./ProjectRegistryTypes";

export function toProjectPortalProject(
  entry: ProjectRegistryEntry,
  linkedServices: ProjectPortalProject["linkedServices"],
): ProjectPortalProject {
  return {
    id: entry.id,
    name: entry.displayName,
    status: entry.lifecycleStatus,
    type: entry.projectType,
    enabled: entry.lifecycleStatus === "Active",
    description: entry.shortDescription,
    linkedServices,
    nextAction: createNextAction(entry),
    ownerCompany: entry.owner.companyName,
    localRepositoryLabel: entry.localRepository.label,
    repositoryIdentity: { ...entry.repositoryIdentity },
  };
}

export function toRepositoryMapping(entry: ProjectRegistryEntry): AIverseProjectRepositoryMapping | undefined {
  if (!entry.remoteRepository) return undefined;

  return {
    projectId: entry.id,
    sourceId: `github:${entry.remoteRepository.owner}/${entry.remoteRepository.name}`,
    repository: { ...entry.remoteRepository },
    enabled: true,
    createdAt: entry.createdAt,
  };
}

function createNextAction(entry: ProjectRegistryEntry): ProjectPortalNextAction {
  if (entry.lifecycleStatus === "Active") {
    return {
      label: "Review project workspace",
      enabled: true,
      placeholder: true,
    };
  }

  return {
    label: "Coming soon",
    enabled: false,
    placeholder: true,
  };
}
