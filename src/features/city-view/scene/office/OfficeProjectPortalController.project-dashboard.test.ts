import { describe, expect, it, vi } from "vitest";

import { AIProjectManagerService } from "./ai/AIProjectManagerService";
import { createMockAIService } from "./ai/MockAIServiceFactory";
import { InternalSimulationDashboardProvider } from "./dashboard/InternalSimulationDashboardProvider";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { InternalSimulationProjectDashboardProvider } from "./project-dashboard/InternalSimulationProjectDashboardProvider";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController project dashboard", () => {
  it("opens a selected project dashboard from the Company Dashboard flow", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = 0;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(state.projectDashboardSnapshot?.project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
      isAvailable: true,
    });
    expect(state.taskCollections["daily-proof"]?.tasks.map((task) => task.id)).toEqual(["task-dashboard"]);
    expect(internals.view.render).toHaveBeenCalled();
  });

  it("returns from Project Dashboard to Company Dashboard without losing runtime project data", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.viewMode).toBe("project-dashboard");

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("list");
    expect(state.selectedProjectDashboardProjectId).toBeUndefined();
    expect(state.projectDashboardSnapshot).toBeUndefined();
    expect(state.taskCollections["daily-proof"]?.tasks.map((task) => task.id)).toEqual(["task-dashboard"]);
    expect(state.companyDashboardSnapshot?.projects.projects.map((project) => project.projectId)).toContain("daily-proof");
  });

  it("derives an unavailable snapshot when the selected project is missing", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    const snapshot = controller.getProjectDashboardSnapshot("missing-project");

    expect(snapshot.project).toMatchObject({
      projectId: "missing-project",
      name: "Project unavailable",
      isAvailable: false,
    });
    expect(state.projectDashboardSnapshot).toBe(snapshot);
  });

  it("preserves existing detail and workspace state when opening project dashboard is not requested", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "detail";
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("list");
    expect(state.selectedProjectDashboardProjectId).toBeUndefined();
    expect(state.projectDashboardSnapshot).toBeUndefined();
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  view: {
    render: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  taskService: {
    getTaskCollection: ReturnType<typeof vi.fn>;
  };
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  companyProgressionService: CompanyProgressionService;
  officeLayoutService: OfficeLayoutService;
  companyDashboardProvider: InternalSimulationDashboardProvider;
  projectDashboardProvider: InternalSimulationProjectDashboardProvider;
  companyInfluencePlanningService: CompanyInfluencePlanningService;
  aiService: ReturnType<typeof createMockAIService>;
  aiProjectManagerService: AIProjectManagerService;
  repositoryRequestVersion: number;
  taskRequestVersion: number;
  employeeRequestVersion: number;
  employeeNpcBootstrapRequestVersion: number;
  taskAnalysisRequestVersion: number;
  employeeRecommendationRequestVersion: number;
  projectManagerRequestVersion: number;
};

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = getControllerInternals(controller);

  harness.state = state;
  harness.view = {
    render: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  };
  harness.taskService = {
    getTaskCollection: vi.fn(async () => createTaskCollection()),
  };
  harness.employeeAIService = new EmployeeAIService();
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();
  harness.companyProgressionService = new CompanyProgressionService();
  harness.officeLayoutService = new OfficeLayoutService();
  harness.companyDashboardProvider = new InternalSimulationDashboardProvider();
  harness.projectDashboardProvider = new InternalSimulationProjectDashboardProvider();
  harness.companyInfluencePlanningService = new CompanyInfluencePlanningService();
  harness.aiService = createMockAIService();
  harness.aiProjectManagerService = new AIProjectManagerService(harness.aiService);
  harness.repositoryRequestVersion = 0;
  harness.taskRequestVersion = 0;
  harness.employeeRequestVersion = 0;
  harness.employeeNpcBootstrapRequestVersion = 0;
  harness.taskAnalysisRequestVersion = 0;
  harness.employeeRecommendationRequestVersion = 0;
  harness.projectManagerRequestVersion = 0;

  return controller;
}

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    ...overrides,
  };
}

function createTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      description: "Read-only project detail slice.",
      status: "In Progress",
      priority: "High",
      projectId: "daily-proof",
      createdAt: "2026-01-01T09:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
