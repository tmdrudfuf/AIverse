import type { CompanyStage } from "../progression/CompanyProgressionTypes";
import type {
  OfficeBreakAreaSlot,
  OfficeDepartmentArea,
  OfficeDepartmentKind,
  OfficeEntryExitPoint,
  OfficeFurnitureSlot,
  OfficeLayoutPositionHint,
  OfficeLayoutSnapshot,
  OfficeLayoutSlot,
  OfficeLayoutZone,
  OfficeMeetingSlot,
  OfficeWorkstationSlot,
  OfficeZoneType,
} from "./OfficeLayoutTypes";

const ACTIVE_LAYOUT_ID = "garage-startup-level-1";

const LAYOUTS_BY_ID: Record<string, OfficeLayoutSnapshot> = {
  [ACTIVE_LAYOUT_ID]: createLayout({
    layoutId: ACTIVE_LAYOUT_ID,
    stage: "garageStartup",
    floorId: "garage-startup-floor-1",
    zones: [
      zone("office-entrance", "entrance", "Reception Entrance", true, 0.5, 0.86),
      zone("office-shared", "workspace", "Shared Company Space", true, 0.5, 0.58),
      zone("office-engineering", "workstationArea", "Engineering", true, 0.22, 0.36),
      zone("office-review", "meetingArea", "Review", true, 0.53, 0.27),
      zone("office-validation", "workstationArea", "Validation / QA", true, 0.8, 0.27),
      zone("office-operations", "meetingArea", "Project Status", true, 0.78, 0.7),
      zone("office-lounge", "breakArea", "Lounge", true, 0.24, 0.76),
      zone("office-reception", "reception", "Reception", true, 0.5, 0.82),
    ],
    workstationCount: 8,
    meetingCount: 2,
    breakAreaCount: 2,
    furnitureSlots: [
      furniture("engineering-desk-bank", "office-engineering", "desk", "Engineering Desk Bank", 4, 0.22, 0.36),
      furniture("review-desk", "office-review", "desk", "Reviewer Desk", 1, 0.53, 0.27),
      furniture("validation-test-benches", "office-validation", "table", "Validation Test Benches", 2, 0.8, 0.27),
      furniture("operations-status-table", "office-operations", "table", "Operations Planning Table", 4, 0.78, 0.7),
      furniture("lounge-coffee-counter", "office-lounge", "counter", "Lounge Coffee Counter", 3, 0.24, 0.76),
    ],
    departmentAreas: [
      department("engineering", "Engineering", "office-engineering", 0.22, 0.36, [1, 2, 3, 4], [1], true),
      department("review", "Review", "office-review", 0.53, 0.27, [5], [1], true),
      department("validation-qa", "Validation / QA", "office-validation", 0.8, 0.27, [6, 7], [2], true),
      department("project-status-operations", "Project Status / Operations", "office-operations", 0.78, 0.7, [8], [2], true),
    ],
  }),
  "small-office-level-2": createLayout({
    layoutId: "small-office-level-2",
    stage: "smallOffice",
    floorId: "small-office-floor-1",
    zones: [
      zone("small-office-entrance", "entrance", "Office Entrance", false, 0.1, 0.82),
      zone("small-office-reception", "reception", "Reception", false, 0.22, 0.72),
      zone("small-office-workspace", "workspace", "Open Workspace", false, 0.48, 0.48),
      zone("small-office-workstations", "workstationArea", "Desk Rows", false, 0.54, 0.46),
      zone("small-office-meeting", "meetingArea", "Meeting Room", false, 0.78, 0.32),
      zone("small-office-break", "breakArea", "Break Nook", false, 0.26, 0.22),
      zone("small-office-storage", "storage", "Supply Storage", false, 0.88, 0.74),
    ],
    workstationCount: 10,
    meetingCount: 1,
    breakAreaCount: 1,
    furnitureSlots: [],
  }),
  "growing-company-level-3": createLayout({
    layoutId: "growing-company-level-3",
    stage: "growingCompany",
    floorId: "growing-company-floor-1",
    zones: [
      zone("growing-company-entrance", "entrance", "Main Entrance", false, 0.08, 0.84),
      zone("growing-company-reception", "reception", "Reception", false, 0.2, 0.76),
      zone("growing-company-workspace", "workspace", "Department Workspace", false, 0.48, 0.48),
      zone("growing-company-workstations", "workstationArea", "Department Desks", false, 0.52, 0.46),
      zone("growing-company-meeting-a", "meetingArea", "Planning Room", false, 0.74, 0.28),
      zone("growing-company-meeting-b", "meetingArea", "Review Room", false, 0.84, 0.44),
      zone("growing-company-break", "breakArea", "Team Kitchen", false, 0.26, 0.22),
      zone("growing-company-server", "serverArea", "Server Closet", false, 0.9, 0.2),
      zone("growing-company-storage", "storage", "Equipment Storage", false, 0.9, 0.74),
    ],
    workstationCount: 18,
    meetingCount: 2,
    breakAreaCount: 2,
    furnitureSlots: [],
    departmentAreas: [
      department("frontend-engineering", "Frontend Engineering", "growing-company-workspace", 0.36, 0.42, [1, 2, 3, 4], [1]),
      department("backend-engineering", "Backend Engineering", "growing-company-workstations", 0.58, 0.42, [5, 6, 7, 8], [1]),
      department("design", "Design Studio", "growing-company-workspace", 0.36, 0.58, [9, 10, 11], [2]),
      department("qa", "QA Lab", "growing-company-workstations", 0.62, 0.58, [12, 13, 14], [2]),
    ],
  }),
  "headquarters-level-4": createLayout({
    layoutId: "headquarters-level-4",
    stage: "headquarters",
    floorId: "headquarters-floor-1",
    zones: [
      zone("headquarters-entrance", "entrance", "Headquarters Lobby", false, 0.08, 0.86),
      zone("headquarters-reception", "reception", "Front Desk", false, 0.2, 0.78),
      zone("headquarters-workspace", "workspace", "Main Office Floor", false, 0.48, 0.5),
      zone("headquarters-workstations", "workstationArea", "Team Neighborhoods", false, 0.52, 0.48),
      zone("headquarters-meeting", "meetingArea", "Conference Suite", false, 0.76, 0.32),
      zone("headquarters-break", "breakArea", "Cafe", false, 0.28, 0.22),
      zone("headquarters-server", "serverArea", "Server Room", false, 0.88, 0.2),
      zone("headquarters-storage", "storage", "Operations Storage", false, 0.9, 0.74),
      zone("headquarters-executive", "executiveArea", "Executive Suite", false, 0.7, 0.18),
    ],
    workstationCount: 32,
    meetingCount: 3,
    breakAreaCount: 2,
    furnitureSlots: [],
    extraEntryExitPoints: [
      entryExit("headquarters-elevator-bank", "Future Elevator Bank", "headquarters-floor-1", "headquarters-entrance", 0.16, 0.66, "future-upper-floors"),
    ],
  }),
};

