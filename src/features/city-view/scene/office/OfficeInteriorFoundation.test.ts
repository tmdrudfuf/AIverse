import { describe, expect, it } from "vitest";

import {
  getEnabledInteriorZones,
  getInteriorZoneRoles,
  hasDailyProofInteriorFoundation,
  validateInteriorFoundation,
} from "./OfficeInteriorFoundation";
import { OFFICE_DEFINITIONS } from "./officeConfig";
import type { OfficeDefinition } from "./officeTypes";

describe("OfficeInteriorFoundation", () => {
  it("exposes the Daily Proof company office foundation roles in a stable order", () => {
    const [dailyProofOffice] = OFFICE_DEFINITIONS;

    expect(hasDailyProofInteriorFoundation(dailyProofOffice)).toBe(true);
    expect(getInteriorZoneRoles(dailyProofOffice)).toEqual([
      "reception",
      "founder-desk",
      "workspace",
      "employee-desk",
    ]);
    expect(getEnabledInteriorZones(dailyProofOffice).map((zone) => zone.label)).toEqual([
      "Reception",
      "Founder Desk",
      "Project Workspace",
      "Employee Desk",
    ]);
  });

  it("returns defensive zone copies", () => {
    const office = createOffice();
    const [zone] = getEnabledInteriorZones(office);

    zone.label = "Mutated";
    zone.bounds.x = 999;

    expect(getEnabledInteriorZones(office)[0]).toMatchObject({
      label: "Reception",
      bounds: { x: 10 },
    });
  });

  it("validates duplicate ids and invalid bounds", () => {
    expect(() =>
      validateInteriorFoundation(
        createOffice({
          zones: [
            createZone("zone-1"),
            createZone("zone-1", { x: 40, y: 10, width: 20, height: 20 }),
          ],
        }),
      ),
    ).toThrow(/duplicated/);

    expect(() =>
      validateInteriorFoundation(
        createOffice({
          zones: [createZone("zone-1", { x: 10, y: 10, width: 0, height: 20 })],
        }),
      ),
    ).toThrow(/invalid bounds/);
  });
});

function createOffice(interiorFoundation: OfficeDefinition["interiorFoundation"] = { zones: [createZone("zone-1")] }): OfficeDefinition {
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
    interiorFoundation,
  };
}

function createZone(id: string, bounds = { x: 10, y: 10, width: 20, height: 20 }) {
  return {
    id,
    label: "Reception",
    role: "reception" as const,
    bounds,
    accentColor: 0x5f7f8d,
    enabled: true,
  };
}
