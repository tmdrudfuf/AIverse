import type { EmployeeSimulationSnapshot } from "../employees/EmployeeSimulationTypes";
import type {
  EmployeeDailyScheduleSnapshot,
  EmployeeScheduleBlock,
  EmployeeScheduleBlockType,
  EmployeeSchedulePositionIntent,
  EmployeeScheduleState,
} from "./EmployeeDailyScheduleTypes";

const DEFAULT_WORKDAY_TIME = 600;
const IDLE_POSITION_INTENT: EmployeeSchedulePositionIntent = { zone: "idleSpot" };

export class EmployeeDailyScheduleService {
  private snapshots: Record<string, EmployeeDailyScheduleSnapshot> = {};

  deriveSnapshots(
    employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
    workdayTime = DEFAULT_WORKDAY_TIME,
    updatedAt = createWorkdayTimestamp(workdayTime),
  ): Record<string, EmployeeDailyScheduleSnapshot> {
    this.snapshots = createScheduleSnapshots(employeeSnapshots, workdayTime, updatedAt);
    return this.cloneSnapshots();
  }

  previewSnapshots(
    employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
    workdayTime = DEFAULT_WORKDAY_TIME,
    updatedAt = createWorkdayTimestamp(workdayTime),
  ): ReadonlyArray<EmployeeDailyScheduleSnapshot> {
    return Object.values(cloneSnapshots(createScheduleSnapshots(employeeSnapshots, workdayTime, updatedAt)));
  }

  getSnapshots(): ReadonlyArray<EmployeeDailyScheduleSnapshot> {
    return Object.values(this.cloneSnapshots());
  }

  private cloneSnapshots() {
    return cloneSnapshots(this.snapshots);
  }
}

function createScheduleSnapshots(
  employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
  workdayTime: number,
  updatedAt: string,
): Record<string, EmployeeDailyScheduleSnapshot> {
  const orderedSnapshots = [...employeeSnapshots].sort((left, right) => left.employeeId.localeCompare(right.employeeId));

  return Object.fromEntries(
    orderedSnapshots.map((employee, index) => {
      const schedule = createDailySchedule(employee.employeeId, index);
      const currentBlock = findCurrentBlock(schedule, workdayTime);
      const nextBlock = findNextBlock(schedule, workdayTime);
      const positionIntent = currentBlock?.positionIntent ?? IDLE_POSITION_INTENT;

      return [
        employee.employeeId,
        {
          employeeId: employee.employeeId,
          scheduleId: `daily-schedule-${employee.employeeId}`,
          currentBlock,
          nextBlock,
          scheduleState: getScheduleState(currentBlock?.type, employee.currentState),
          workdayTime,
          lastUpdatedAt: updatedAt,
          positionIntent: { ...positionIntent },
        },
      ];
    }),
  );
}

function createDailySchedule(employeeId: string, slot: number): EmployeeScheduleBlock[] {
  const blockPrefix = `daily-schedule-${employeeId}`;

  return [
    createBlock(blockPrefix, "arrive", "Arrive", 480, 540, { zone: "entrance", slot }),
    createBlock(blockPrefix, "focusWork", "Focus Work", 540, 600, { zone: "workstation", slot }),
    createBlock(blockPrefix, "meeting", "Meeting", 600, 630, { zone: "meetingArea", slot }),
    createBlock(blockPrefix, "break", "Break", 630, 645, { zone: "breakArea", slot }),
    createBlock(blockPrefix, "focusWork", "Focus Work", 645, 720, { zone: "workstation", slot }),
    createBlock(blockPrefix, "lunch", "Lunch", 720, 780, { zone: "breakArea", slot }),
    createBlock(blockPrefix, "focusWork", "Focus Work", 780, 960, { zone: "workstation", slot }),
    createBlock(blockPrefix, "leave", "Leave", 960, 1020, { zone: "entrance", slot }),
  ];
}

function createBlock(
  blockPrefix: string,
  type: EmployeeScheduleBlockType,
  label: string,
  startMinute: number,
  endMinute: number,
  positionIntent: EmployeeSchedulePositionIntent,
): EmployeeScheduleBlock {
  return {
    blockId: `${blockPrefix}-${type}-${startMinute}`,
    type,
    label,
    startMinute,
    endMinute,
    positionIntent,
  };
}

function findCurrentBlock(schedule: ReadonlyArray<EmployeeScheduleBlock>, workdayTime: number) {
  return schedule.find((block) => workdayTime >= block.startMinute && workdayTime < block.endMinute);
}

function findNextBlock(schedule: ReadonlyArray<EmployeeScheduleBlock>, workdayTime: number) {
  return schedule.find((block) => workdayTime < block.startMinute);
}

function createWorkdayTimestamp(workdayTime: number) {
  const wholeMinutes = Math.max(0, Math.floor(workdayTime));
  const hours = Math.floor(wholeMinutes / 60) % 24;
  const minutes = wholeMinutes % 60;
  return new Date(Date.UTC(2026, 0, 1, hours, minutes)).toISOString();
}

function getScheduleState(
  blockType: EmployeeScheduleBlockType | undefined,
  employeeState: EmployeeSimulationSnapshot["currentState"],
): EmployeeScheduleState {
  if (!blockType) return "offDuty";
  if (employeeState === "unavailable") return "offDuty";
  if (blockType === "arrive") return "arriving";
  if (blockType === "meeting") return "inMeeting";
  if (blockType === "break") return "onBreak";
  if (blockType === "lunch") return "atLunch";
  if (blockType === "leave") return "leaving";
  return employeeState === "idle" ? "available" : "focused";
}

function cloneSnapshots(snapshots: Record<string, EmployeeDailyScheduleSnapshot>) {
  return Object.fromEntries(
    Object.entries(snapshots).map(([employeeId, snapshot]) => [
      employeeId,
      {
        ...snapshot,
        currentBlock: cloneBlock(snapshot.currentBlock),
        nextBlock: cloneBlock(snapshot.nextBlock),
        positionIntent: { ...snapshot.positionIntent },
      },
    ]),
  );
}

function cloneBlock(block: EmployeeScheduleBlock | undefined) {
  if (!block) return undefined;

  return {
    ...block,
    positionIntent: { ...block.positionIntent },
  };
}
