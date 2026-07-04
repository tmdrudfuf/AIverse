import { describe, expect, it, vi } from "vitest";

import { createMockAIService } from "./ai/MockAIServiceFactory";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { Employee } from "./employees/EmployeeTypes";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { MockWorkSessionProvider } from "./work-sessions/MockWorkSessionProvider";
import { WorkSessionService } from "./work-sessions/WorkSessionService";

describe("OfficeProjectPortalController work simulation", () => {
  it("starts placeholder work for a Todo task assigned by name without an assigneeId", async () => {
    const state = createWorkSimulationState(createTask({
      id: "task-assignee-name",
      status: "Todo",
      assignee: "Alex Assigned",
    }));
    const controller = createControllerHarness(state);

    await startPlaceholderWork(controller);

    const task = expectDefined(state.taskCollections["daily-proof"]?.tasks[0]);
    expect(task).toMatchObject({
      id: "task-assignee-name",
      status: "In Progress",
    });
    expect(task.activityLog?.[0]).toMatchObject({
      type: "work_started",
      actorId: "employee-assigned",
      actorName: "Alex Assigned",
    });
    expect(state.workSessions["task-assignee-name"]?.[0]).toMatchObject({
      taskId: "task-assignee-name",
      employeeId: "employee-assigned",
      employeeName: "Alex Assigned",
      status: "running",
    });
  });

  it("records placeholder work for assigned non-Todo tasks while preserving status", async () => {
    const state = createWorkSimulationState(createTask({
      id: "task-review",
      status: "Review",
      assignee: "Alex Assigned",
      assigneeId: "employee-assigned",
    }));
    const controller = createControllerHarness(state);

    await startPlaceholderWork(controller);

    const task = expectDefined(state.taskCollections["daily-proof"]?.tasks[0]);
    expect(task).toMatchObject({
      id: "task-review",
      status: "Review",
    });
    expect(task.activityLog?.[0]).toMatchObject({
      type: "work_started",
      actorId: "employee-assigned",
      actorName: "Alex Assigned",
    });
    expect(state.workSessions["task-review"]?.[0]).toMatchObject({
      taskId: "task-review",
      employeeId: "employee-assigned",
      employeeName: "Alex Assigned",
      status: "running",
    });
  });
});

type ControllerHarness = {
  state: ProjectPortalState;
  view: { render: ReturnType<typeof vi.fn> };
  workSessionService: WorkSessionService;
  aiService: ReturnType<typeof createMockAIService>;
  employeeSimulationService: EmployeeSimulationService;
  aiProjectManagerService: {
    createProjectManagementSuggestion: ReturnType<typeof vi.fn>;
  };
  startPlaceholderWorkOnSelectedTask: () => Promise<void>;
};

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as unknown as ControllerHarness;
  controller.state = state;
  controller.view = { render: vi.fn() };
  controller.workSessionService = new WorkSessionService(new MockWorkSessionProvider());
  controller.aiService = createMockAIService();
  controller.employeeSimulationService = new EmployeeSimulationService();
  controller.aiProjectManagerService = {
    createProjectManagementSuggestion: vi.fn(async () => ({
      projectId: "daily-proof",
      healthSummary: {
        projectId: "daily-proof",
        status: "healthy",
        summary: "Placeholder work is running.",
        totalTasks: 1,
        activeTasks: 1,
        completedTasks: 0,
        activeEmployees: 1,
        recentActivityCount: 1,
      },
      risks: [],
      nextAction: {
        projectId: "daily-proof",
        action: "Continue placeholder work",
        reason: "A placeholder work session was started.",
      },
      createdAt: "2026-07-05T00:00:00.000Z",
    })),
  };

  return controller as unknown as OfficeProjectPortalController;
}

async function startPlaceholderWork(controller: OfficeProjectPortalController) {
  await (controller as unknown as ControllerHarness).startPlaceholderWorkOnSelectedTask();
}

function createWorkSimulationState(task: ProjectTask) {
  const state = createProjectPortalState();
  state.isOpen = true;
  state.viewMode = "task-detail";
  state.selectedProjectId = "daily-proof";
  state.selectedTaskProjectId = "daily-proof";
  state.selectedTaskId = task.id;
  state.selectedTaskIndex = 0;
  state.employees = [createEmployee()];
  state.taskCollections["daily-proof"] = {
    projectId: "daily-proof",
    tasks: [task],
  };

  return state;
}

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "employee-assigned",
    name: "Alex Assigned",
    role: "Engineer",
    status: "Working",
    avatarColor: "#64748b",
    capabilities: ["TypeScript"],
    description: "Employee assigned to placeholder work tests.",
    ...overrides,
  };
}

function createTask(overrides: Partial<ProjectTask> & Pick<ProjectTask, "id" | "status">): ProjectTask {
  return {
    title: "Run placeholder work",
    description: "Task used by work simulation tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-07-05T00:00:00.000Z",
    updatedAt: "2026-07-05T00:00:00.000Z",
    ...overrides,
  };
}

function expectDefined<T>(value: T | undefined): T {
  expect(value).toBeDefined();
  return value as T;
}
