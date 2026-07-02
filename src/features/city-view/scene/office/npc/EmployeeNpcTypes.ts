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

export type EmployeeNpcViewModel = {
  employeeId: string;
  displayName: string;
  displayLabel: string;
  state: EmployeeSimulationState;
  currentTaskTitle?: string;
  positionHint: EmployeeNpcPositionHint | EmployeeNpcMovementPositionHint;
  movementState?: EmployeeNpcMovementState;
  currentMovementPosition?: EmployeeNpcMovementPosition;
  targetMovementPosition?: EmployeeNpcMovementPosition;
  spriteKey?: string;
  placeholderStyle?: EmployeeNpcPlaceholderStyle;
};
