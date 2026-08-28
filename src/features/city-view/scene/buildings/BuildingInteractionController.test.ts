import { describe, expect, it } from "vitest";

import { BuildingInteractionController } from "./BuildingInteractionController";
import { BuildingRegistry } from "./BuildingRegistry";
import type { CityBuildingDefinition } from "./buildingTypes";

describe("BuildingInteractionController", () => {
  it("selects an active company building from a direct click", () => {
    const controller = new BuildingInteractionController(new BuildingRegistry([createBuilding({ active: true, enabled: true })]));

    callPointerUp(controller, { worldX: 25, worldY: 25, x: 10, y: 10, downX: 10, downY: 10 });

    expect(controller.consumeClickedBuilding()?.id).toBe("daily-proof-inc");
  });

  it("ignores disabled future-site building clicks", () => {
    const controller = new BuildingInteractionController(new BuildingRegistry([createBuilding({ active: false, enabled: false })]));

    callPointerUp(controller, { worldX: 25, worldY: 25, x: 10, y: 10, downX: 10, downY: 10 });

    expect(controller.consumeClickedBuilding()).toBeUndefined();
  });

  it("does not treat pointer drags as building clicks", () => {
    const controller = new BuildingInteractionController(new BuildingRegistry([createBuilding({ active: true, enabled: true })]));

    callPointerUp(controller, { worldX: 25, worldY: 25, x: 40, y: 10, downX: 10, downY: 10 });

    expect(controller.consumeClickedBuilding()).toBeUndefined();
  });
});

type PointerClick = { worldX: number; worldY: number; x: number; y: number; downX: number; downY: number };

function callPointerUp(controller: BuildingInteractionController, pointer: PointerClick) {
  (controller as unknown as { handlePointerUp: (pointer: PointerClick) => void }).handlePointerUp(pointer);
}

function createBuilding(options: { active: boolean; enabled: boolean }): CityBuildingDefinition {
  return {
    id: "daily-proof-inc",
    name: "DAILY PROOF INC.",
    type: "company",
    worldPosition: { x: 0, y: 0 },
    size: { width: 100, height: 80 },
    interactionZone: { x: 0, y: 0, width: 50, height: 50 },
    entrancePoint: { x: 20, y: 20 },
    destination: { sceneKey: "office-daily-proof", enabled: options.enabled },
    active: options.active,
    visual: { wall: 0xffffff, roof: 0x000000, accent: 0xff0000 },
  };
}
