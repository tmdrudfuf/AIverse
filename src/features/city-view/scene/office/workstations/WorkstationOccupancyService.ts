import type { EmployeeSimulationSnapshot } from "../employees/EmployeeSimulationTypes";
import type { WorkstationSnapshot, WorkstationState } from "./WorkstationTypes";

const WORKSTATION_COUNT = 4;
const WORKSTATION_IDS = Array.from({ length: WORKSTATION_COUNT }, (_, index) => `workstation-${index + 1}`);

export class WorkstationOccupancyService {
  private readonly employeeAssignments: Record<string, string> = {};
  private snapshots: Record<string, WorkstationSnapshot> = createAvailableWorkstations();

  deriveSnapshots(employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>): Record<string, WorkstationSnapshot> {
    const activeEmployees = employeeSnapshots
      .filter((snapshot) => snapshot.currentState === "assigned" || snapshot.currentState === "working")
      .sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const activeEmployeeIds = new Set(activeEmployees.map((snapshot) => snapshot.employeeId));

    Object.keys(this.employeeAssignments).forEach((employeeId) => {
      if (!activeEmployeeIds.has(employeeId)) delete this.employeeAssignments[employeeId];
    });

    activeEmployees.forEach((snapshot) => {
      if (this.employeeAssignments[snapshot.employeeId]) return;

      const workstationId = this.findAvailableWorkstationId();
      if (workstationId) this.employeeAssignments[snapshot.employeeId] = workstationId;
    });

    const nextSnapshots = createAvailableWorkstations();
    activeEmployees.forEach((snapshot) => {
      const workstationId = this.employeeAssignments[snapshot.employeeId];
      if (!workstationId) return;

      const workstation = nextSnapshots[workstationId];
      if (!workstation || workstation.state === "unavailable") return;

      nextSnapshots[workstationId] = {
        ...workstation,
        assignedEmployeeId: snapshot.employeeId,
        occupiedByEmployeeId: snapshot.currentState === "working" ? snapshot.employeeId : undefined,
        currentTaskId: snapshot.currentTaskId,
        state: getWorkstationState(snapshot.currentState),
      };
    });

    this.snapshots = nextSnapshots;
    return this.cloneSnapshots();
  }

  getSnapshots(): ReadonlyArray<WorkstationSnapshot> {
    return Object.values(this.cloneSnapshots());
  }

  private findAvailableWorkstationId() {
    const assignedWorkstationIds = new Set(Object.values(this.employeeAssignments));
    return WORKSTATION_IDS.find((workstationId) => !assignedWorkstationIds.has(workstationId));
  }

  private cloneSnapshots() {
    return Object.fromEntries(
      Object.entries(this.snapshots).map(([workstationId, snapshot]) => [
        workstationId,
        {
          ...snapshot,
          positionHint: { ...snapshot.positionHint },
        },
      ]),
    );
  }
}

function createAvailableWorkstations(): Record<string, WorkstationSnapshot> {
  return Object.fromEntries(
    WORKSTATION_IDS.map((workstationId, index) => [
      workstationId,
      {
        workstationId,
        label: `Workstation ${index + 1}`,
        positionHint: {
          zone: "workstation" as const,
          slot: index,
        },
        state: "available" as const,
      },
    ]),
  );
}

function getWorkstationState(employeeState: EmployeeSimulationSnapshot["currentState"]): WorkstationState {
  if (employeeState === "working") return "occupied";
  return "reserved";
}
