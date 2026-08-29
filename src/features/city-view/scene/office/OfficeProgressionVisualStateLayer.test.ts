import { describe, expect, it } from "vitest";
import { createOfficeProgressionVisualStateViewModel } from "./OfficeProgressionVisualStateLayer";
import type { OfficeLayoutSnapshot, OfficeLayoutZone, OfficeZoneType } from "./layout/OfficeLayoutTypes";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

describe("OfficeProgressionVisualStateLayer", () => {
  it("formats a compact office progression summary", () => {
    const viewModel = createOfficeProgressionVisualStateViewModel(createProgressionSnapshot(2), createLayoutSnapshot());

    expect(viewModel.visible).toBe(true);
    expect(viewModel.summaryTitle).toBe("Level 2: Small Office");
    expect(viewModel.capacityLabel).toBe("10 employee capacity");
    expect(viewModel.floorLabel).toBe("1 office floor");
    expect(viewModel.zoneCountLabel).toBe("7 active zones");
  });

  it("creates bounded active-zone markers from unlocked layout zones", () => {
    const viewModel = createOfficeProgressionVisualStateViewModel(createProgressionSnapshot(4), createLayoutSnapshot());

    expect(viewModel.markers).toHaveLength(6);
    expect(viewModel.markers.map((marker) => marker.label)).toEqual([
      "Entrance",
      "Shared Workspace",
      "Desk Area",
      "Meeting Area",
      "Break Area",
      "Reception",
    ]);
    expect(viewModel.markers[0]).toMatchObject({ id: "zone-entrance", x: 96, y: 492 });
  });

  it("does not create markers for locked zones", () => {
    const viewModel = createOfficeProgressionVisualStateViewModel(
      createProgressionSnapshot(1, { unlockedOfficeZones: ["entrance", "workspace"] }),
      createLayoutSnapshot(),
    );

    expect(viewModel.zoneCountLabel).toBe("2 active zones");
    expect(viewModel.markers.map((marker) => marker.label)).toEqual(["Entrance", "Shared Workspace"]);
  });

  it("returns hidden state when progression or layout is missing", () => {
    expect(createOfficeProgressionVisualStateViewModel(undefined, createLayoutSnapshot())).toEqual({
      visible: false,
      summaryTitle: "",
      capacityLabel: "",
      floorLabel: "",
      zoneCountLabel: "",
      markers: [],
    });
    expect(createOfficeProgressionVisualStateViewModel(createProgressionSnapshot(1), undefined).visible).toBe(false);
  });

  it("keeps visual-state projections independent from source snapshots", () => {
    const progression = createProgressionSnapshot(2);
    const layout = createLayoutSnapshot();
    const viewModel = createOfficeProgressionVisualStateViewModel(progression, layout);

    viewModel.markers[0].label = "Mutated";
    viewModel.markers[0].x = 1;

    expect(progression.unlockedOfficeZones).toEqual([
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "storage",
    ]);
    expect(layout.zones[0].label).toBe("Entrance");
    expect(createOfficeProgressionVisualStateViewModel(progression, layout).markers[0]).toMatchObject({
      label: "Entrance",
      x: 96,
    });
  });
});

function createProgressionSnapshot(
  companyLevel: number,
  overrides: Partial<CompanyProgressionSnapshot> = {},
): CompanyProgressionSnapshot {
  return {
    companyLevel,
    companyStage: companyLevel >= 4 ? "headquarters" : companyLevel >= 3 ? "growingCompany" : companyLevel >= 2 ? "smallOffice" : "garageStartup",
    unlockedOfficeZones: [
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "storage",
    ],
    maxEmployees: companyLevel >= 4 ? 32 : companyLevel >= 3 ? 18 : companyLevel >= 2 ? 10 : 5,
    requiredMilestones: [],
    layoutId: `layout-${companyLevel}`,
    floorCount: companyLevel >= 4 ? 3 : 1,
    ...overrides,
  };
}

function createLayoutSnapshot(): OfficeLayoutSnapshot {
  const zones: OfficeLayoutZone[] = [
    zone("entrance", "Entrance", 0.1, 0.82),
    zone("workspace", "Shared Workspace", 0.48, 0.48),
    zone("workstationArea", "Desk Area", 0.54, 0.46),
    zone("meetingArea", "Meeting Area", 0.78, 0.32),
    zone("breakArea", "Break Area", 0.26, 0.22),
    zone("reception", "Reception", 0.22, 0.72),
    zone("storage", "Storage", 0.88, 0.74),
    zone("serverArea", "Server Room", 0.9, 0.2),
  ];

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

function zone(type: OfficeZoneType, label: string, xWeight: number, yWeight: number): OfficeLayoutZone {
  return {
    zoneId: `zone-${type}`,
    type,
    label,
    floorId: "floor-1",
    isUnlocked: true,
    positionHint: {
      zoneId: `zone-${type}`,
      zoneType: type,
      floorId: "floor-1",
      label,
      xWeight,
      yWeight,
    },
  };
}
