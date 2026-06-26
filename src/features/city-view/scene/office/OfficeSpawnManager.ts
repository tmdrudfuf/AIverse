import { OFFICE_DEFINITIONS } from "./officeConfig";
import type { OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";

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
    return { office, spawnRequest: request };
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
