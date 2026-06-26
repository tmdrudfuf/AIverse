import type { Point } from "../shared/geometry";
import type { CityBuildingDefinition, Rect } from "./buildingTypes";

export class BuildingRegistry {
  private readonly indexedBuildings: IndexedBuilding[];

  constructor(private readonly buildings: CityBuildingDefinition[]) {
    this.indexedBuildings = buildings.map((building, index) => ({ building, index }));
  }

  getAll(): CityBuildingDefinition[] {
    return this.buildings;
  }

  getActiveBuildingAtPoint(point: Point): CityBuildingDefinition | undefined {
    return this.getBuildingsAtPoint(point)[0];
  }

  getBuildingsAtPoint(point: Point): CityBuildingDefinition[] {
    return this.indexedBuildings
      .filter(({ building }) => isPointInRect(point, building.interactionZone))
      .sort((first, second) => compareBuildings(first, second, point))
      .map(({ building }) => building);
  }
}

type IndexedBuilding = {
  building: CityBuildingDefinition;
  index: number;
};

function compareBuildings(first: IndexedBuilding, second: IndexedBuilding, point: Point) {
  const firstEnabled = first.building.active && first.building.destination.enabled;
  const secondEnabled = second.building.active && second.building.destination.enabled;
  if (firstEnabled !== secondEnabled) return firstEnabled ? -1 : 1;

  const firstDistance = getDistance(point, first.building.entrancePoint);
  const secondDistance = getDistance(point, second.building.entrancePoint);
  if (firstDistance !== secondDistance) return firstDistance - secondDistance;

  return first.index - second.index;
}

function isPointInRect(point: Point, rect: Rect) {
  return point.x >= rect.x && point.x <= rect.x + rect.width && point.y >= rect.y && point.y <= rect.y + rect.height;
}

function getDistance(first: Point, second: Point) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}