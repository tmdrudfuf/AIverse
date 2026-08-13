import { describe, expect, it } from "vitest";
import { OfficeExitController } from "./OfficeExitController";
import type { OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";
import type { WorldEffectState } from "../world-state/WorldStateTypes";

describe("OfficeExitController", () => {
  it("copies world effects into city return payloads when the exit is active", () => {
    const controller = new OfficeExitController(createSceneStub(), createOffice(), createSpawnRequest());
    const effects = [createWorldEffect(2)];

    controller.update({ x: 24, y: 24 }, false);
    const payload = controller.createReturnPayload("left", effects);

    expect(payload).toMatchObject({
      buildingId: "daily-proof-inc",
      returnPosition: { x: 100, y: 120 },
      returnFacing: "left",
      worldEffects: effects,
    });

    effects[0].unlockedOfficeZones[0] = "storage";
    effects[0].milestoneIds[0] = "mutated";

    expect(payload?.worldEffects?.[0].unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(payload?.worldEffects?.[0].milestoneIds).toEqual(["complete-first-client-project"]);
  });

  it("omits world effects from city return payloads when none are present", () => {
    const controller = new OfficeExitController(createSceneStub(), createOffice(), createSpawnRequest());

    controller.update({ x: 24, y: 24 }, false);
    const payload = controller.createReturnPayload("left");

    expect(payload?.worldEffects).toBeUndefined();
  });
});

function createSceneStub() {
  return {
    add: {
      text: () => createTextStub(),
    },
  } as unknown as ConstructorParameters<typeof OfficeExitController>[0];
}

type TextStub = {
  setScrollFactor: () => TextStub;
  setDepth: () => TextStub;
  setVisible: () => TextStub;
  destroy: () => undefined;
};

function createTextStub(): TextStub {
  const textStub: TextStub = {
    setScrollFactor: () => textStub,
    setDepth: () => textStub,
    setVisible: () => textStub,
    destroy: () => undefined,
  };
  return textStub;
}

function createOffice(): OfficeDefinition {
  return {
    sceneKey: "office-daily-proof",
    buildingId: "daily-proof-inc",
    companyName: "Daily Proof",
    worldBounds: { x: 0, y: 0, width: 320, height: 240 },
    walkableBounds: { x: 0, y: 0, width: 320, height: 240 },
    founderSpawn: { x: 40, y: 40 },
    exitZone: { x: 10, y: 10, width: 40, height: 40 },
    tilemap: {
      mapKey: "office-map",
      mapUrl: "/office.json",
      tilesets: [],
      layers: {
        floor: "floor",
        wall: "wall",
        decoration: "decoration",
        collision: "collision",
        objects: "objects",
        interaction: "interaction",
      },
    },
  };
}

function createSpawnRequest(): OfficeSpawnRequest {
  return {
    buildingId: "daily-proof-inc",
    companyName: "Daily Proof",
    officeSceneKey: "office-daily-proof",
    returnSceneKey: "city-world",
    returnPosition: { x: 100, y: 120 },
    returnFacing: "down",
  };
}

function createWorldEffect(toLevel: number): WorldEffectState {
  return {
    effectId: `company-level-${toLevel}-reached:world-effect`,
    effectType: "company_progression_level_reached",
    source: "company_progression",
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: 1,
    toLevel,
    companyStage: "smallOffice",
    layoutId: "small-office-level-2",
    floorCount: 1,
    maxEmployees: 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestoneIds: ["complete-first-client-project"],
  };
}
