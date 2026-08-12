import type { CityBuildingDefinition } from "../buildings/buildingTypes";
import type { FounderState } from "../founder/founderTypes";
import type { WorldBounds } from "../shared/geometry";
import {
  copyWorldStateSnapshot,
  type WorldActorState,
  type WorldBuildingState,
  type WorldStateSnapshot,
  type WorldStateSyncResult,
  type WorldStateSyncStatus,
} from "./WorldStateTypes";

export const AI_CITY_WORLD_ID = "ai-city";
export const CITY_WORLD_SPACE_ID = "ai-city.exterior";

export type WorldStateSynchronizationInput = {
  worldId: string;
  activeWorldSpaceId: string;
  sceneKey: string;
  bounds: WorldBounds;
  buildings: ReadonlyArray<CityBuildingDefinition>;
  founderState?: FounderState;
  syncedAt?: string;
};

export class WorldStateSynchronizer {
  private latestSnapshot?: WorldStateSnapshot;

  getSnapshot(): WorldStateSnapshot {
    return copyWorldStateSnapshot(this.latestSnapshot ?? createNotStartedWorldStateSnapshot());
  }

  markSyncing(input?: Partial<WorldStateSynchronizationInput>): WorldStateSnapshot {
    this.latestSnapshot = createStatusSnapshot("Syncing", input, this.latestSnapshot);
    return copyWorldStateSnapshot(this.latestSnapshot);
  }

  markFailed(errorSummary: string, input?: Partial<WorldStateSynchronizationInput>): WorldStateSnapshot {
    this.latestSnapshot = createStatusSnapshot("Failed", input, this.latestSnapshot, errorSummary);
    return copyWorldStateSnapshot(this.latestSnapshot);
  }

  markUnavailable(errorSummary: string, input?: Partial<WorldStateSynchronizationInput>): WorldStateSnapshot {
    this.latestSnapshot = createStatusSnapshot("Unavailable", input, this.latestSnapshot, errorSummary);
    return copyWorldStateSnapshot(this.latestSnapshot);
  }

  synchronize(input: WorldStateSynchronizationInput): WorldStateSyncResult {
    const candidate = createSucceededWorldStateSnapshot(input);
    if (this.latestSnapshot?.syncStatus === "Succeeded" && worldStateSemanticsEqual(this.latestSnapshot, candidate)) {
      return {
        status: "Succeeded",
        changed: false,
        snapshot: copyWorldStateSnapshot(this.latestSnapshot),
      };
    }

    this.latestSnapshot = candidate;
    return {
      status: "Succeeded",
      changed: true,
      snapshot: copyWorldStateSnapshot(candidate),
    };
  }
}

export function createSucceededWorldStateSnapshot(input: WorldStateSynchronizationInput): WorldStateSnapshot {
  const syncedAt = input.syncedAt ?? new Date().toISOString();

  return {
    worldId: input.worldId,
    activeWorldSpaceId: input.activeWorldSpaceId,
    sceneKey: input.sceneKey,
    bounds: { ...input.bounds },
    buildings: input.buildings.map(createWorldBuildingState),
    actors: createWorldActorStates(input.founderState),
    syncStatus: "Succeeded",
    lastSuccessfulSyncAt: syncedAt,
  };
}

export function createNotStartedWorldStateSnapshot(): WorldStateSnapshot {
  return {
    worldId: AI_CITY_WORLD_ID,
    activeWorldSpaceId: CITY_WORLD_SPACE_ID,
    sceneKey: "",
    bounds: { x: 0, y: 0, width: 0, height: 0 },
    buildings: [],
    actors: [],
    syncStatus: "NotStarted",
  };
}

function createStatusSnapshot(
  status: Exclude<WorldStateSyncStatus, "NotStarted" | "Succeeded">,
  input: Partial<WorldStateSynchronizationInput> | undefined,
  previous: WorldStateSnapshot | undefined,
  errorSummary?: string,
): WorldStateSnapshot {
  return {
    worldId: input?.worldId ?? previous?.worldId ?? AI_CITY_WORLD_ID,
    activeWorldSpaceId: input?.activeWorldSpaceId ?? previous?.activeWorldSpaceId ?? CITY_WORLD_SPACE_ID,
    sceneKey: input?.sceneKey ?? previous?.sceneKey ?? "",
    bounds: input?.bounds ? { ...input.bounds } : previous ? { ...previous.bounds } : { x: 0, y: 0, width: 0, height: 0 },
    buildings: input?.buildings
      ? input.buildings.map(createWorldBuildingState)
      : previous
        ? previous.buildings.map((building) => ({ ...building, position: { ...building.position }, size: { ...building.size } }))
        : [],
    actors: input?.founderState
      ? createWorldActorStates(input.founderState)
      : previous
        ? previous.actors.map((actor) => ({ ...actor, position: { ...actor.position } }))
        : [],
    syncStatus: status,
    lastSuccessfulSyncAt: previous?.lastSuccessfulSyncAt,
    errorSummary,
  };
}

function createWorldBuildingState(building: CityBuildingDefinition): WorldBuildingState {
  return {
    id: building.id,
    name: building.name,
    type: building.type,
    position: { ...building.worldPosition },
    size: { ...building.size },
    active: building.active,
    destinationEnabled: building.destination.enabled,
  };
}

function createWorldActorStates(founderState?: FounderState): WorldActorState[] {
  if (!founderState || !isFinitePoint(founderState.position)) return [];

  return [
    {
      id: founderState.id,
      role: "Founder",
      position: { ...founderState.position },
      facing: founderState.facing,
    },
  ];
}

function isFinitePoint(point: { x: number; y: number }) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

function worldStateSemanticsEqual(first: WorldStateSnapshot, second: WorldStateSnapshot) {
  return JSON.stringify(createSemanticComparisonState(first)) === JSON.stringify(createSemanticComparisonState(second));
}

function createSemanticComparisonState(snapshot: WorldStateSnapshot) {
  return {
    worldId: snapshot.worldId,
    activeWorldSpaceId: snapshot.activeWorldSpaceId,
    sceneKey: snapshot.sceneKey,
    bounds: snapshot.bounds,
    buildings: snapshot.buildings,
    actors: snapshot.actors,
  };
}
