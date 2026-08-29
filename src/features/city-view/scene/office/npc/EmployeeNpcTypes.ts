import type { EmployeeSimulationState } from "../employees/EmployeeSimulationTypes";
import type {
  EmployeeNpcMovementPosition,
  EmployeeNpcMovementPositionHint,
  EmployeeNpcMovementState,
  OfficeNpcLogicalPosition,
} from "./EmployeeNpcMovementTypes";

export type EmployeeNpcPositionZone = "desk" | "collaboration" | "review" | "idle" | OfficeNpcLogicalPosition;

export type EmployeeNpcPositionHint = {
  zone: EmployeeNpcPositionZone;
  slot: number;
};

export type EmployeeNpcPlaceholderStyle = {
  fillColor: number;
  borderColor: number;
  labelColor: string;
};

export type EmployeeNpcWorkAnimation = {
  kind: "workstationTask";
  active: boolean;
  taskId?: string;
  taskTitle?: string;
};

export type EmployeeNpcVisualTone = "active" | "warning" | "complete" | "idle";

export type EmployeeNpcViewModel = {
  employeeId: string;
  displayName: string;
  displayLabel: string;
  state: EmployeeSimulationState;
  currentTaskTitle?: string;
  workAnimation?: EmployeeNpcWorkAnimation;
  positionHint: EmployeeNpcPositionHint | EmployeeNpcMovementPositionHint;
  movementState?: EmployeeNpcMovementState;
  currentMovementPosition?: EmployeeNpcMovementPosition;
  targetMovementPosition?: EmployeeNpcMovementPosition;
  spriteKey?: string;
  placeholderStyle?: EmployeeNpcPlaceholderStyle;
  semanticRole?: string;
  visualTone?: EmployeeNpcVisualTone;
};
