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

function createContext(options: {
  employeeId?: string;
  isConversationActive?: boolean;
  movementState?: EmployeeNpcMovementState;
  scheduleState?: EmployeeScheduleState;
  simulationState?: EmployeeSimulationState;
  targetZone?: OfficeNpcLogicalPosition;
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
    simulationSnapshot: options.simulationState
      ? {
          employeeId,
          currentState: options.simulationState,
          lastStateChangeAt: "2026-01-01T09:00:00.000Z",
          displayLabel: `${employeeId} ${options.simulationState}`,
        }
      : undefined,
    updatedAt: "2026-01-01T09:00:00.000Z",
  };
}
