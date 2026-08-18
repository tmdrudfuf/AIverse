import { describe, expect, it, vi } from "vitest";

import { createMockAIService } from "./ai/MockAIServiceFactory";
import { InternalSimulationDashboardProvider } from "./dashboard/InternalSimulationDashboardProvider";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import { EmployeeRecruitmentService, FIFTH_EMPLOYEE_ID } from "./employees/EmployeeRecruitmentService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { InternalSimulationProjectDashboardProvider } from "./project-dashboard/InternalSimulationProjectDashboardProvider";
import { GitHubProjectDashboardProvider } from "./project-dashboard/GitHubProjectDashboardProvider";
import { CompanyGrowthGameplayLoopService } from "./progression/CompanyGrowthGameplayLoopService";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { CompanyProgressionTriggerService } from "./progression/CompanyProgressionTriggerService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController fifth employee recruiting", () => {
  it("loads the starter roster and recruits exactly one fifth employee from the terminal action", async () => {
    const state = createProjectPortalState();
    state.selectedProjectIndex = -2;
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{
        id: "completed-project-task",
        title: "Completed project milestone",
        description: "Provides the completed-project side of the level two progression gate.",
        status: "Done",
        priority: "Medium",
        projectId: "daily-proof",
        createdAt: "2026-01-01T09:00:00.000Z",
        updatedAt: "2026-01-01T09:00:00.000Z",
      }],
    };
    const controller = createControllerHarness(state, starterEmployees());

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.employees.map((employee) => employee.id)).toEqual([
      "employee-1",
      "employee-2",
      "employee-3",
      "employee-4",
      FIFTH_EMPLOYEE_ID,
    ]);
    expect(state.employees[4]).toMatchObject({
      name: "GPT Product Engineer",
      status: "Idle",
      assignedTaskId: undefined,
      currentProjectId: undefined,
    });
    expect(state.fifthEmployeeRecruitmentResult).toMatchObject({
      status: "recruited",
      employeeId: FIFTH_EMPLOYEE_ID,
      rosterSize: 5,
    });
    expect(controller.getCompanyProgressionSnapshot()).toMatchObject({
      companyLevel: 2,
      maxEmployees: 10,
    });
    expect(controller.getCompanyProgressionTriggers().map((trigger) => trigger.toLevel)).toEqual([2]);
  });

  it("does not duplicate the fifth employee or mutate unrelated portal collections", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "list";
    state.selectedProjectIndex = -2;
    state.employees = [...starterEmployees(), employee({ id: FIFTH_EMPLOYEE_ID, name: "GPT Product Engineer" })];
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{
        id: "task-1",
        title: "Existing task",
        description: "Must not change",
        status: "Todo",
        priority: "Medium",
        projectId: "daily-proof",
        createdAt: "2026-01-01T09:00:00.000Z",
        updatedAt: "2026-01-01T09:00:00.000Z",
      }],
    };
    const controller = createControllerHarness(state, starterEmployees());
    const beforeProjects = structuredClone(state.projects);
    const beforeTasks = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);
    const beforeRepositoryMappings = structuredClone(state.repositoryMappings);
    const beforeRepositorySummaries = structuredClone(state.repositorySummaries);

    controller.updateInput(createInput({ actionPressed: true }));
    await flushPromises();

    expect(state.employees.filter((item) => item.id === FIFTH_EMPLOYEE_ID)).toHaveLength(1);
    expect(state.fifthEmployeeRecruitmentResult).toMatchObject({
      status: "already_recruited",
      employeeId: FIFTH_EMPLOYEE_ID,
      rosterSize: 5,
    });
    expect(state.projects).toEqual(beforeProjects);
    expect(state.taskCollections).toEqual(beforeTasks);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(state.repositoryMappings).toEqual(beforeRepositoryMappings);
    expect(state.repositorySummaries).toEqual(beforeRepositorySummaries);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  view: {
    render: ReturnType<typeof vi.fn>;
    show: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  employeeService: {
    getEmployees: ReturnType<typeof vi.fn>;
  };
  employeeRecruitmentService: EmployeeRecruitmentService;
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  companyProgressionService: CompanyProgressionService;
  companyProgressionTriggerService: CompanyProgressionTriggerService;
  companyGrowthGameplayLoopService: CompanyGrowthGameplayLoopService;
  officeLayoutService: OfficeLayoutService;
  companyDashboardProvider: InternalSimulationDashboardProvider;
  projectDashboardProvider: InternalSimulationProjectDashboardProvider;
  githubProjectDashboardProvider: GitHubProjectDashboardProvider;
  companyInfluencePlanningService: CompanyInfluencePlanningService;
  aiService: ReturnType<typeof createMockAIService>;
  employeeRequestVersion: number;
};

function createControllerHarness(
  state: ProjectPortalState,
  employees: Employee[],
): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = getControllerInternals(controller);

  harness.state = state;
  harness.view = {
    render: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    destroy: vi.fn(),
  };
  harness.employeeService = {
    getEmployees: vi.fn(async () => employees.map(copyEmployee)),
  };
  harness.employeeRecruitmentService = new EmployeeRecruitmentService();
  harness.employeeAIService = new EmployeeAIService();
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();
  harness.companyProgressionService = new CompanyProgressionService();
  harness.companyProgressionTriggerService = new CompanyProgressionTriggerService();
  harness.companyGrowthGameplayLoopService = new CompanyGrowthGameplayLoopService();
  harness.officeLayoutService = new OfficeLayoutService();
  harness.companyDashboardProvider = new InternalSimulationDashboardProvider();
  harness.projectDashboardProvider = new InternalSimulationProjectDashboardProvider();
  harness.githubProjectDashboardProvider = new GitHubProjectDashboardProvider();
  harness.companyInfluencePlanningService = new CompanyInfluencePlanningService();
  harness.aiService = createMockAIService();
  harness.employeeRequestVersion = 0;

  return controller;
}

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function starterEmployees() {
  return [
    employee({ id: "employee-1" }),
    employee({ id: "employee-2" }),
    employee({ id: "employee-3" }),
    employee({ id: "employee-4" }),
  ];
}

function employee(overrides: Partial<Employee>): Employee {
  return {
    id: "employee",
    name: overrides.id ?? "Employee",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#64748b",
    capabilities: ["Coding"],
    description: "Recruiting test employee",
    provider: "placeholder",
    ...overrides,
  };
}

function copyEmployee(source: Employee): Employee {
  return {
    ...source,
    capabilities: [...source.capabilities],
    schedule: source.schedule ? { ...source.schedule } : undefined,
  };
}

function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    openCandidateDetailPressed: false,
    startImplementerPressed: false,
    startReviewerPressed: false,
    promoteReviewPressed: false,
    requestReviewFixPressed: false,
    planReviewFixPressed: false,
    startReviewFixRuntimePressed: false,
    startValidationRuntimePressed: false,
    preparePostValidationReviewTargetPressed: false,
    startPostValidationReviewPressed: false,
    ...overrides,
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
