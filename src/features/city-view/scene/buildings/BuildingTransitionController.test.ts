import { describe, expect, it } from "vitest";

import { BuildingTransitionController } from "./BuildingTransitionController";
import type { CityBuildingDefinition } from "./buildingTypes";

describe("BuildingTransitionController", () => {
  it("creates an office entry request with stable project-company binding metadata", () => {
    const request = new BuildingTransitionController().createEntryRequest(
      building({
        id: "alpha-tower",
        name: "ALPHA TOWER",
        projectId: "alpha",
        bindingId: "alpha-tower-binding",
      }),
      { x: 12, y: 24 },
      "down",
    );

    expect(request).toMatchObject({
      buildingId: "alpha-tower",
      companyName: "ALPHA TOWER",
      projectId: "alpha",
      projectBindingId: "alpha-tower-binding",
      officeSceneKey: "office-daily-proof",
      returnSceneKey: "city-world",
      returnPosition: { x: 12, y: 24 },
      returnFacing: "down",
    });
  });
});

function building(input: {
  id: string;
  name: string;
  projectId: string;
  bindingId: string;
}): CityBuildingDefinition {
  return {
    id: input.id,
    name: input.name,
    type: "company",
    worldPosition: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    interactionZone: { x: 0, y: 0, width: 1, height: 1 },
    entrancePoint: { x: 0, y: 0 },
    destination: { sceneKey: "office-daily-proof", routeId: "lobby", enabled: true },
    projectBinding: {
      projectId: input.projectId,
      bindingId: input.bindingId,
    },
    active: true,
    visual: { wall: 0, roof: 0, accent: 0 },
  };
}
