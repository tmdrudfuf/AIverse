import type { CityBuildingType } from "../buildings/buildingTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point, WorldBounds } from "../shared/geometry";

export type WorldStateSyncStatus = "NotStarted" | "Syncing" | "Succeeded" | "Failed" | "Unavailable";

export type WorldActorRole = "Founder";

export type WorldBuildingState = {
  id: string;
  name: string;
  type: CityBuildingType;
  position: Point;
  size: {
    width: number;
    height: number;
  };
  active: boolean;
  destinationEnabled: boolean;
  companyId?: string;
  projectId?: string;
};

export type WorldActorState = {
  id: string;
  role: WorldActorRole;
  position: Point;
  facing?: FounderFacingDirection;
};

export type WorldStateSnapshot = {
  worldId: string;
  activeWorldSpaceId: string;
  sceneKey: string;
  bounds: WorldBounds;
  buildings: WorldBuildingState[];
  actors: WorldActorState[];
  syncStatus: WorldStateSyncStatus;
  lastSuccessfulSyncAt?: string;
  errorSummary?: string;
};

export type WorldStateSyncResult = {
  status: WorldStateSyncStatus;
  changed: boolean;
  snapshot: WorldStateSnapshot;
};

export function copyWorldStateSnapshot(snapshot: WorldStateSnapshot): WorldStateSnapshot {
  return {
    ...snapshot,
    bounds: { ...snapshot.bounds },
    buildings: snapshot.buildings.map(copyWorldBuildingState),
    actors: snapshot.actors.map(copyWorldActorState),
  };
}

export function copyWorldBuildingState(building: WorldBuildingState): WorldBuildingState {
  return {
    ...building,
    position: { ...building.position },
    size: { ...building.size },
  };
}

export function copyWorldActorState(actor: WorldActorState): WorldActorState {
  return {
    ...actor,
    position: { ...actor.position },
  };
}
