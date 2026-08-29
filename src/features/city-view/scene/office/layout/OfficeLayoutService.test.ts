import { describe, expect, it } from "vitest";

import { OfficeLayoutService } from "./OfficeLayoutService";

describe("OfficeLayoutService", () => {
  it("exposes growing-company physical department areas in a stable order", () => {
    const service = new OfficeLayoutService();
    const layout = service.getLayoutForStage("growingCompany");

    expect(layout.departmentAreas.map((area) => area.departmentKind)).toEqual([
      "frontend-engineering",
      "backend-engineering",
      "design",
      "qa",
    ]);
    expect(layout.departmentAreas.map((area) => area.label)).toEqual([
      "Frontend Engineering",
      "Backend Engineering",
      "Design Studio",
      "QA Lab",
    ]);
    expect(layout.departmentAreas.slice(0, 2)).toMatchObject([
      {
        floorId: "growing-company-floor-1",
        zoneId: "growing-company-workspace",
        positionHint: {
          floorId: "growing-company-floor-1",
          zoneId: "growing-company-workspace",
          zoneType: "workspace",
          xWeight: 0.36,
          yWeight: 0.42,
        },
        workstationSlotIds: ["workstation-1", "workstation-2", "workstation-3", "workstation-4"],
        meetingSlotIds: ["meeting-1"],
        isUnlocked: false,
      },
      {
        floorId: "growing-company-floor-1",
        zoneId: "growing-company-workstations",
        positionHint: {
          floorId: "growing-company-floor-1",
          zoneId: "growing-company-workstations",
          zoneType: "workstationArea",
          xWeight: 0.58,
          yWeight: 0.42,
        },
        workstationSlotIds: ["workstation-5", "workstation-6", "workstation-7", "workstation-8"],
        meetingSlotIds: ["meeting-1"],
        isUnlocked: false,
      },
    ]);
  });

  it("keeps the active startup layout free of department areas", () => {
    const service = new OfficeLayoutService();
    const layout = service.getActiveLayout();

    expect(layout.stage).toBe("garageStartup");
    expect(layout.zones).toHaveLength(5);
    expect(layout.workstationSlots).toHaveLength(5);
    expect(layout.meetingSlots).toHaveLength(1);
    expect(layout.entryExitPoints).toHaveLength(1);
    expect(layout.departmentAreas).toEqual([]);
    expect(service.getDepartmentAreas()).toEqual([]);
  });

  it("returns defensive department area copies", () => {
    const service = new OfficeLayoutService();
    const [departmentArea] = service.getDepartmentAreas("growing-company-level-3");

    departmentArea.label = "Mutated";
    departmentArea.positionHint.xWeight = 0.99;
    departmentArea.workstationSlotIds.push("workstation-99");
    departmentArea.meetingSlotIds.push("meeting-99");

    expect(service.getDepartmentAreas("growing-company-level-3")[0]).toMatchObject({
      label: "Frontend Engineering",
      positionHint: { xWeight: 0.36 },
      workstationSlotIds: ["workstation-1", "workstation-2", "workstation-3", "workstation-4"],
      meetingSlotIds: ["meeting-1"],
    });
  });
});
