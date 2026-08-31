import type { CityBuildingDefinition } from "../buildings/buildingTypes";
import type { CityProjectOperationStatusMap } from "../CityProjectOperationsStatusService";
import type { FounderState } from "../founder/founderTypes";
import type { WorldBounds } from "../shared/geometry";
import {
  copyCompanyProgressionReward,
  copyWorldEventFeedState,
  copyWorldEffectState,
  copyWorldStateSnapshot,
  type WorldActorState,
  type WorldBuildingState,
  type WorldEventFeedState,
  type WorldEffectState,
  type WorldRewardState,
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
  cityProjectOperationStatuses?: CityProjectOperationStatusMap;
  founderState?: FounderState;
  effects?: ReadonlyArray<WorldEffectState>;
  rewards?: ReadonlyArray<WorldRewardState>;
  eventFeed?: ReadonlyArray<WorldEventFeedState>;
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
    buildings: input.buildings.map((building) => createWorldBuildingState(building, input.cityProjectOperationStatuses?.[building.id])),
    actors: createWorldActorStates(input.founderState),
    effects: (input.effects ?? []).map(copyWorldEffectState),
    rewards: (input.rewards ?? []).map(copyCompanyProgressionReward),
    eventFeed: (input.eventFeed ?? []).map(copyWorldEventFeedState),
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
    effects: [],
    rewards: [],
    eventFeed: [],
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
      ? input.buildings.map((building) => createWorldBuildingState(building, input.cityProjectOperationStatuses?.[building.id]))
      : previous
        ? previous.buildings.map((building) => ({ ...building, position: { ...building.position }, size: { ...building.size } }))
        : [],
    actors: input?.founderState
      ? createWorldActorStates(input.founderState)
      : previous
        ? previous.actors.map((actor) => ({ ...actor, position: { ...actor.position } }))
        : [],
    effects: input?.effects
      ? input.effects.map(copyWorldEffectState)
      : previous
        ? previous.effects.map(copyWorldEffectState)
        : [],
    rewards: input?.rewards
      ? input.rewards.map(copyCompanyProgressionReward)
      : previous
        ? previous.rewards.map(copyCompanyProgressionReward)
        : [],
    eventFeed: input?.eventFeed
      ? input.eventFeed.map(copyWorldEventFeedState)
      : previous
        ? previous.eventFeed.map(copyWorldEventFeedState)
        : [],
    syncStatus: status,
    lastSuccessfulSyncAt: previous?.lastSuccessfulSyncAt,
    errorSummary,
  };
}

function createWorldBuildingState(
  building: CityBuildingDefinition,
  operationStatus?: CityProjectOperationStatusMap[string],
): WorldBuildingState {
  return {
    id: building.id,
    name: building.name,
    type: building.type,
    position: { ...building.worldPosition },
    size: { ...building.size },
    active: building.active,
    destinationEnabled: building.destination.enabled,
    companyId: building.projectBinding?.bindingId,
    projectId: operationStatus?.projectId ?? building.projectBinding?.projectId,
    operationStage: operationStatus?.stage,
    operationLabel: operationStatus?.label,
    operationTone: operationStatus?.tone,
    operationReasonText: operationStatus?.reasonText,
    mutationDisabled: operationStatus?.mutationDisabled,
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
    effects: snapshot.effects,
    rewards: snapshot.rewards,
    eventFeed: snapshot.eventFeed,
  };
}
