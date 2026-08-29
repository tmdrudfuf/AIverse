import { describe, expect, it } from "vitest";

import { ReceptionDeskRuntimeSpawnService } from "./ReceptionDeskRuntimeSpawnService";
import type { OfficeDefinition } from "./officeTypes";
import type { OfficeLayoutSnapshot, OfficeLayoutZone, OfficeZoneType } from "./layout/OfficeLayoutTypes";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

describe("ReceptionDeskRuntimeSpawnService", () => {
  it("does not create a reception desk before level 2", () => {
    const service = new ReceptionDeskRuntimeSpawnService();

    expect(
      service.createReceptionDeskInteractable({
        office: createOffice(),
        progression: createProgression(1, ["entrance", "workspace"]),
        layout: createLayout(),
      }),
    ).toBeUndefined();
  });

  it("creates one enabled workspace-opening reception desk at level 2", () => {
    const service = new ReceptionDeskRuntimeSpawnService();

    const object = service.createReceptionDeskInteractable({
      office: createOffice(),
      progression: createProgression(2, ["entrance", "workspace", "reception"]),
      layout: createLayout(),
    });

    expect(object).toMatchObject({
      id: "small-office-level-2-reception-runtime-desk",
      type: "desk",
      displayName: "Reception Runtime Desk",
      enabled: true,
      action: "open_workspace",
      markerId: "small-office-level-2-reception-runtime-desk",
      interactionZone: {
        x: 147,
        y: 396,
        width: 128,
        height: 72,
      },
    });
  });

  it("does not create a desk when reception is locked or missing from the layout", () => {
    const service = new ReceptionDeskRuntimeSpawnService();

    expect(
      service.createReceptionDeskInteractable({
        office: createOffice(),
        progression: createProgression(2, ["entrance", "workspace"]),
        layout: createLayout(),
      }),
    ).toBeUndefined();

    expect(
      service.createReceptionDeskInteractable({
        office: createOffice(),
        progression: createProgression(2, ["entrance", "workspace", "reception"]),
        layout: createLayout([]),
      }),
    ).toBeUndefined();
  });
});

function createOffice(): OfficeDefinition {
  return {
    sceneKey: "office-daily-proof",
    buildingId: "daily-proof",
    companyName: "Daily Proof",
    worldBounds: { x: 0, y: 0, width: 960, height: 600 },
    walkableBounds: { x: 48, y: 72, width: 864, height: 468 },
    founderSpawn: { x: 480, y: 490 },
    exitZone: { x: 420, y: 510, width: 120, height: 54 },
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

function createProgression(companyLevel: number, unlockedOfficeZones: CompanyProgressionSnapshot["unlockedOfficeZones"]): CompanyProgressionSnapshot {
  return {
    companyLevel,
    companyStage: companyLevel >= 2 ? "smallOffice" : "garageStartup",
    unlockedOfficeZones,
    maxEmployees: companyLevel >= 2 ? 10 : 5,
    requiredMilestones: [],
    layoutId: companyLevel >= 2 ? "small-office-level-2" : "garage-startup-level-1",
    floorCount: 1,
  };
}

function createLayout(zones: OfficeLayoutZone[] = [zone("small-office-reception", "reception", "Reception", 0.22, 0.72)]): OfficeLayoutSnapshot {
  return {
    layoutId: "small-office-level-2",
    stage: "smallOffice",
    floorId: "small-office-floor-1",
    zones,
    furnitureSlots: [],
    workstationSlots: [],
    meetingSlots: [],
    breakAreaSlots: [],
    departmentAreas: [],
    entryExitPoints: [],
  };
}

function zone(zoneId: string, type: OfficeZoneType, label: string, xWeight: number, yWeight: number): OfficeLayoutZone {
  return {
    zoneId,
    type,
    label,
    floorId: "floor-1",
    isUnlocked: true,
    positionHint: {
      zoneId,
      zoneType: type,
      floorId: "floor-1",
      label,
      xWeight,
      yWeight,
    },
  };
}
