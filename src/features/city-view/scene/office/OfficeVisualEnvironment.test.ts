import { describe, expect, it } from "vitest";

import {
  getEnabledEnvironmentDetails,
  getEnvironmentDetailKinds,
  hasDailyProofVisualEnvironment,
  validateVisualEnvironment,
} from "./OfficeVisualEnvironment";
import { OFFICE_DEFINITIONS } from "./officeConfig";
import type { OfficeDefinition } from "./officeTypes";

describe("OfficeVisualEnvironment", () => {
  it("exposes the Daily Proof company office environment details in a stable order", () => {
    const [dailyProofOffice] = OFFICE_DEFINITIONS;

    expect(hasDailyProofVisualEnvironment(dailyProofOffice)).toBe(true);
    expect(getEnvironmentDetailKinds(dailyProofOffice)).toEqual([
      "brand-sign",
      "plant",
      "lighting",
      "collaboration-board",
      "storage",
    ]);
    expect(getEnabledEnvironmentDetails(dailyProofOffice).map((detail) => detail.label)).toEqual([
      "Proof Wall",
      "Lobby Greenery",
      "Focus Lights",
      "Sprint Board",
      "Supply Shelf",
    ]);
  });

  it("returns defensive detail copies", () => {
    const office = createOffice();
    const [detail] = getEnabledEnvironmentDetails(office);

    detail.label = "Mutated";
    detail.bounds.x = 999;

    expect(getEnabledEnvironmentDetails(office)[0]).toMatchObject({
      label: "Proof Wall",
      bounds: { x: 10 },
    });
  });

  it("omits disabled details from enabled reads", () => {
    const office = createOffice({
      details: [createDetail("detail-1"), createDetail("detail-2", { enabled: false })],
    });

    expect(getEnabledEnvironmentDetails(office).map((detail) => detail.id)).toEqual(["detail-1"]);
  });

  it("validates duplicate ids, missing labels, and invalid bounds", () => {
    expect(() =>
      validateVisualEnvironment(
        createOffice({
          details: [
            createDetail("detail-1"),
            createDetail("detail-1", { bounds: { x: 40, y: 10, width: 20, height: 20 } }),
          ],
        }),
      ),
    ).toThrow(/duplicated/);

    expect(() =>
      validateVisualEnvironment(
        createOffice({
          details: [createDetail("detail-1", { label: " " })],
        }),
      ),
    ).toThrow(/missing a label/);

    expect(() =>
      validateVisualEnvironment(
        createOffice({
          details: [createDetail("detail-1", { bounds: { x: 10, y: 10, width: 0, height: 20 } })],
        }),
      ),
    ).toThrow(/invalid bounds/);
  });
});

function createOffice(visualEnvironment: OfficeDefinition["visualEnvironment"] = { details: [createDetail("detail-1")] }): OfficeDefinition {
  return {
    sceneKey: "office-daily-proof",
    buildingId: "daily-proof",
    companyName: "Daily Proof",
    worldBounds: { x: 0, y: 0, width: 960, height: 640 },
    walkableBounds: { x: 0, y: 0, width: 960, height: 640 },
    founderSpawn: { x: 10, y: 10 },
    exitZone: { x: 20, y: 20, width: 80, height: 40 },
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
    visualEnvironment,
  };
}

function createDetail(id: string, overrides: Partial<NonNullable<OfficeDefinition["visualEnvironment"]>["details"][number]> = {}) {
  return {
    id,
    kind: "brand-sign" as const,
    label: "Proof Wall",
    bounds: { x: 10, y: 10, width: 20, height: 20 },
    accentColor: 0x5f7f8d,
    enabled: true,
    ...overrides,
  };
}
