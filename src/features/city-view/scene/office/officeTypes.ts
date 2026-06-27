import type { Point, WorldBounds } from "../shared/geometry";
import type { Rect } from "../buildings/buildingTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";

export type OfficeTilemapDefinition = {
  mapKey: string;
  mapUrl: string;
  tilesets: OfficeTilesetDefinition[];
  layers: OfficeTilemapLayerNames;
};

export type OfficeTilesetDefinition = {
  name: string;
  key: string;
  url: string;
};

export type OfficeTilemapLayerNames = {
  floor: string;
  wall: string;
  decoration: string;
  collision: string;
  objects: string;
  interaction: string;
};

export type OfficeLayoutMarkers = {
  founderSpawn: Point;
  exitZone: Rect;
  reservedZones: Record<string, Rect>;
};

export type OfficeDefinition = {
  sceneKey: string;
  buildingId: string;
  companyName: string;
  worldBounds: WorldBounds;
  walkableBounds: Rect;
  founderSpawn: Point;
  exitZone: Rect;
  tilemap: OfficeTilemapDefinition;
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
