import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point } from "../shared/geometry";
import { CITY_WORLD_SCENE_KEY } from "../config/cityWorldConfig";
import type { BuildingEntryRequest, CityBuildingDefinition } from "./buildingTypes";

export class BuildingTransitionController {
  private lastEntryRequest?: BuildingEntryRequest;

  createEntryRequest(
    building: CityBuildingDefinition,
    returnPosition: Point,
    returnFacing?: FounderFacingDirection,
  ): BuildingEntryRequest | undefined {
    if (!building.active || !building.destination.enabled) return undefined;

    this.lastEntryRequest = {
      buildingId: building.id,
      companyName: building.name,
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
