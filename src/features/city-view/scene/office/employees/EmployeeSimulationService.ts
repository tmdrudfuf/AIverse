import type { ProjectTask } from "../tasks/ProjectTaskTypes";
import type { WorkSession } from "../work-sessions/WorkSessionTypes";
import type { Employee } from "./EmployeeTypes";
import type { EmployeeSimulationSnapshot, EmployeeSimulationState } from "./EmployeeSimulationTypes";

export class EmployeeSimulationService {
  deriveSnapshots(
    employees: Employee[],
    tasks: ProjectTask[],
    workSessions: Record<string, WorkSession[]>,
    previousSnapshots: Record<string, EmployeeSimulationSnapshot> = {},
    changedAt = new Date().toISOString(),
  ): Record<string, EmployeeSimulationSnapshot> {
    return Object.fromEntries(
      employees.map((employee) => {
        const activeTask = findActiveTaskForEmployee(employee, tasks);
        const runningSession = activeTask ? findRunningSessionForTask(employee, activeTask, workSessions) : undefined;
        const currentState = getSimulationState(employee, activeTask, runningSession);
        const previousSnapshot = previousSnapshots[employee.id];
        const lastStateChangeAt = previousSnapshot?.currentState === currentState
          ? previousSnapshot.lastStateChangeAt
          : changedAt;

        return [
          employee.id,
          {
            employeeId: employee.id,
            currentState,
            currentTaskId: activeTask?.id,
            currentProjectId: activeTask?.projectId ?? employee.currentProjectId,
            lastStateChangeAt,
            displayLabel: getDisplayLabel(employee, currentState),
          },
        ];
      }),
    );
  }

  updateForTaskAssigned(
    employees: Employee[],
    tasks: ProjectTask[],
    workSessions: Record<string, WorkSession[]>,
    previousSnapshots: Record<string, EmployeeSimulationSnapshot>,
    changedAt?: string,
  ) {
    return this.deriveSnapshots(employees, tasks, workSessions, previousSnapshots, changedAt);
  }

  updateForWorkStarted(
    employees: Employee[],
    tasks: ProjectTask[],
    workSessions: Record<string, WorkSession[]>,
    previousSnapshots: Record<string, EmployeeSimulationSnapshot>,
    changedAt?: string,
  ) {
    return this.deriveSnapshots(employees, tasks, workSessions, previousSnapshots, changedAt);
  }

  updateForWorkCompleted(
    employees: Employee[],
    tasks: ProjectTask[],
    workSessions: Record<string, WorkSession[]>,
    previousSnapshots: Record<string, EmployeeSimulationSnapshot>,
    changedAt?: string,
  ) {
    return this.deriveSnapshots(employees, tasks, workSessions, previousSnapshots, changedAt);
  }

  getSnapshots(snapshots: Record<string, EmployeeSimulationSnapshot>): ReadonlyArray<EmployeeSimulationSnapshot> {
    return Object.values(snapshots).map((snapshot) => ({ ...snapshot }));
  }
}

function findActiveTaskForEmployee(employee: Employee, tasks: ProjectTask[]) {
  return tasks.find((task) => task.status !== "Done" && (task.assigneeId === employee.id || task.assignee === employee.name));
}

function findRunningSessionForTask(
  employee: Employee,
  task: ProjectTask,
  workSessions: Record<string, WorkSession[]>,
) {
  return workSessions[task.id]?.find(
    (session) => session.status === "running" && (session.employeeId === employee.id || session.employeeName === employee.name),
  );
}

function getSimulationState(
  employee: Employee,
  activeTask: ProjectTask | undefined,
  runningSession: WorkSession | undefined,
): EmployeeSimulationState {
  if (employee.status === "Offline") return "unavailable";
  if (runningSession || activeTask?.status === "In Progress" || activeTask?.status === "Review") return "working";
  if (activeTask || employee.assignedTaskId) return "assigned";
  return "idle";
}

function getDisplayLabel(employee: Employee, currentState: EmployeeSimulationState) {
  if (currentState === "working") return `${employee.name} - Working`;
  if (currentState === "assigned") return `${employee.name} - Assigned`;
  if (currentState === "unavailable") return `${employee.name} - Unavailable`;
  return `${employee.name} - Idle`;
}