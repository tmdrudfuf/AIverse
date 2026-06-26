import type { Point, WorldBounds } from "../shared/geometry";
import type { Rect } from "../buildings/buildingTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";

export type OfficeDefinition = {
  sceneKey: string;
  buildingId: string;
  companyName: string;
  worldBounds: WorldBounds;
  walkableBounds: Rect;
  founderSpawn: Point;
  exitZone: Rect;
};

export type OfficeSpawnRequest = {
  buildingId: string;
  companyName: string;
  officeSceneKey: string;
  returnSceneKey: string;
  returnPosition: Point;
  returnFacing?: FounderFacingDirection;
};

export type CityReturnPayload = {
  buildingId: string;
  returnPosition: Point;
  returnFacing?: FounderFacingDirection;
};
