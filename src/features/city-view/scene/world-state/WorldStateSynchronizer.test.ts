import { describe, expect, it } from "vitest";
import type { CityBuildingDefinition } from "../buildings/buildingTypes";
import type { FounderState } from "../founder/founderTypes";
import {
  AI_CITY_WORLD_ID,
  CITY_WORLD_SPACE_ID,
  createSucceededWorldStateSnapshot,
  WorldStateSynchronizer,
} from "./WorldStateSynchronizer";

const BOUNDS = { x: 0, y: 0, width: 1800, height: 1080 };

const FOUNDER: FounderState = {
  id: "founder",
  position: { x: 240, y: 280 },
  facing: "down",
};

describe("WorldStateSynchronizer", () => {
  it("creates copied successful snapshots from world, building, and Founder state", () => {
    const buildings = createBuildings();
    const founder = createFounder();
    const snapshot = createSucceededWorldStateSnapshot({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings,
      founderState: founder,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    expect(snapshot).toMatchObject({
      worldId: "ai-city",
      activeWorldSpaceId: "ai-city.exterior",
      sceneKey: "city-world",
      syncStatus: "Succeeded",
      lastSuccessfulSyncAt: "2026-08-12T10:00:00.000Z",
    });
    expect(snapshot.buildings).toHaveLength(2);
    expect(snapshot.buildings[0]).toMatchObject({
      id: "daily-proof-inc",
      name: "DAILY PROOF INC.",
      type: "company",
      active: true,
      destinationEnabled: true,
    });
    expect(snapshot.buildings[1]).toMatchObject({
      id: "portfolio-studio",
      active: false,
      destinationEnabled: false,
    });
    expect(snapshot.actors).toEqual([
      {
        id: "founder",
        role: "Founder",
        position: { x: 240, y: 280 },
        facing: "down",
      },
    ]);

    buildings[0].worldPosition.x = 999;
    founder.position.x = 999;

    expect(snapshot.buildings[0].position).toEqual({ x: 72, y: 72 });
    expect(snapshot.actors[0].position).toEqual({ x: 240, y: 280 });
  });

  it("reuses the previous snapshot when semantic world facts are unchanged", () => {
    const synchronizer = new WorldStateSynchronizer();
    const buildings = createBuildings();
    const founder = createFounder();

    const first = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings,
      founderState: founder,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });
    const second = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: { ...BOUNDS },
      buildings: buildings.map((building) => ({
        ...building,
        worldPosition: { ...building.worldPosition },
        size: { ...building.size },
      })),
      founderState: { ...founder, position: { ...founder.position } },
      syncedAt: "2026-08-12T10:05:00.000Z",
    });

    expect(first.changed).toBe(true);
    expect(second.changed).toBe(false);
    expect(second.snapshot.lastSuccessfulSyncAt).toBe("2026-08-12T10:00:00.000Z");
  });

  it("updates the latest snapshot when Founder state changes", () => {
    const synchronizer = new WorldStateSynchronizer();
    const buildings = createBuildings();
    const founder = createFounder();
    synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings,
      founderState: founder,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    const result = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings,
      founderState: {
        ...founder,
        position: { x: 300, y: 340 },
        facing: "right",
      },
      syncedAt: "2026-08-12T10:06:00.000Z",
    });

    expect(result.changed).toBe(true);
    expect(result.snapshot.lastSuccessfulSyncAt).toBe("2026-08-12T10:06:00.000Z");
    expect(result.snapshot.actors).toEqual([
      {
        id: "founder",
        role: "Founder",
        position: { x: 300, y: 340 },
        facing: "right",
      },
    ]);
  });

  it("omits invalid Founder state without blocking building synchronization", () => {
    const result = new WorldStateSynchronizer().synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: {
        id: "founder",
        position: { x: Number.NaN, y: 10 },
      },
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    expect(result.status).toBe("Succeeded");
    expect(result.snapshot.buildings).toHaveLength(2);
    expect(result.snapshot.actors).toEqual([]);
  });

  it("keeps internal snapshots isolated from returned-object mutations", () => {
    const synchronizer = new WorldStateSynchronizer();
    const result = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    result.snapshot.bounds.width = 1;
    result.snapshot.buildings[0].position.x = 1;
    result.snapshot.actors[0].position.x = 1;

    const stored = synchronizer.getSnapshot();

    expect(stored.bounds.width).toBe(1800);
    expect(stored.buildings[0].position.x).not.toBe(1);
    expect(stored.actors[0].position.x).not.toBe(1);
  });

  it("stores copied world effects in successful snapshots", () => {
    const synchronizer = new WorldStateSynchronizer();
    const effects = [createWorldEffect(2)];
    const result = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      effects,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    expect(result.snapshot.effects).toEqual(effects);

    effects[0].unlockedOfficeZones[0] = "storage";
    result.snapshot.effects[0].milestoneIds[0] = "mutated";

    const stored = synchronizer.getSnapshot();

    expect(stored.effects[0].unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(stored.effects[0].milestoneIds).toEqual(["complete-first-client-project"]);
  });

  it("stores copied rewards in successful snapshots", () => {
    const synchronizer = new WorldStateSynchronizer();
    const rewards = [createReward(2)];
    const result = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      rewards,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    expect(result.snapshot.rewards).toEqual(rewards);

    rewards[0].unlockedOfficeZones[0] = "storage";
    result.snapshot.rewards[0].milestoneIds[0] = "mutated";

    const stored = synchronizer.getSnapshot();

    expect(stored.rewards[0].unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(stored.rewards[0].milestoneIds).toEqual(["complete-first-client-project"]);
  });

  it("stores copied event feed entries in successful snapshots", () => {
    const synchronizer = new WorldStateSynchronizer();
    const eventFeed = [createFeedEvent(2)];
    const result = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      eventFeed,
      syncedAt: "2026-08-12T10:00:00.000Z",
    });

    expect(result.snapshot.eventFeed).toEqual(eventFeed);

    eventFeed[0].unlockedOfficeZones[0] = "storage";
    result.snapshot.eventFeed[0].milestoneIds[0] = "mutated";

    const stored = synchronizer.getSnapshot();

    expect(stored.eventFeed[0].unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(stored.eventFeed[0].milestoneIds).toEqual(["complete-first-client-project"]);
  });

  it("uses world effects in semantic synchronization comparison", () => {
    const synchronizer = new WorldStateSynchronizer();
    const first = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      effects: [createWorldEffect(2)],
      syncedAt: "2026-08-12T10:00:00.000Z",
    });
    const unchanged = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      effects: [createWorldEffect(2)],
      syncedAt: "2026-08-12T10:05:00.000Z",
    });
    const changed = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      effects: [createWorldEffect(3)],
      syncedAt: "2026-08-12T10:06:00.000Z",
    });

    expect(first.changed).toBe(true);
    expect(unchanged.changed).toBe(false);
    expect(unchanged.snapshot.lastSuccessfulSyncAt).toBe("2026-08-12T10:00:00.000Z");
    expect(changed.changed).toBe(true);
    expect(changed.snapshot.effects[0].toLevel).toBe(3);
  });

  it("uses rewards in semantic synchronization comparison", () => {
    const synchronizer = new WorldStateSynchronizer();
    const first = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      rewards: [createReward(2)],
      syncedAt: "2026-08-12T10:00:00.000Z",
    });
    const unchanged = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      rewards: [createReward(2)],
      syncedAt: "2026-08-12T10:05:00.000Z",
    });
    const changed = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      rewards: [createReward(3)],
      syncedAt: "2026-08-12T10:06:00.000Z",
    });

    expect(first.changed).toBe(true);
    expect(unchanged.changed).toBe(false);
    expect(unchanged.snapshot.lastSuccessfulSyncAt).toBe("2026-08-12T10:00:00.000Z");
    expect(changed.changed).toBe(true);
    expect(changed.snapshot.rewards[0].toLevel).toBe(3);
  });

  it("uses event feed entries in semantic synchronization comparison", () => {
    const synchronizer = new WorldStateSynchronizer();
    const first = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      eventFeed: [createFeedEvent(2)],
      syncedAt: "2026-08-12T10:00:00.000Z",
    });
    const unchanged = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      eventFeed: [createFeedEvent(2)],
      syncedAt: "2026-08-12T10:05:00.000Z",
    });
    const changed = synchronizer.synchronize({
      worldId: AI_CITY_WORLD_ID,
      activeWorldSpaceId: CITY_WORLD_SPACE_ID,
      sceneKey: "city-world",
      bounds: BOUNDS,
      buildings: createBuildings(),
      founderState: createFounder(),
      eventFeed: [createFeedEvent(3)],
      syncedAt: "2026-08-12T10:06:00.000Z",
    });

    expect(first.changed).toBe(true);
    expect(unchanged.changed).toBe(false);
    expect(unchanged.snapshot.lastSuccessfulSyncAt).toBe("2026-08-12T10:00:00.000Z");
    expect(changed.changed).toBe(true);
    expect(changed.snapshot.eventFeed[0].toLevel).toBe(3);
  });
});

