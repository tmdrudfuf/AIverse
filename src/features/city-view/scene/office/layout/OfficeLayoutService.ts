import type { CompanyStage } from "../progression/CompanyProgressionTypes";
import type {
  OfficeBreakAreaSlot,
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
      zone("garage-entrance", "entrance", "Garage Entrance", true, 0.12, 0.86),
      zone("garage-workspace", "workspace", "Shared Workspace", true, 0.48, 0.48),
      zone("garage-workstations", "workstationArea", "Desk Cluster", true, 0.52, 0.42),
      zone("garage-meeting", "meetingArea", "Small Planning Table", true, 0.76, 0.34),
      zone("garage-break", "breakArea", "Coffee Corner", true, 0.24, 0.26),
    ],
    workstationCount: 5,
    meetingCount: 1,
    breakAreaCount: 1,
    furnitureSlots: [
      furniture("garage-desk-bank", "garage-workstations", "desk", "Desk Bank", 4, 0.52, 0.42),
      furniture("garage-planning-table", "garage-meeting", "table", "Planning Table", 4, 0.76, 0.34),
      furniture("garage-coffee-counter", "garage-break", "counter", "Coffee Counter", 2, 0.24, 0.26),
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
    entryExitPoints: layout.entryExitPoints.map((point) => ({ ...point, positionHint: { ...point.positionHint } })),
  };
}

function cloneSlot<TSlot extends OfficeLayoutSlot>(slotSnapshot: TSlot): TSlot {
  return {
    ...slotSnapshot,
    positionHint: { ...slotSnapshot.positionHint },
  };
}
