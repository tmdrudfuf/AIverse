import type { EmployeeSimulationState } from "../employees/EmployeeSimulationTypes";

export type EmployeeNpcPositionZone = "desk" | "collaboration" | "review" | "idle";

export type EmployeeNpcPositionHint = {
  zone: EmployeeNpcPositionZone;
  slot: number;
};

export type EmployeeNpcPlaceholderStyle = {
  fillColor: number;
  borderColor: number;
  labelColor: string;
};

export type EmployeeNpcViewModel = {
  employeeId: string;
  displayName: string;
  displayLabel: string;
  state: EmployeeSimulationState;
  currentTaskTitle?: string;
  positionHint: EmployeeNpcPositionHint;
  spriteKey?: string;
  placeholderStyle?: EmployeeNpcPlaceholderStyle;
};