function createFounder(): FounderState {
  return {
    ...FOUNDER,
    position: { ...FOUNDER.position },
  };
}

function createBuildings(): CityBuildingDefinition[] {
  return [
    {
      id: "daily-proof-inc",
      name: "DAILY PROOF INC.",
      type: "company",
      worldPosition: { x: 72, y: 72 },
      size: { width: 344, height: 180 },
      interactionZone: { x: 184, y: 252, width: 120, height: 108 },
      entrancePoint: { x: 244, y: 282 },
      destination: {
        sceneKey: "office-daily-proof",
        routeId: "daily-proof-lobby",
        enabled: true,
      },
      active: true,
      visual: {
        wall: 0xe76f51,
        roof: 0x263b50,
        accent: 0xf4c85d,
      },
    },
    {
      id: "portfolio-studio",
      name: "PORTFOLIO STUDIO",
      type: "studio",
      worldPosition: { x: 760, y: 490 },
      size: { width: 350, height: 166 },
      interactionZone: { x: 875, y: 660, width: 120, height: 112 },
      entrancePoint: { x: 935, y: 690 },
      destination: {
        sceneKey: "office-portfolio-studio",
        routeId: "portfolio-studio-lobby",
        enabled: false,
      },
      active: false,
      visual: {
        wall: 0xa67bb8,
        roof: 0x493c5a,
        accent: 0xf0b7d2,
      },
    },
  ];
}

function createWorldEffect(toLevel: number) {
  return {
    effectId: `company-level-${toLevel}-reached:world-effect`,
    effectType: "company_progression_level_reached" as const,
    source: "company_progression" as const,
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: 1,
    maxEmployees: toLevel >= 3 ? 18 : 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestoneIds: ["complete-first-client-project"],
  };
}

function createReward(toLevel: number) {
  return {
    rewardId: `company-level-${toLevel}-reached:world-effect:reward`,
    rewardType: "company_progression_reward_granted" as const,
    source: "company_progression" as const,
    effectId: `company-level-${toLevel}-reached:world-effect`,
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: 1,
    maxEmployees: toLevel >= 3 ? 18 : 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestoneIds: ["complete-first-client-project"],
  };
}

function createFeedEvent(toLevel: number) {
  return {
    eventId: `company-level-${toLevel}-reached:world-effect:reward:feed-event`,
    eventType: "company_progression_feed_event" as const,
    source: "company_progression" as const,
    rewardId: `company-level-${toLevel}-reached:world-effect:reward`,
    effectId: `company-level-${toLevel}-reached:world-effect`,
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: 1,
    maxEmployees: toLevel >= 3 ? 18 : 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestoneIds: ["complete-first-client-project"],
  };
}
