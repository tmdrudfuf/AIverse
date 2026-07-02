import type { EmployeeAISnapshot, EmployeeAIState } from "../employees/EmployeeAITypes";
import type { EmployeeRole } from "../employees/EmployeeTypes";
import type { EmployeeSimulationSnapshot, EmployeeSimulationState } from "../employees/EmployeeSimulationTypes";
import type { EmployeeNpcMovementPositionHint, EmployeeNpcMovementSnapshot } from "../npc/EmployeeNpcMovementTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { CompanyProgressionSnapshot } from "../progression/CompanyProgressionTypes";
import type { EmployeeDailyScheduleSnapshot, EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";
import type { ProjectTask, TaskStatus } from "../tasks/ProjectTaskTypes";
import type { WorkstationSnapshot, WorkstationState } from "../workstations/WorkstationTypes";

export type EmployeeInsightConfig = {
  proximityRadius: number;
  hideWhenBlockingOverlayOpen: boolean;
  fallbackTaskLabel: string;
  fallbackProjectLabel: string;
  fallbackProgressLabel: string;
};

export type EmployeeInsightProgress = {
  label: string;
  status?: TaskStatus;
  percent?: number;
};

export type EmployeeInsightMood = {
  label: string;
  tone?: "positive" | "neutral" | "strained";
};

export type EmployeeInsightPosition = {
  x: number;
  y: number;
  positionHint?: EmployeeNpcMovementPositionHint;
};

export type EmployeeInsightSource = {
  employeeId: string;
  name: string;
  role: EmployeeRole;
  aiState: EmployeeAIState;
  aiSnapshot?: EmployeeAISnapshot;
  simulationState?: EmployeeSimulationState;
  simulationSnapshot?: EmployeeSimulationSnapshot;
  currentTask?: ProjectTask;
  currentProject?: ProjectPortalProject;
  workProgress?: EmployeeInsightProgress;
  mood?: EmployeeInsightMood;
  scheduleState?: EmployeeScheduleState;
  scheduleSnapshot?: EmployeeDailyScheduleSnapshot;
  movementPosition?: EmployeeInsightPosition;
  movementSnapshot?: EmployeeNpcMovementSnapshot;
  workstationState?: WorkstationState;
  workstationSnapshot?: WorkstationSnapshot;
  companyProgression?: CompanyProgressionSnapshot;
};

export type EmployeeInsightTarget = {
  employeeId: string;
  distance: number;
  source: EmployeeInsightSource;
};

export type EmployeeInsightViewModel = {
  employeeId: string;
  titleName: string;
  roleLabel: string;
  aiStateLabel: string;
  taskLabel: string;
  progressLabel: string;
  projectLabel: string;
  moodLabel?: string;
  thinkingText: string;
  distance: number;
};

export type EmployeeInsightState = {
  target?: EmployeeInsightTarget;
  viewModel?: EmployeeInsightViewModel;
};

export type EmployeeInsightStateOptions = {
  isBlockingOverlayOpen?: boolean;
};

export type EmployeeInsightPlayerPosition = {
  x: number;
  y: number;
};

// Passive observation only: dialogue systems may consume similar context later, but insight owns no dialogue flow.
export type EmployeeInsightThinkingText = string;
