import type { CityBuildingDefinition } from "../../buildings/buildingTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import type { ActiveProjectCompanyContext, ProjectCompanyBinding } from "./ProjectCompanyBindingTypes";

export class ProjectCompanyBindingService {
  createBindings(
    buildings: ReadonlyArray<CityBuildingDefinition>,
    projects: ReadonlyArray<ProjectRegistryEntry>,
  ): ProjectCompanyBinding[] {
    const buildingBindings = buildings
      .filter((building) => building.projectBinding)
      .map((building) => this.resolveBuildingBinding(building, projects).binding);
    const boundProjectIds = new Set(buildingBindings.map((binding) => binding.projectId));
    const registeredProjectBindings = projects
      .filter((project) => !boundProjectIds.has(project.id))
      .map((project) => this.resolveProjectBinding({
        bindingId: `project:${project.id}`,
        buildingId: `project:${project.id}`,
        projectId: project.id,
        fallbackCompanyName: project.owner.companyName || project.displayName,
        projects,
      }).binding);

    return [...buildingBindings, ...registeredProjectBindings];
  }

  resolveBuildingBinding(
    building: Pick<CityBuildingDefinition, "id" | "name" | "projectBinding">,
    projects: ReadonlyArray<ProjectRegistryEntry>,
  ): ActiveProjectCompanyContext {
    const projectId = building.projectBinding?.projectId;
    const bindingId = building.projectBinding?.bindingId ?? building.id;
    if (!projectId) {
      return createUnavailableContext({
        bindingId,
        buildingId: building.id,
        projectId: building.id,
        companyName: building.name,
        reason: "MissingProject",
      });
    }

    return this.resolveProjectBinding({
      bindingId,
      buildingId: building.id,
      projectId,
      fallbackCompanyName: building.name,
      projects,
    });
  }

  resolveProjectBinding(input: {
    bindingId: string;
    buildingId: string;
    projectId: string;
    fallbackCompanyName: string;
    projects: ReadonlyArray<ProjectRegistryEntry>;
  }): ActiveProjectCompanyContext {
    const project = input.projects.find((entry) => entry.id === input.projectId);
    if (!project) {
      return createUnavailableContext({
        bindingId: input.bindingId,
        buildingId: input.buildingId,
        projectId: input.projectId,
        companyName: input.fallbackCompanyName,
        reason: "MissingProject",
      });
    }

    const missingLocalPath = project.localRepository.connected && !project.localRepositoryBinding && !project.repositoryIdentity.localPath;
    const companyName = project.owner.companyName || project.displayName || input.fallbackCompanyName;
    const binding: ProjectCompanyBinding = {
      bindingId: input.bindingId,
      buildingId: input.buildingId,
      projectId: project.id,
      companyName,
      status: missingLocalPath ? "unavailable" : "bound",
      ...(missingLocalPath ? { unavailableReason: "MissingLocalPath" as const } : {}),
    };

    return {
      binding,
      projectId: project.id,
      project: cloneProject(project),
      displayName: project.displayName,
      companyName,
      localRepositoryBinding: project.localRepositoryBinding ? { ...project.localRepositoryBinding } : undefined,
      repositoryIdentity: { ...project.repositoryIdentity },
      status: binding.status,
      unavailableReason: binding.unavailableReason,
    };
  }
}

function createUnavailableContext(input: {
  bindingId: string;
  buildingId: string;
  projectId: string;
  companyName: string;
  reason: "MissingProject" | "MissingLocalPath";
}): ActiveProjectCompanyContext {
  const binding: ProjectCompanyBinding = {
    bindingId: input.bindingId,
    buildingId: input.buildingId,
    projectId: input.projectId,
    companyName: input.companyName,
    status: "unavailable",
    unavailableReason: input.reason,
  };

  return {
    binding,
    projectId: input.projectId,
    displayName: input.companyName,
    companyName: input.companyName,
    status: "unavailable",
    unavailableReason: input.reason,
  };
}

function cloneProject(project: ProjectRegistryEntry): ProjectRegistryEntry {
  return {
    ...project,
    localRepository: { ...project.localRepository },
    ...(project.localRepositoryBinding ? { localRepositoryBinding: { ...project.localRepositoryBinding } } : {}),
    ...(project.remoteRepository ? { remoteRepository: { ...project.remoteRepository } } : {}),
    repositoryIdentity: { ...project.repositoryIdentity },
    owner: { ...project.owner },
  };
}
