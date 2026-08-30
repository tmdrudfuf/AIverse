import type { Point } from "../shared/geometry";
import type { FounderFacingDirection } from "../founder/founderTypes";

export type Rect = Point & {
  width: number;
  height: number;
};

export type CityBuildingType = "company" | "lab" | "studio";

export type CityBuildingDestination = {
  sceneKey: string;
  routeId?: string;
  enabled: boolean;
};

export type CityBuildingProjectBinding = {
  projectId: string;
  bindingId?: string;
};

export type CityBuildingVisual = {
  wall: number;
  roof: number;
  accent: number;
};

export type CityBuildingDefinition = {
  id: string;
  name: string;
  type: CityBuildingType;
  worldPosition: Point;
  size: {
    width: number;
    height: number;
  };
  interactionZone: Rect;
  entrancePoint: Point;
  destination: CityBuildingDestination;
  projectBinding?: CityBuildingProjectBinding;
  active: boolean;
  visual: CityBuildingVisual;
};

export type BuildingEntryRequest = {
  buildingId: string;
  companyName: string;
  projectId?: string;
  projectBindingId?: string;
  officeSceneKey: string;
  returnSceneKey: string;
  returnPosition: Point;
  returnFacing?: FounderFacingDirection;
};
