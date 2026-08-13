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

export type WorldEffectSource = "company_progression";

export type CompanyProgressionWorldEffect = {
  effectId: string;
  effectType: "company_progression_level_reached";
  source: WorldEffectSource;
  triggerId: string;
  fromLevel: number;
  toLevel: number;
  companyStage: string;
  layoutId: string;
  floorCount: number;
  maxEmployees: number;
  unlockedOfficeZones: string[];
  milestoneIds: string[];
};

export type WorldEffectState = CompanyProgressionWorldEffect;

export type CompanyProgressionReward = {
  rewardId: string;
  rewardType: "company_progression_reward_granted";
  source: WorldEffectSource;
  effectId: string;
  triggerId: string;
  fromLevel: number;
  toLevel: number;
  companyStage: string;
  layoutId: string;
  floorCount: number;
  maxEmployees: number;
  unlockedOfficeZones: string[];
  milestoneIds: string[];
};

export type WorldRewardState = CompanyProgressionReward;

export type WorldStateSnapshot = {
  worldId: string;
  activeWorldSpaceId: string;
  sceneKey: string;
  bounds: WorldBounds;
  buildings: WorldBuildingState[];
  actors: WorldActorState[];
  effects: WorldEffectState[];
  rewards: WorldRewardState[];
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
    effects: snapshot.effects.map(copyWorldEffectState),
    rewards: snapshot.rewards.map(copyCompanyProgressionReward),
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

export function copyWorldEffectState(effect: WorldEffectState): WorldEffectState {
  return {
    ...effect,
    unlockedOfficeZones: [...effect.unlockedOfficeZones],
    milestoneIds: [...effect.milestoneIds],
  };
}

export function copyCompanyProgressionReward(reward: WorldRewardState): WorldRewardState {
  return {
    ...reward,
    unlockedOfficeZones: [...reward.unlockedOfficeZones],
    milestoneIds: [...reward.milestoneIds],
  };
}
