import { describe, expect, it } from "vitest";

import { EmployeeInsightService } from "./EmployeeInsightService";
import type { EmployeeInsightSource } from "./EmployeeInsightTypes";
import type { TaskStatus } from "../tasks/ProjectTaskTypes";

describe("EmployeeInsightService nearest target selection", () => {
  it("selects the nearest employee inside the configured radius", () => {
    const service = new EmployeeInsightService({ proximityRadius: 8 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [
        createSource({ employeeId: "employee-far", movementPosition: { x: 7, y: 0 } }),
        createSource({ employeeId: "employee-near", movementPosition: { x: 3, y: 4 } }),
      ],
    );

    expect(state.target?.employeeId).toBe("employee-near");
    expect(state.target?.distance).toBe(5);
    expect(state.viewModel?.titleName).toBe("Employee employee-near");
  });

  it("includes employees exactly on the configured radius boundary", () => {
    const service = new EmployeeInsightService({ proximityRadius: 5 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [createSource({ employeeId: "employee-boundary", movementPosition: { x: 3, y: 4 } })],
    );

    expect(state.target?.employeeId).toBe("employee-boundary");
    expect(state.target?.distance).toBe(5);
  });

  it("returns hidden state when all employees are outside the configured radius", () => {
    const service = new EmployeeInsightService({ proximityRadius: 4 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [createSource({ employeeId: "employee-outside", movementPosition: { x: 3, y: 4 } })],
    );

    expect(state).toEqual({});
  });

  it("resolves equal-distance ties by employee id", () => {
    const service = new EmployeeInsightService({ proximityRadius: 10 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [
        createSource({ employeeId: "employee-b", movementPosition: { x: 0, y: 6 } }),
        createSource({ employeeId: "employee-a", movementPosition: { x: 6, y: 0 } }),
      ],
    );

    expect(state.target?.employeeId).toBe("employee-a");
  });
});

describe("EmployeeInsightService view model derivation", () => {
  it("builds required card fields from source data", () => {
    const service = new EmployeeInsightService({ proximityRadius: 10 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [
        createSource({
          aiState: "working",
          currentProject: { id: "daily-proof", name: "Daily Proof" },
          currentTask: { id: "task-1", title: "Implement proximity card", status: "In Progress" },
          employeeId: "employee-1",
          mood: { label: "Focused", tone: "positive" },
          movementPosition: { x: 2, y: 0 },
          name: "Ada",
          role: "Engineer",
          workProgress: { label: "In Progress", percent: 45, status: "In Progress" },
        }),
      ],
    );

    expect(state.viewModel).toEqual({
      employeeId: "employee-1",
      titleName: "Ada",
      roleLabel: "Engineer",
      aiStateLabel: "Working",
      taskLabel: "Implement proximity card",
      progressLabel: "In Progress (45%)",
      projectLabel: "Daily Proof",
      moodLabel: "Focused",
      thinkingText: "Thinking about Implement proximity card for Daily Proof.",
      distance: 2,
    });
  });

  it("uses fallback labels and omits mood when optional data is missing", () => {
    const service = new EmployeeInsightService({
      fallbackProgressLabel: "No progress yet",
      fallbackProjectLabel: "No project",
      fallbackTaskLabel: "No task",
      proximityRadius: 10,
    });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [createSource({ aiState: "idle", employeeId: "employee-1", movementPosition: { x: 1, y: 0 } })],
    );

    expect(state.viewModel?.taskLabel).toBe("No task");
    expect(state.viewModel?.projectLabel).toBe("No project");
    expect(state.viewModel?.progressLabel).toBe("No progress yet");
    expect(state.viewModel?.moodLabel).toBeUndefined();
    expect(state.viewModel?.thinkingText).toBe("Thinking about the next useful task.");
  });

  it("creates a short non-dialogue Thinking sentence from AI state when no task exists", () => {
    const service = new EmployeeInsightService({ proximityRadius: 10 });

    const state = service.getInsightState(
      { x: 0, y: 0 },
      [createSource({ aiState: "taking_break", employeeId: "employee-break", movementPosition: { x: 1, y: 0 } })],
    );

    expect(state.viewModel?.thinkingText).toBe("Thinking about recharging before the next focus block.");
    expect(state.viewModel?.thinkingText).not.toContain("\"");
    expect(state.viewModel?.thinkingText).not.toContain("I'm");
  });
});

function createSource(options: {
  aiState?: EmployeeInsightSource["aiState"];
  currentProject?: { id: string; name: string };
  currentTask?: { id: string; title: string; status: TaskStatus };
  employeeId: string;
  mood?: EmployeeInsightSource["mood"];
  movementPosition: { x: number; y: number };
  name?: string;
  role?: EmployeeInsightSource["role"];
  workProgress?: EmployeeInsightSource["workProgress"];
}): EmployeeInsightSource {
  return {
    employeeId: options.employeeId,
    name: options.name ?? `Employee ${options.employeeId}`,
    role: options.role ?? "Engineer",
    aiState: options.aiState ?? "idle",
    currentProject: options.currentProject
      ? {
          id: options.currentProject.id,
          name: options.currentProject.name,
          description: "",
          enabled: true,
          linkedServices: [],
          nextAction: { enabled: true, label: "Review project workspace", placeholder: true },
          status: "Active",
          type: "Company",
        }
      : undefined,
    currentTask: options.currentTask
      ? {
          id: options.currentTask.id,
          title: options.currentTask.title,
          description: "",
          status: options.currentTask.status,
          priority: "Medium",
          projectId: options.currentProject?.id ?? "daily-proof",
          createdAt: "2026-01-01T09:00:00.000Z",
          updatedAt: "2026-01-01T09:30:00.000Z",
        }
      : undefined,
    mood: options.mood,
    movementPosition: {
      x: options.movementPosition.x,
      y: options.movementPosition.y,
      positionHint: { zone: "workstation", slot: 0 },
    },
    workProgress: options.workProgress,
  };
}
