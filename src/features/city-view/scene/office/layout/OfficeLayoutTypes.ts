import type { CompanyStage } from "../progression/CompanyProgressionTypes";

export type OfficeZoneType =
  | "entrance"
  | "workspace"
  | "workstationArea"
  | "meetingArea"
  | "breakArea"
  | "reception"
  | "serverArea"
  | "storage"
  | "executiveArea";

export type OfficeLayoutPositionHint = {
  zoneId: string;
  zoneType: OfficeZoneType;
  floorId: string;
  slot?: number;
  label?: string;
  xWeight?: number;
  yWeight?: number;
};

export type OfficeLayoutZone = {
  zoneId: string;
  type: OfficeZoneType;
  label: string;
  floorId: string;
  positionHint: OfficeLayoutPositionHint;
  isUnlocked: boolean;
};

export type OfficeLayoutSlot = {
  slotId: string;
  zoneId: string;
  positionHint: OfficeLayoutPositionHint;
  capacity?: number;
  label?: string;
  reservedFor?: string;
};

export type OfficeFurnitureSlot = OfficeLayoutSlot & {
  furnitureType: "desk" | "table" | "chair" | "counter" | "shelf" | "serverRack" | "executiveDesk";
};

export type OfficeWorkstationSlot = OfficeLayoutSlot & {
  workstationIndex: number;
};

export type OfficeMeetingSlot = OfficeLayoutSlot & {
  meetingType: "standup" | "planning" | "review";
};

export type OfficeBreakAreaSlot = OfficeLayoutSlot & {
  breakAreaType: "snack" | "coffee" | "lounge";
};

export type OfficeEntryExitPoint = {
  pointId: string;
  label: string;
  floorId: string;
  positionHint: OfficeLayoutPositionHint;
  connectsTo?: string;
};

export type OfficeLayoutSnapshot = {
  layoutId: string;
  stage: CompanyStage;
  floorId: string;
  zones: OfficeLayoutZone[];
  furnitureSlots: OfficeFurnitureSlot[];
  workstationSlots: OfficeWorkstationSlot[];
  meetingSlots: OfficeMeetingSlot[];
  breakAreaSlots: OfficeBreakAreaSlot[];
  entryExitPoints: OfficeEntryExitPoint[];
};
