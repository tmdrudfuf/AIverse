import type { EmployeeSimulationSnapshot } from "../employees/EmployeeSimulationTypes";
import type { WorkstationSnapshot, WorkstationState } from "./WorkstationTypes";

const WORKSTATION_COUNT = 4;
const WORKSTATION_IDS = Array.from({ length: WORKSTATION_COUNT }, (_, index) => `workstation-${index + 1}`);

export class WorkstationOccupancyService {
  private readonly employeeAssignments: Record<string, string> = {};
  private snapshots: Record<string, WorkstationSnapshot> = createAvailableWorkstations();

  deriveSnapshots(employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>): Record<string, WorkstationSnapshot> {
    const nextState = createWorkstationSnapshotState(employeeSnapshots, this.employeeAssignments);

    replaceAssignments(this.employeeAssignments, nextState.employeeAssignments);
    this.snapshots = nextState.snapshots;
    return this.cloneSnapshots();
  }

  previewSnapshots(employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>): ReadonlyArray<WorkstationSnapshot> {
    const nextState = createWorkstationSnapshotState(employeeSnapshots, { ...this.employeeAssignments });
    return Object.values(cloneSnapshots(nextState.snapshots));
  }

  getSnapshots(): ReadonlyArray<WorkstationSnapshot> {
    return Object.values(this.cloneSnapshots());
  }

  private cloneSnapshots() {
    return cloneSnapshots(this.snapshots);
  }
}

type WorkstationSnapshotState = {
  employeeAssignments: Record<string, string>;
  snapshots: Record<string, WorkstationSnapshot>;
};

function createWorkstationSnapshotState(
  employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
  existingAssignments: Record<string, string>,
): WorkstationSnapshotState {
  const employeeAssignments = { ...existingAssignments };
  const activeEmployees = employeeSnapshots
    .filter((snapshot) => snapshot.currentState === "assigned" || snapshot.currentState === "working")
    .sort((left, right) => left.employeeId.localeCompare(right.employeeId));
  const activeEmployeeIds = new Set(activeEmployees.map((snapshot) => snapshot.employeeId));

  Object.keys(employeeAssignments).forEach((employeeId) => {
    if (!activeEmployeeIds.has(employeeId)) delete employeeAssignments[employeeId];
  });

  activeEmployees.forEach((snapshot) => {
    if (employeeAssignments[snapshot.employeeId]) return;

    const workstationId = findAvailableWorkstationId(employeeAssignments);
    if (workstationId) employeeAssignments[snapshot.employeeId] = workstationId;
  });

  const snapshots = createAvailableWorkstations();
  activeEmployees.forEach((snapshot) => {
    const workstationId = employeeAssignments[snapshot.employeeId];
    if (!workstationId) return;

    const workstation = snapshots[workstationId];
    if (!workstation || workstation.state === "unavailable") return;

    snapshots[workstationId] = {
      ...workstation,
      assignedEmployeeId: snapshot.employeeId,
      occupiedByEmployeeId: snapshot.currentState === "working" ? snapshot.employeeId : undefined,
      currentTaskId: snapshot.currentTaskId,
      state: getWorkstationState(snapshot.currentState),
    };
  });

  return {
    employeeAssignments,
    snapshots,
  };
}

function replaceAssignments(target: Record<string, string>, nextAssignments: Record<string, string>) {
  Object.keys(target).forEach((employeeId) => delete target[employeeId]);
  Object.entries(nextAssignments).forEach(([employeeId, workstationId]) => {
    target[employeeId] = workstationId;
  });
}

function findAvailableWorkstationId(employeeAssignments: Record<string, string>) {
  const assignedWorkstationIds = new Set(Object.values(employeeAssignments));
  return WORKSTATION_IDS.find((workstationId) => !assignedWorkstationIds.has(workstationId));
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

function cloneSnapshots(snapshots: Record<string, WorkstationSnapshot>) {
  return Object.fromEntries(
    Object.entries(snapshots).map(([workstationId, snapshot]) => [
      workstationId,
      {
        ...snapshot,
        positionHint: { ...snapshot.positionHint },
      },
    ]),
  );
}

function getWorkstationState(employeeState: EmployeeSimulationSnapshot["currentState"]): WorkstationState {
  if (employeeState === "working") return "occupied";
  return "reserved";
}
