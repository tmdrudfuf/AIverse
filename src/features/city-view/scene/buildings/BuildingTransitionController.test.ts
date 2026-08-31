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

  it("uses the canonical project id from the selected portfolio status when entering", () => {
    const controller = new BuildingTransitionController();
    const first = controller.createEntryRequest(
      building({
        id: "alpha-tower",
        name: "ALPHA TOWER",
        projectId: "alpha",
        bindingId: "alpha-tower-binding",
      }),
      { x: 12, y: 24 },
      "down",
      status("alpha-tower", "alpha", false),
    );
    const second = controller.createEntryRequest(
      building({
        id: "beta-tower",
        name: "BETA TOWER",
        projectId: "beta",
        bindingId: "beta-tower-binding",
      }),
      { x: 36, y: 48 },
      "up",
      status("beta-tower", "beta", false),
    );
    const third = controller.createEntryRequest(
      building({
        id: "alpha-tower",
        name: "ALPHA TOWER",
        projectId: "alpha",
        bindingId: "alpha-tower-binding",
      }),
      { x: 60, y: 72 },
      "left",
      status("alpha-tower", "alpha", false),
    );

    expect(first?.projectId).toBe("alpha");
    expect(second?.projectId).toBe("beta");
    expect(third?.projectId).toBe("alpha");
    expect(controller.getLastEntryRequest()?.projectId).toBe("alpha");
  });

  it("does not create an office entry request for a disconnected portfolio status", () => {
    const request = new BuildingTransitionController().createEntryRequest(
      building({
        id: "missing-tower",
        name: "MISSING TOWER",
        projectId: "missing-project",
        bindingId: "missing-tower-binding",
      }),
      { x: 12, y: 24 },
      "down",
      status("missing-tower", "missing-project", true),
    );

    expect(request).toBeUndefined();
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

function status(buildingId: string, projectId: string, mutationDisabled: boolean) {
  return {
    buildingId,
    projectId,
    projectName: projectId,
    companyName: projectId,
    stage: mutationDisabled ? "disconnected" : "implementation",
    label: mutationDisabled ? "DISCONNECTED" : "ACTIVE",
    tone: mutationDisabled ? "disconnected" : "active",
    mutationDisabled,
    portfolioSummary: {
      buildingId,
      projectId,
      projectName: projectId,
      companyName: projectId,
      bindingStatus: mutationDisabled ? "unavailable" : "bound",
      workflowStage: mutationDisabled ? "disconnected" : "implementation",
      attentionState: mutationDisabled ? "disconnected" : "active",
      attentionLabel: mutationDisabled ? "DISCONNECTED" : "ACTIVE",
      tone: mutationDisabled ? "disconnected" : "active",
      operatorActionAvailable: !mutationDisabled,
    },
  } as const;
}
