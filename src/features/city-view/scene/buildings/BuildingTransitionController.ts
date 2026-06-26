import type { Point } from "../shared/geometry";
import type { BuildingEntryRequest, CityBuildingDefinition } from "./buildingTypes";

const CITY_RETURN_SCENE_KEY = "city-world";

export class BuildingTransitionController {
  private lastEntryRequest?: BuildingEntryRequest;

  createEntryRequest(building: CityBuildingDefinition, returnPosition: Point): BuildingEntryRequest | undefined {
    if (!building.active || !building.destination.enabled) return undefined;

    this.lastEntryRequest = {
      buildingId: building.id,
      destinationSceneKey: building.destination.sceneKey,
      returnSceneKey: CITY_RETURN_SCENE_KEY,
      returnPosition: { ...returnPosition },
    };

    console.info("Building entry requested", this.lastEntryRequest);
    return this.lastEntryRequest;
  }

  getLastEntryRequest(): BuildingEntryRequest | undefined {
    return this.lastEntryRequest;
  }

  destroy() {
    this.lastEntryRequest = undefined;
  }
}