export class OfficeLayoutService {
  getActiveLayout(layoutId = ACTIVE_LAYOUT_ID): OfficeLayoutSnapshot {
    return cloneLayout(LAYOUTS_BY_ID[layoutId] ?? LAYOUTS_BY_ID[ACTIVE_LAYOUT_ID]);
  }

  getLayoutForStage(stage: CompanyStage): OfficeLayoutSnapshot {
    const layout = Object.values(LAYOUTS_BY_ID).find((snapshot) => snapshot.stage === stage);
    return cloneLayout(layout ?? LAYOUTS_BY_ID[ACTIVE_LAYOUT_ID]);
  }

  getFutureLayouts(): ReadonlyArray<OfficeLayoutSnapshot> {
    return Object.values(LAYOUTS_BY_ID)
      .filter((snapshot) => snapshot.layoutId !== ACTIVE_LAYOUT_ID)
      .map(cloneLayout);
  }

  getZones(layoutId = ACTIVE_LAYOUT_ID): OfficeLayoutZone[] {
    return this.getActiveLayout(layoutId).zones;
  }

  getPositionHints(layoutId = ACTIVE_LAYOUT_ID): OfficeLayoutPositionHint[] {
    const layout = this.getActiveLayout(layoutId);
    return [
      ...layout.zones.map((zoneSnapshot) => zoneSnapshot.positionHint),
      ...layout.furnitureSlots.map((slot) => slot.positionHint),
      ...layout.workstationSlots.map((slot) => slot.positionHint),
      ...layout.meetingSlots.map((slot) => slot.positionHint),
      ...layout.breakAreaSlots.map((slot) => slot.positionHint),
      ...layout.entryExitPoints.map((point) => point.positionHint),
    ];
  }

  getWorkstationSlots(layoutId = ACTIVE_LAYOUT_ID): OfficeWorkstationSlot[] {
    return this.getActiveLayout(layoutId).workstationSlots;
  }

  getFurnitureSlots(layoutId = ACTIVE_LAYOUT_ID): OfficeFurnitureSlot[] {
    return this.getActiveLayout(layoutId).furnitureSlots;
  }

  getDepartmentAreas(layoutId = ACTIVE_LAYOUT_ID): OfficeDepartmentArea[] {
    return this.getActiveLayout(layoutId).departmentAreas;
  }
}

