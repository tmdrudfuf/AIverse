import type { Employee } from "../employees/EmployeeTypes";
import type { EmployeeSimulationSnapshot } from "../employees/EmployeeSimulationTypes";
import type { EmployeeNpcPositionHint } from "../npc/EmployeeNpcTypes";
import type { EmployeeDailyScheduleSnapshot } from "../schedules/EmployeeDailyScheduleTypes";
import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkstationSnapshot } from "../workstations/WorkstationTypes";

export type EmployeeDialogueType =
  | "greeting"
  | "idle"
  | "assigned"
  | "working"
  | "break"
  | "unavailable"
  | "projectStatus";

export type EmployeeConversation = {
  employeeId: string;
  conversationId: string;
  speakerName: string;
  dialogueText: string;
  dialogueType: EmployeeDialogueType;
  sourceState: EmployeeSimulationSnapshot["currentState"] | EmployeeDailyScheduleSnapshot["scheduleState"] | "projectStatus";
  currentTaskTitle?: string;
  timestamp: string;
};

export type EmployeeConversationContext = {
  employee?: Employee;
  simulationSnapshot?: EmployeeSimulationSnapshot;
  currentTask?: ProjectTask;
  workstationSnapshot?: WorkstationSnapshot;
  scheduleSnapshot?: EmployeeDailyScheduleSnapshot;
  projectName?: string;
  timestamp?: string;
};

export type EmployeeConversationViewModel = {
  employeeId: string;
  speakerName: string;
  dialogueText: string;
  dialogueType: EmployeeDialogueType;
  displayDurationMs: number;
  positionHint?: EmployeeNpcPositionHint;
};

export type NearbyEmployeeConversationTarget = {
  employeeId: string;
  distance: number;
};
