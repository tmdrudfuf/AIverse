import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point } from "../shared/geometry";
import { CITY_WORLD_SCENE_KEY } from "../config/cityWorldConfig";
import type { CityProjectOperationStatus } from "../CityProjectOperationsStatusService";
import type { BuildingEntryRequest, CityBuildingDefinition } from "./buildingTypes";

export class BuildingTransitionController {
  private lastEntryRequest?: BuildingEntryRequest;

  createEntryRequest(
    building: CityBuildingDefinition,
    returnPosition: Point,
    returnFacing?: FounderFacingDirection,
    operationStatus?: CityProjectOperationStatus,
  ): BuildingEntryRequest | undefined {
    if (!building.active || !building.destination.enabled) return undefined;
    if (operationStatus?.mutationDisabled) return undefined;

    this.lastEntryRequest = {
      buildingId: building.id,
      companyName: building.name,
      projectId: operationStatus?.projectId ?? building.projectBinding?.projectId,
      projectBindingId: building.projectBinding?.bindingId ?? building.id,
      officeSceneKey: building.destination.sceneKey,
      returnSceneKey: CITY_WORLD_SCENE_KEY,
      returnPosition: { ...returnPosition },
      returnFacing,
    };

    return this.lastEntryRequest;
  }

  getLastEntryRequest(): BuildingEntryRequest | undefined {
    return this.lastEntryRequest;
  }

  destroy() {
    this.lastEntryRequest = undefined;
  }
}
