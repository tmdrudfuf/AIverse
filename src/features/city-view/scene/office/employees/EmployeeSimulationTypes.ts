export type EmployeeSimulationState = "idle" | "assigned" | "working" | "unavailable";

export type EmployeeSimulationSnapshot = {
  employeeId: string;
  currentState: EmployeeSimulationState;
  currentTaskId?: string;
  currentProjectId?: string;
  lastStateChangeAt: string;
  displayLabel: string;
};