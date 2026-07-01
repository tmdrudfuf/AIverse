import type {
  EmployeeAIConfig,
  EmployeeAIContext,
  EmployeeAISnapshot,
  EmployeeAIState,
  EmployeeAITransition,
  EmployeeAIUpdateResult,
} from "./EmployeeAITypes";
import type { EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";

const DEFAULT_ALLOWED_TRANSITIONS: Record<EmployeeAIState, EmployeeAIState[]> = {
  idle: ["walking", "working", "talking", "taking_break", "going_home"],
  walking: ["idle", "working", "talking", "taking_break", "going_home"],
  working: ["idle", "walking", "talking", "taking_break", "going_home"],
  talking: ["idle", "walking", "working", "taking_break", "going_home"],
  taking_break: ["idle", "walking", "working", "talking", "going_home"],
  going_home: ["idle", "walking", "working", "talking", "taking_break"],
};

const DEFAULT_BREAK_SCHEDULE_STATES: EmployeeScheduleState[] = ["onBreak", "atLunch"];
const DEFAULT_GOING_HOME_SCHEDULE_STATES: EmployeeScheduleState[] = ["leaving", "offDuty"];
const DEFAULT_AI_TIMESTAMP = "2026-01-01T00:00:00.000Z";

export class EmployeeAIService {
  private readonly config: Required<EmployeeAIConfig>;
  private snapshots: Record<string, EmployeeAISnapshot> = {};

  constructor(config: EmployeeAIConfig = {}) {
    this.config = {
      allowedTransitions: {
        ...DEFAULT_ALLOWED_TRANSITIONS,
        ...config.allowedTransitions,
      },
      breakScheduleStates: config.breakScheduleStates ?? DEFAULT_BREAK_SCHEDULE_STATES,
      goingHomeScheduleStates: config.goingHomeScheduleStates ?? DEFAULT_GOING_HOME_SCHEDULE_STATES,
    };
  }

  createInitialState(context: EmployeeAIContext): EmployeeAISnapshot {
    const updatedAt = context.updatedAt ?? DEFAULT_AI_TIMESTAMP;
    const currentState = resolveStateFromContext(context, this.config);
    const snapshot = createSnapshot(context, currentState, undefined, undefined, updatedAt);

    this.snapshots[context.employeeId] = snapshot;
    return cloneSnapshot(snapshot);
  }

  getCurrentState(employeeId: string): EmployeeAIState | undefined {
    return this.snapshots[employeeId]?.currentState;
  }

  canTransitionTo(employeeId: string, nextState: EmployeeAIState): boolean {
    const currentState = this.getCurrentState(employeeId);
    if (!currentState) return false;
    if (currentState === nextState) return true;

    return this.config.allowedTransitions[currentState]?.includes(nextState) ?? false;
  }

  transitionTo(
    employeeId: string,
    nextState: EmployeeAIState,
    context: EmployeeAIContext = { employeeId },
    reason = "manual_transition",
  ): EmployeeAIUpdateResult {
    const currentSnapshot = this.snapshots[employeeId] ?? this.createInitialState({ ...context, employeeId });
    const updatedAt = context.updatedAt ?? DEFAULT_AI_TIMESTAMP;
    const transition = createTransition(employeeId, currentSnapshot.currentState, nextState, reason, updatedAt);

    if (!this.canTransitionTo(employeeId, nextState)) {
      const rejectedTransition = {
        ...transition,
        accepted: false,
      };
      return {
        employeeId,
        snapshot: cloneSnapshot(currentSnapshot),
        rejectedTransition,
      };
    }

    const acceptedTransition = {
      ...transition,
      accepted: true,
    };
    const snapshot = createSnapshot(context, nextState, currentSnapshot.currentState, acceptedTransition, updatedAt);

    this.snapshots[employeeId] = snapshot;
    return {
      employeeId,
      snapshot: cloneSnapshot(snapshot),
      transition: { ...acceptedTransition },
    };
  }

  update(context: EmployeeAIContext): EmployeeAIUpdateResult {
    const currentSnapshot = this.snapshots[context.employeeId] ?? this.createInitialState(context);
    const nextState = resolveStateFromContext(context, this.config);

    if (currentSnapshot.currentState === nextState) {
      const updatedAt = context.updatedAt ?? currentSnapshot.lastUpdatedAt;
      const snapshot = createSnapshot(
        context,
        currentSnapshot.currentState,
        currentSnapshot.previousState,
        currentSnapshot.lastTransition,
        updatedAt,
      );
      this.snapshots[context.employeeId] = snapshot;
      return {
        employeeId: context.employeeId,
        snapshot: cloneSnapshot(snapshot),
      };
    }

    return this.transitionTo(context.employeeId, nextState, context, "context_update");
  }

  updateMany(contexts: ReadonlyArray<EmployeeAIContext>): ReadonlyArray<EmployeeAIUpdateResult> {
    return contexts
      .slice()
      .sort((left, right) => left.employeeId.localeCompare(right.employeeId))
      .map((context) => this.update(context));
  }

  getSnapshots(): ReadonlyArray<EmployeeAISnapshot> {
    return Object.values(this.snapshots)
      .sort((left, right) => left.employeeId.localeCompare(right.employeeId))
      .map(cloneSnapshot);
  }
}

function resolveStateFromContext(
  context: EmployeeAIContext,
  config: Required<EmployeeAIConfig>,
): EmployeeAIState {
  if (context.movementSnapshot?.movementState === "moving") return "walking";
  if (context.isConversationActive) return "talking";

  const scheduleState = context.scheduleSnapshot?.scheduleState;
  if (scheduleState && config.goingHomeScheduleStates.includes(scheduleState)) return "going_home";
  if (scheduleState && config.breakScheduleStates.includes(scheduleState)) return "taking_break";

  if (context.simulationSnapshot?.currentState === "working") return "working";
  if (context.simulationSnapshot?.currentState === "unavailable") return "going_home";
  if (context.movementSnapshot?.targetPosition.zone === "breakArea") return "taking_break";

  return "idle";
}

function createSnapshot(
  context: EmployeeAIContext,
  currentState: EmployeeAIState,
  previousState: EmployeeAIState | undefined,
  lastTransition: EmployeeAITransition | undefined,
  updatedAt: string,
): EmployeeAISnapshot {
  return {
    employeeId: context.employeeId,
    currentState,
    previousState,
    lastTransition,
    lastUpdatedAt: updatedAt,
    contextSummary: {
      simulationState: context.simulationSnapshot?.currentState,
      movementZone: context.movementSnapshot?.positionHint.zone,
      movementState: context.movementSnapshot?.movementState,
      scheduleState: context.scheduleSnapshot?.scheduleState,
      layoutId: context.officeLayout?.layoutId,
      companyLevel: context.companyProgression?.companyLevel,
    },
  };
}

function createTransition(
  employeeId: string,
  fromState: EmployeeAIState,
  toState: EmployeeAIState,
  reason: string,
  occurredAt: string,
): EmployeeAITransition {
  return {
    employeeId,
    fromState,
    toState,
    reason,
    occurredAt,
    accepted: true,
  };
}

function cloneSnapshot(snapshot: EmployeeAISnapshot): EmployeeAISnapshot {
  return {
    ...snapshot,
    lastTransition: snapshot.lastTransition ? { ...snapshot.lastTransition } : undefined,
    contextSummary: { ...snapshot.contextSummary },
  };
}
