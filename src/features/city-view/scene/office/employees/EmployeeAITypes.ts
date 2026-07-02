import type { OfficeLayoutSnapshot, OfficeLayoutZone } from "../layout/OfficeLayoutTypes";
import type { EmployeeNpcMovementSnapshot, OfficeNpcLogicalPosition } from "../npc/EmployeeNpcMovementTypes";
import type { CompanyProgressionSnapshot } from "../progression/CompanyProgressionTypes";
import type { EmployeeDailyScheduleSnapshot, EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";
import type { EmployeeSimulationSnapshot, EmployeeSimulationState } from "./EmployeeSimulationTypes";
import type { Employee } from "./EmployeeTypes";

export type EmployeeAIState = "idle" | "walking" | "working" | "talking" | "taking_break" | "going_home";

export type EmployeeAIContext = {
  employeeId: string;
  employee?: Employee;
  simulationSnapshot?: EmployeeSimulationSnapshot;
  movementSnapshot?: EmployeeNpcMovementSnapshot;
  scheduleSnapshot?: EmployeeDailyScheduleSnapshot;
  companyProgression?: CompanyProgressionSnapshot;
  officeLayout?: OfficeLayoutSnapshot;
  officeZones?: ReadonlyArray<OfficeLayoutZone>;
  isConversationActive?: boolean;
  updatedAt?: string;
};

export type EmployeeAITransition = {
  employeeId: string;
  fromState: EmployeeAIState;
  toState: EmployeeAIState;
  reason: string;
  occurredAt: string;
  accepted: boolean;
};

export type EmployeeAIConfig = {
  allowedTransitions?: Partial<Record<EmployeeAIState, EmployeeAIState[]>>;
  breakScheduleStates?: EmployeeScheduleState[];
  goingHomeScheduleStates?: EmployeeScheduleState[];
};

export type EmployeeAISnapshot = {
  employeeId: string;
  currentState: EmployeeAIState;
  previousState?: EmployeeAIState;
  lastTransition?: EmployeeAITransition;
  lastUpdatedAt: string;
  contextSummary: {
    simulationState?: EmployeeSimulationState;
    movementZone?: OfficeNpcLogicalPosition;
    movementState?: EmployeeNpcMovementSnapshot["movementState"];
    scheduleState?: EmployeeScheduleState;
    layoutId?: string;
    companyLevel?: number;
  };
};

export type EmployeeAIUpdateResult = {
  employeeId: string;
  snapshot: EmployeeAISnapshot;
  transition?: EmployeeAITransition;
  rejectedTransition?: EmployeeAITransition;
};