type LayoutConfig = {
  layoutId: string;
  stage: CompanyStage;
  floorId: string;
  zones: OfficeLayoutZone[];
  workstationCount: number;
  meetingCount: number;
  breakAreaCount: number;
  furnitureSlots: OfficeFurnitureSlot[];
  departmentAreas?: OfficeDepartmentArea[];
  extraEntryExitPoints?: OfficeEntryExitPoint[];
};

function createLayout(config: LayoutConfig): OfficeLayoutSnapshot {
  const zones = config.zones.map((zoneSnapshot) => withFloor(zoneSnapshot, config.floorId));
  const workstationZone = findZone(zones, "workstationArea");
  const meetingZone = findZone(zones, "meetingArea");
  const breakZone = findZone(zones, "breakArea");
  const entranceZone = findZone(zones, "entrance");

  return {
    layoutId: config.layoutId,
    stage: config.stage,
    floorId: config.floorId,
    zones,
    furnitureSlots: config.furnitureSlots.map((slotSnapshot) => withFloorAndZoneType(slotSnapshot, zones, config.floorId)),
    workstationSlots: Array.from({ length: config.workstationCount }, (_, index) =>
      workstationSlot(workstationZone, index, config.floorId),
    ),
    meetingSlots: Array.from({ length: config.meetingCount }, (_, index) =>
      meetingSlot(meetingZone, index, config.floorId),
    ),
    breakAreaSlots: Array.from({ length: config.breakAreaCount }, (_, index) =>
      breakAreaSlot(breakZone, index, config.floorId),
    ),
    departmentAreas: (config.departmentAreas ?? []).map((area) => withDepartmentFloor(area, zones, config.floorId)),
    entryExitPoints: [
      entryExit(
        `${entranceZone.zoneId}-entry`,
        entranceZone.label,
        config.floorId,
        entranceZone.zoneId,
        entranceZone.positionHint.xWeight,
        entranceZone.positionHint.yWeight,
      ),
      ...(config.extraEntryExitPoints ?? []),
    ],
  };
}

function withDepartmentFloor(area: OfficeDepartmentArea, zones: OfficeLayoutZone[], floorId: string): OfficeDepartmentArea {
  const zoneSnapshot = zones.find((item) => item.zoneId === area.zoneId);

  return {
    ...area,
    floorId,
    positionHint: {
      ...area.positionHint,
      floorId,
      zoneType: zoneSnapshot?.type ?? area.positionHint.zoneType,
    },
    workstationSlotIds: [...area.workstationSlotIds],
    meetingSlotIds: [...area.meetingSlotIds],
  };
}

function withFloor(zoneSnapshot: OfficeLayoutZone, floorId: string): OfficeLayoutZone {
  return {
    ...zoneSnapshot,
    floorId,
    positionHint: {
      ...zoneSnapshot.positionHint,
      floorId,
    },
  };
}

function withFloorAndZoneType(
  slotSnapshot: OfficeFurnitureSlot,
  zones: OfficeLayoutZone[],
  floorId: string,
): OfficeFurnitureSlot {
  const zoneSnapshot = zones.find((item) => item.zoneId === slotSnapshot.zoneId);

  return {
    ...slotSnapshot,
    positionHint: {
      ...slotSnapshot.positionHint,
      zoneType: zoneSnapshot?.type ?? slotSnapshot.positionHint.zoneType,
      floorId,
    },
  };
}

function zone(
  zoneId: string,
  type: OfficeZoneType,
  label: string,
  isUnlocked: boolean,
  xWeight: number,
  yWeight: number,
): OfficeLayoutZone {
  return {
    zoneId,
    type,
    label,
    floorId: "",
    isUnlocked,
    positionHint: {
      zoneId,
      zoneType: type,
      floorId: "",
      label,
      xWeight,
      yWeight,
    },
  };
}

function furniture(
  slotId: string,
  zoneId: string,
  furnitureType: OfficeFurnitureSlot["furnitureType"],
  label: string,
  capacity: number,
  xWeight: number,
  yWeight: number,
): OfficeFurnitureSlot {
  return {
    ...slot(slotId, zoneId, "workspace", 0, label, capacity, xWeight, yWeight),
    furnitureType,
  };
}

function department(
  departmentKind: OfficeDepartmentKind,
  label: string,
  zoneId: string,
  xWeight: number,
  yWeight: number,
  workstationIndexes: number[],
  meetingIndexes: number[],
  isUnlocked = false,
): OfficeDepartmentArea {
  return {
    departmentId: `growing-company-${departmentKind}`,
    departmentKind,
    label,
    floorId: "",
    zoneId,
    positionHint: createPositionHint(zoneId, "workspace", "", undefined, label, xWeight, yWeight),
    workstationSlotIds: workstationIndexes.map((index) => `workstation-${index}`),
    meetingSlotIds: meetingIndexes.map((index) => `meeting-${index}`),
    isUnlocked,
  };
}

