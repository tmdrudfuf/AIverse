export type WorkstationState = "available" | "reserved" | "occupied" | "unavailable";

export type WorkstationPositionHint = {
  zone: "workstation";
  slot: number;
};

export type WorkstationSnapshot = {
  workstationId: string;
  label: string;
  positionHint: WorkstationPositionHint;
  assignedEmployeeId?: string;
  occupiedByEmployeeId?: string;
  currentTaskId?: string;
  state: WorkstationState;
};
