import type { OfficeNpcLogicalPosition } from "../npc/EmployeeNpcMovementTypes";

export type EmployeeScheduleBlockType = "arrive" | "focusWork" | "meeting" | "break" | "lunch" | "leave";

export type EmployeeScheduleState =
  | "offDuty"
  | "arriving"
  | "available"
  | "focused"
  | "inMeeting"
  | "onBreak"
  | "atLunch"
  | "leaving";

export type EmployeeSchedulePositionIntent = {
  zone: OfficeNpcLogicalPosition;
  slot?: number;
};

export type EmployeeScheduleBlock = {
  blockId: string;
  type: EmployeeScheduleBlockType;
  label: string;
  startMinute: number;
  endMinute: number;
  positionIntent: EmployeeSchedulePositionIntent;
};

export type EmployeeDailyScheduleSnapshot = {
  employeeId: string;
  scheduleId: string;
  currentBlock?: EmployeeScheduleBlock;
  nextBlock?: EmployeeScheduleBlock;
  scheduleState: EmployeeScheduleState;
  workdayTime: number;
  lastUpdatedAt: string;
  positionIntent: EmployeeSchedulePositionIntent;
};
