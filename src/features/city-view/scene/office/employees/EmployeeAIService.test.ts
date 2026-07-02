import { describe, expect, it } from "vitest";

import { EmployeeAIService } from "./EmployeeAIService";
import type { EmployeeAIContext, EmployeeAIState } from "./EmployeeAITypes";
import type { EmployeeSimulationState } from "./EmployeeSimulationTypes";
import type { EmployeeNpcMovementState, OfficeNpcLogicalPosition } from "../npc/EmployeeNpcMovementTypes";
import type { EmployeeScheduleState } from "../schedules/EmployeeDailyScheduleTypes";

describe("EmployeeAIService state resolution", () => {
  it.each([
    ["idle", createContext({ simulationState: "idle" })],
    ["walking", createContext({ movementState: "moving" })],
    ["working", createContext({ simulationState: "working" })],
    ["talking", createContext({ isConversationActive: true, movementState: "arrived" })],
    ["taking_break", createContext({ scheduleState: "onBreak" })],
    ["going_home", createContext({ scheduleState: "leaving" })],
  ] satisfies Array<[EmployeeAIState, EmployeeAIContext]>)(
    "creates an initial %s state from context",
    (expectedState, context) => {
      const service = new EmployeeAIService();

      const snapshot = service.createInitialState(context);

      expect(snapshot.currentState).toBe(expectedState);
      expect(service.getCurrentState(context.employeeId)).toBe(expectedState);
    },
  );

  it("resolves taking_break from break area movement when schedule is not on break", () => {
    const service = new EmployeeAIService();

    const snapshot = service.createInitialState(createContext({
      movementState: "arrived",
      targetZone: "breakArea",
      scheduleState: "available",
      simulationState: "idle",
    }));

    expect(snapshot.currentState).toBe("taking_break");
  });
});

describe("EmployeeAIService transition validation", () => {
  it("records accepted transition metadata", () => {
    const service = new EmployeeAIService();
    service.createInitialState(createContext({
      employeeId: "employee-transition",
      simulationState: "idle",
      updatedAt: "2026-01-01T09:00:00.000Z",
    }));

    const result = service.transitionTo(
      "employee-transition",
      "working",
      createContext({
        employeeId: "employee-transition",
        simulationState: "working",
        updatedAt: "2026-01-01T09:05:00.000Z",
      }),
      "test_transition",
    );

    expect(result.transition).toEqual({
      employeeId: "employee-transition",
      fromState: "idle",
      toState: "working",
      reason: "test_transition",
      occurredAt: "2026-01-01T09:05:00.000Z",
      accepted: true,
    });
    expect(result.snapshot.currentState).toBe("working");
    expect(result.snapshot.previousState).toBe("idle");
    expect(result.snapshot.lastTransition).toEqual(result.transition);
    expect(service.getCurrentState("employee-transition")).toBe("working");
  });

  it("preserves the current snapshot when a transition is rejected", () => {
    const service = new EmployeeAIService({
      allowedTransitions: {
        idle: ["walking"],
      },
    });
    const initialSnapshot = service.createInitialState(createContext({
      employeeId: "employee-rejected",
      simulationState: "idle",
      updatedAt: "2026-01-01T09:00:00.000Z",
    }));

    const result = service.transitionTo(
      "employee-rejected",
      "working",
      createContext({
        employeeId: "employee-rejected",
        simulationState: "working",
        updatedAt: "2026-01-01T09:10:00.000Z",
      }),
      "blocked_transition",
    );

    expect(result.transition).toBeUndefined();
    expect(result.rejectedTransition).toEqual({
      employeeId: "employee-rejected",
      fromState: "idle",
      toState: "working",
      reason: "blocked_transition",
      occurredAt: "2026-01-01T09:10:00.000Z",
      accepted: false,
    });
    expect(result.snapshot).toEqual(initialSnapshot);
    expect(service.getSnapshots()).toEqual([initialSnapshot]);
    expect(service.getCurrentState("employee-rejected")).toBe("idle");
  });

  it("rejects transition checks for unknown employees", () => {
    const service = new EmployeeAIService();

    expect(service.getCurrentState("missing-employee")).toBeUndefined();
    expect(service.canTransitionTo("missing-employee", "working")).toBe(false);
  });

  it("uses custom allowedTransitions config", () => {
    const service = new EmployeeAIService({
      allowedTransitions: {
        idle: ["talking"],
      },
    });
    service.createInitialState(createContext({
      employeeId: "employee-custom",
      simulationState: "idle",
    }));

    expect(service.canTransitionTo("employee-custom", "talking")).toBe(true);
    expect(service.canTransitionTo("employee-custom", "working")).toBe(false);
  });
});