function workstationSlot(zoneSnapshot: OfficeLayoutZone, index: number, floorId: string): OfficeWorkstationSlot {
  return {
    ...slot(`workstation-${index + 1}`, zoneSnapshot.zoneId, zoneSnapshot.type, index, `Workstation ${index + 1}`, 1),
    workstationIndex: index,
    positionHint: createPositionHint(zoneSnapshot.zoneId, zoneSnapshot.type, floorId, index, `Workstation ${index + 1}`),
  };
}

function meetingSlot(zoneSnapshot: OfficeLayoutZone, index: number, floorId: string): OfficeMeetingSlot {
  return {
    ...slot(`meeting-${index + 1}`, zoneSnapshot.zoneId, zoneSnapshot.type, index, `Meeting ${index + 1}`, 4),
    meetingType: index === 0 ? "planning" : "review",
    positionHint: createPositionHint(zoneSnapshot.zoneId, zoneSnapshot.type, floorId, index, `Meeting ${index + 1}`),
  };
}

function breakAreaSlot(zoneSnapshot: OfficeLayoutZone, index: number, floorId: string): OfficeBreakAreaSlot {
  return {
    ...slot(`break-area-${index + 1}`, zoneSnapshot.zoneId, zoneSnapshot.type, index, `Break Area ${index + 1}`, 3),
    breakAreaType: index === 0 ? "coffee" : "lounge",
    positionHint: createPositionHint(zoneSnapshot.zoneId, zoneSnapshot.type, floorId, index, `Break Area ${index + 1}`),
  };
}

function slot(
  slotId: string,
  zoneId: string,
  zoneType: OfficeZoneType,
  slotIndex: number,
  label: string,
  capacity: number,
  xWeight?: number,
  yWeight?: number,
): OfficeLayoutSlot {
  return {
    slotId,
    zoneId,
    label,
    capacity,
    positionHint: createPositionHint(zoneId, zoneType, "", slotIndex, label, xWeight, yWeight),
  };
}

function entryExit(
  pointId: string,
  label: string,
  floorId: string,
  zoneId: string,
  xWeight?: number,
  yWeight?: number,
  connectsTo?: string,
): OfficeEntryExitPoint {
  return {
    pointId,
    label,
    floorId,
    connectsTo,
    positionHint: createPositionHint(zoneId, "entrance", floorId, undefined, label, xWeight, yWeight),
  };
}

function createPositionHint(
  zoneId: string,
  zoneType: OfficeZoneType,
  floorId: string,
  slotIndex?: number,
  label?: string,
  xWeight?: number,
  yWeight?: number,
): OfficeLayoutPositionHint {
  return {
    zoneId,
    zoneType,
    floorId,
    slot: slotIndex,
    label,
    xWeight,
    yWeight,
  };
}

function findZone(zones: OfficeLayoutZone[], zoneType: OfficeZoneType): OfficeLayoutZone {
  const zoneSnapshot = zones.find((item) => item.type === zoneType);
  if (!zoneSnapshot) {
    throw new Error(`Missing required office zone: ${zoneType}`);
  }

  return zoneSnapshot;
}

function cloneLayout(layout: OfficeLayoutSnapshot): OfficeLayoutSnapshot {
  return {
    ...layout,
    zones: layout.zones.map((zoneSnapshot) => ({
      ...zoneSnapshot,
      positionHint: { ...zoneSnapshot.positionHint },
    })),
    furnitureSlots: layout.furnitureSlots.map(cloneSlot),
    workstationSlots: layout.workstationSlots.map((slotSnapshot) => ({ ...cloneSlot(slotSnapshot), workstationIndex: slotSnapshot.workstationIndex })),
    meetingSlots: layout.meetingSlots.map((slotSnapshot) => ({ ...cloneSlot(slotSnapshot), meetingType: slotSnapshot.meetingType })),
    breakAreaSlots: layout.breakAreaSlots.map((slotSnapshot) => ({ ...cloneSlot(slotSnapshot), breakAreaType: slotSnapshot.breakAreaType })),
    departmentAreas: layout.departmentAreas.map((area) => ({
      ...area,
      positionHint: { ...area.positionHint },
      workstationSlotIds: [...area.workstationSlotIds],
      meetingSlotIds: [...area.meetingSlotIds],
    })),
    entryExitPoints: layout.entryExitPoints.map((point) => ({ ...point, positionHint: { ...point.positionHint } })),
  };
}

function cloneSlot<TSlot extends OfficeLayoutSlot>(slotSnapshot: TSlot): TSlot {
  return {
    ...slotSnapshot,
    positionHint: { ...slotSnapshot.positionHint },
  };
}
