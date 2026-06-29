import type { EmployeeSimulationSnapshot, EmployeeSimulationState } from "../employees/EmployeeSimulationTypes";
import type {
  EmployeeNpcMovementPosition,
  EmployeeNpcMovementSnapshot,
  EmployeeNpcMovementState,
  OfficeNpcLogicalPosition,
} from "./EmployeeNpcMovementTypes";

const DEFAULT_MOVEMENT_SPEED = 90;
const MOVEMENT_DURATION_MS = 800;

export class EmployeeNpcMovementService {
  private snapshots: Record<string, EmployeeNpcMovementSnapshot> = {};

  deriveSnapshots(
    employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
    updatedAt = new Date().toISOString(),
  ): Record<string, EmployeeNpcMovementSnapshot> {
    const orderedSnapshots = [...employeeSnapshots].sort((left, right) => left.employeeId.localeCompare(right.employeeId));

    this.snapshots = Object.fromEntries(
      orderedSnapshots.map((snapshot, index) => {
        const previous = this.snapshots[snapshot.employeeId];
        const targetPosition = createTargetPosition(snapshot.currentState, index);
        const movement = resolveMovement(previous, targetPosition, snapshot.currentState, updatedAt);

        return [
          snapshot.employeeId,
          {
            employeeId: snapshot.employeeId,
            currentPosition: movement.currentPosition,
            targetPosition,
            movementState: movement.movementState,
            speed: previous?.speed ?? DEFAULT_MOVEMENT_SPEED,
            lastUpdatedAt: movement.lastUpdatedAt,
            positionHint: targetPosition,
          },
        ];
      }),
    );

    return this.cloneSnapshots();
  }

  getSnapshots(): ReadonlyArray<EmployeeNpcMovementSnapshot> {
    return Object.values(this.cloneSnapshots());
  }

  private cloneSnapshots() {
    return Object.fromEntries(
      Object.entries(this.snapshots).map(([employeeId, snapshot]) => [
        employeeId,
        {
          ...snapshot,
          currentPosition: { ...snapshot.currentPosition },
          targetPosition: { ...snapshot.targetPosition },
          positionHint: { ...snapshot.positionHint },
        },
      ]),
    );
  }
}

type ResolvedMovement = {
  currentPosition: EmployeeNpcMovementPosition;
  movementState: EmployeeNpcMovementState;
  lastUpdatedAt: string;
};

function createTargetPosition(state: EmployeeSimulationState, slot: number): EmployeeNpcMovementPosition {
  return {
    zone: getTargetZone(state),
    slot,
  };
}

function getTargetZone(state: EmployeeSimulationState): OfficeNpcLogicalPosition {
  if (state === "working") return "meetingArea";
  if (state === "assigned") return "workstation";
  if (state === "unavailable") return "breakArea";
  return "idleSpot";
}

function resolveMovement(
  previous: EmployeeNpcMovementSnapshot | undefined,
  targetPosition: EmployeeNpcMovementPosition,
  simulationState: EmployeeSimulationState,
  updatedAt: string,
): ResolvedMovement {
  if (!previous) {
    return {
      currentPosition: { ...targetPosition },
      movementState: getSettledMovementState(simulationState),
      lastUpdatedAt: updatedAt,
    };
  }

  if (!isSamePosition(previous.targetPosition, targetPosition)) {
    return {
      currentPosition: resolveCurrentInFlightPosition(previous, updatedAt),
      movementState: "moving",
      lastUpdatedAt: updatedAt,
    };
  }

  if (previous.movementState === "moving" && !hasMovementArrived(previous.lastUpdatedAt, updatedAt)) {
    return {
      currentPosition: { ...previous.currentPosition },
      movementState: "moving",
      lastUpdatedAt: previous.lastUpdatedAt,
    };
  }

  const settledMovementState = getSettledMovementState(simulationState);
  return {
    currentPosition: { ...targetPosition },
    movementState: settledMovementState,
    lastUpdatedAt: previous.movementState === settledMovementState ? previous.lastUpdatedAt : updatedAt,
  };
}

function resolveCurrentInFlightPosition(
  previous: EmployeeNpcMovementSnapshot,
  updatedAt: string,
): EmployeeNpcMovementPosition {
  if (previous.movementState !== "moving") return { ...previous.targetPosition };
  if (hasMovementArrived(previous.lastUpdatedAt, updatedAt)) return { ...previous.targetPosition };
  return { ...previous.currentPosition };
}

function getSettledMovementState(simulationState: EmployeeSimulationState): EmployeeNpcMovementState {
  return simulationState === "idle" ? "idle" : "arrived";
}

function hasMovementArrived(startedAt: string, updatedAt: string) {
  const startedAtMs = Date.parse(startedAt);
  const updatedAtMs = Date.parse(updatedAt);
  if (!Number.isFinite(startedAtMs) || !Number.isFinite(updatedAtMs)) return true;

  return updatedAtMs - startedAtMs >= MOVEMENT_DURATION_MS;
}

function isSamePosition(left: EmployeeNpcMovementPosition, right: EmployeeNpcMovementPosition) {
  return left.zone === right.zone && left.slot === right.slot;
}