describe("EmployeeAIService snapshot stability", () => {
  it("captures context summaries and context-provided timestamps", () => {
    const service = new EmployeeAIService();

    const snapshot = service.createInitialState(createContext({
      companyLevel: 2,
      employeeId: "employee-summary",
      layoutId: "layout-small-office",
      movementState: "arrived",
      scheduleState: "focused",
      simulationState: "working",
      targetZone: "workstation",
      updatedAt: "2026-01-01T10:15:00.000Z",
    }));

    expect(snapshot.lastUpdatedAt).toBe("2026-01-01T10:15:00.000Z");
    expect(snapshot.contextSummary).toEqual({
      simulationState: "working",
      movementZone: "workstation",
      movementState: "arrived",
      scheduleState: "focused",
      layoutId: "layout-small-office",
      companyLevel: 2,
    });
  });

  it("uses the default timestamp when context has none", () => {
    const service = new EmployeeAIService();

    const snapshot = service.createInitialState(createContext({
      simulationState: "idle",
      updatedAt: undefined,
    }));

    expect(snapshot.lastUpdatedAt).toBe("2026-01-01T00:00:00.000Z");
  });

  it("keeps the previous timestamp when updating the same state without a new timestamp", () => {
    const service = new EmployeeAIService();
    service.createInitialState(createContext({
      employeeId: "employee-same-state",
      simulationState: "idle",
      updatedAt: "2026-01-01T11:00:00.000Z",
    }));

    const result = service.update(createContext({
      employeeId: "employee-same-state",
      scheduleState: "available",
      simulationState: "idle",
      updatedAt: undefined,
    }));

    expect(result.snapshot.lastUpdatedAt).toBe("2026-01-01T11:00:00.000Z");
  });

  it("sorts updateMany results and snapshots by employee id", () => {
    const service = new EmployeeAIService();

    const results = service.updateMany([
      createContext({ employeeId: "employee-c", simulationState: "working" }),
      createContext({ employeeId: "employee-a", movementState: "moving" }),
      createContext({ employeeId: "employee-b", scheduleState: "leaving" }),
    ]);

    expect(results.map((result) => result.employeeId)).toEqual(["employee-a", "employee-b", "employee-c"]);
    expect(service.getSnapshots().map((snapshot) => snapshot.employeeId)).toEqual([
      "employee-a",
      "employee-b",
      "employee-c",
    ]);
  });

  it("returns cloned snapshots, transitions, and context summaries", () => {
    const service = new EmployeeAIService();
    const initialSnapshot = service.createInitialState(createContext({
      employeeId: "employee-clone",
      simulationState: "idle",
    }));
    const transitionResult = service.transitionTo(
      "employee-clone",
      "working",
      createContext({
        employeeId: "employee-clone",
        simulationState: "working",
        updatedAt: "2026-01-01T12:00:00.000Z",
      }),
    );

    initialSnapshot.contextSummary.simulationState = "working";
    if (transitionResult.snapshot.lastTransition) {
      transitionResult.snapshot.lastTransition.reason = "mutated";
    }
    transitionResult.snapshot.contextSummary.simulationState = "idle";

    const storedSnapshot = service.getSnapshots()[0];

    expect(storedSnapshot.currentState).toBe("working");
    expect(storedSnapshot.lastTransition?.reason).toBe("manual_transition");
    expect(storedSnapshot.contextSummary.simulationState).toBe("working");
    expect(storedSnapshot.contextSummary).not.toBe(transitionResult.snapshot.contextSummary);
    expect(storedSnapshot.lastTransition).not.toBe(transitionResult.snapshot.lastTransition);
  });
});

function createContext(options: {
  companyLevel?: number;
  employeeId?: string;
  isConversationActive?: boolean;
  layoutId?: string;
  movementState?: EmployeeNpcMovementState;
  scheduleState?: EmployeeScheduleState;
  simulationState?: EmployeeSimulationState;
  targetZone?: OfficeNpcLogicalPosition;
  updatedAt?: string;
}): EmployeeAIContext {
  const employeeId = options.employeeId ?? "employee-1";

  return {
    employeeId,
    isConversationActive: options.isConversationActive,
    movementSnapshot: options.movementState
      ? {
          employeeId,
          currentPosition: { zone: options.targetZone ?? "idleSpot", slot: 0 },
          targetPosition: { zone: options.targetZone ?? "idleSpot", slot: 0 },
          movementState: options.movementState,
          speed: 90,
          lastUpdatedAt: "2026-01-01T09:00:00.000Z",
          positionHint: { zone: options.targetZone ?? "idleSpot", slot: 0 },
        }
      : undefined,
    scheduleSnapshot: options.scheduleState
      ? {
          employeeId,
          scheduleId: `schedule-${employeeId}`,
          scheduleState: options.scheduleState,
          workdayTime: 600,
          lastUpdatedAt: "2026-01-01T09:00:00.000Z",
          positionIntent: { zone: options.targetZone ?? "idleSpot" },
        }
      : undefined,
    companyProgression: options.companyLevel
      ? {
          companyLevel: options.companyLevel,
          companyStage: "smallOffice",
          floorCount: 1,
          layoutId: options.layoutId ?? "layout-small-office",
          maxEmployees: 8,
          requiredMilestones: [],
          unlockedOfficeZones: [],
        }
      : undefined,
    officeLayout: options.layoutId
      ? {
          layoutId: options.layoutId,
          stage: "smallOffice",
          floorId: "floor-1",
          zones: [],
          furnitureSlots: [],
          workstationSlots: [],
          meetingSlots: [],
          breakAreaSlots: [],
          entryExitPoints: [],
        }
      : undefined,
    simulationSnapshot: options.simulationState
      ? {
          employeeId,
          currentState: options.simulationState,
          lastStateChangeAt: "2026-01-01T09:00:00.000Z",
          displayLabel: `${employeeId} ${options.simulationState}`,
        }
      : undefined,
    updatedAt: options.updatedAt,
  };
}
