import { OFFICE_DEFINITIONS } from "./officeConfig";
import type { OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";
import { ProjectRegistryService } from "./project-registry/ProjectRegistryService";
import { ProjectCompanyBindingService } from "./project-company-binding/ProjectCompanyBindingService";

export type OfficeSpawnResolution = {
  office: OfficeDefinition;
  spawnRequest: OfficeSpawnRequest;
};

export class OfficeSpawnManager {
  resolveSpawn(request?: OfficeSpawnRequest): OfficeSpawnResolution {
    if (!request) {
      throw new Error("CompanyOfficeScene requires an OfficeSpawnRequest. Enter the office through a city building interaction.");
    }

    const office = getOfficeDefinition(request);
    const context = request.projectId
      ? new ProjectCompanyBindingService().resolveProjectBinding({
        bindingId: request.projectBindingId ?? request.buildingId,
        buildingId: request.buildingId,
        projectId: request.projectId,
        fallbackCompanyName: request.companyName,
        projects: new ProjectRegistryService().getAllProjects(),
      })
      : undefined;

    const boundOffice = context
      ? {
        ...office,
        buildingId: request.buildingId,
        companyName: context.companyName,
        interiorFoundation: office.interiorFoundation
          ? {
            zones: office.interiorFoundation.zones.map((zone) => ({ ...zone })),
          }
          : undefined,
        visualEnvironment: office.visualEnvironment
          ? {
            details: office.visualEnvironment.details.map((detail) =>
              detail.kind === "brand-sign"
                ? { ...detail, label: context.companyName }
                : { ...detail },
            ),
          }
          : undefined,
      }
      : office;
    return { office: boundOffice, spawnRequest: { ...request, companyName: boundOffice.companyName } };
  }
}

function getOfficeDefinition(request: OfficeSpawnRequest): OfficeDefinition {
  const office =
    OFFICE_DEFINITIONS.find((definition) => definition.sceneKey === request.officeSceneKey) ??
    OFFICE_DEFINITIONS.find((definition) => definition.buildingId === request.buildingId);

  if (!office) {
    throw new Error(`No office definition is configured for ${request.officeSceneKey} / ${request.buildingId}.`);
  }

  return office;
}
