export type OfficeNpcLogicalPosition = "entrance" | "workstation" | "meetingArea" | "breakArea" | "idleSpot";

export type EmployeeNpcMovementState = "idle" | "moving" | "arrived";

export type EmployeeNpcMovementPosition = {
  zone: OfficeNpcLogicalPosition;
  slot: number;
};

export type EmployeeNpcMovementPositionHint = EmployeeNpcMovementPosition;

export type EmployeeNpcMovementSnapshot = {
  employeeId: string;
  currentPosition: EmployeeNpcMovementPosition;
  targetPosition: EmployeeNpcMovementPosition;
  movementState: EmployeeNpcMovementState;
  speed: number;
  lastUpdatedAt: string;
  positionHint: EmployeeNpcMovementPositionHint;
};
