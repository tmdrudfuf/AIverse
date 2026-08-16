import { describe, expect, it, vi } from "vitest";

import { AIProjectManagerService } from "./ai/AIProjectManagerService";
import { createMockAIService } from "./ai/MockAIServiceFactory";
import { InternalSimulationDashboardProvider } from "./dashboard/InternalSimulationDashboardProvider";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { CompanyGrowthGameplayLoopService } from "./progression/CompanyGrowthGameplayLoopService";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { CompanyProgressionTriggerService } from "./progression/CompanyProgressionTriggerService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController company influence planning", () => {
  it("selects one local company focus and surfaces it in the dashboard snapshot", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);
    state.companyDashboardSnapshot = controller.getCompanyDashboardSnapshot();

    const summary = controller.setCompanyFocus("delivery-speed", "2026-01-01T09:00:00.000Z");

    expect(summary.currentFocus?.label).toBe("Improve delivery speed");
    expect(state.companyInfluencePlan).toEqual({
      selectedFocusId: "delivery-speed",
      updatedAt: "2026-01-01T09:00:00.000Z",
    });
    expect(state.companyDashboardSnapshot?.companyFocus?.currentFocus?.label).toBe("Improve delivery speed");

    controller.setCompanyFocus("quality", "2026-01-01T09:05:00.000Z");

    expect(state.companyInfluencePlan).toEqual({
      selectedFocusId: "quality",
      updatedAt: "2026-01-01T09:05:00.000Z",
    });
    expect(state.companyDashboardSnapshot?.companyFocus?.currentFocus?.label).toBe("Improve quality");
  });

  it("ignores invalid focus identifiers and keeps same-focus selection idempotent", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    controller.setCompanyFocus("team-morale", "2026-01-01T09:00:00.000Z");
    const selectedState = { ...state.companyInfluencePlan };

    controller.setCompanyFocus("team-morale", "2026-01-01T09:00:00.000Z");
    expect(state.companyInfluencePlan).toEqual(selectedState);

    controller.setCompanyFocus("complete-all-tasks", "2026-01-01T10:00:00.000Z");
    expect(state.companyInfluencePlan).toEqual(selectedState);
  });

  it("opens influence planning from the dashboard focus row and preserves focus after closing", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = -1;
    const controller = createControllerHarness(state);
    const view = getControllerInternals(controller).view;
    state.companyDashboardSnapshot = controller.getCompanyDashboardSnapshot();

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("influence-planning");

    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.companyInfluencePlan.selectedFocusId).toBe("quality");
    expect(state.companyFocusSummary?.currentFocus?.label).toBe("Improve quality");

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("list");
    expect(state.companyDashboardSnapshot?.companyFocus?.currentFocus?.label).toBe("Improve quality");
    expect(view.render).toHaveBeenCalled();
  });

  it("does not mutate employee, task, schedule, movement, workstation, progression, layout, work-session, or conversation state", () => {
    const state = createProjectPortalState();
    state.employees = [
      createEmployee({
        id: "employee-readonly",
        name: "Riley Readonly",
        status: "Working",
        assignedTaskId: "task-readonly",
        currentProjectId: "daily-proof",
      }),
    ];
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [
        createTask({
          id: "task-readonly",
          assigneeId: "employee-readonly",
          assignee: "Riley Readonly",
          status: "In Progress",
        }),
      ],
    };

    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    const visibleEmployees = [{
      employeeId: "employee-readonly",
      currentState: "working" as const,
      currentTaskId: "task-readonly",
      currentProjectId: "daily-proof",
      lastStateChangeAt: "2026-01-01T09:00:00.000Z",
      displayLabel: "Riley Readonly - Working",
    }];
    internals.workstationOccupancyService.deriveSnapshots(visibleEmployees);
    internals.employeeDailyScheduleService.deriveSnapshots(visibleEmployees);
    internals.employeeNpcMovementService.deriveSnapshots(visibleEmployees);

    const beforeEmployees = structuredClone(state.employees);
    const beforeTasks = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);
    const beforeAssignments = structuredClone(state.employeeAssignments);
    const beforeMovementSnapshots = internals.employeeNpcMovementService.getSnapshots();
    const beforeWorkstationSnapshots = internals.workstationOccupancyService.getSnapshots();
    const beforeScheduleSnapshots = internals.employeeDailyScheduleService.getSnapshots();
    const beforeProgression = internals.companyProgressionService.getProgressionSnapshot();
    const beforeLayout = internals.officeLayoutService.getActiveLayout(beforeProgression.layoutId);
    const conversationService = {
      createConversation: vi.fn(() => {
        throw new Error("Company influence planning must not create conversations.");
      }),
      createConversationViewModel: vi.fn(() => {
        throw new Error("Company influence planning must not create conversation view models.");
      }),
    };
    internals.employeeConversationService = conversationService;

    controller.setCompanyFocus("project-risk", "2026-01-01T09:00:00.000Z");

    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTasks);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(state.employeeAssignments).toEqual(beforeAssignments);
    expect(internals.employeeNpcMovementService.getSnapshots()).toEqual(beforeMovementSnapshots);
    expect(internals.workstationOccupancyService.getSnapshots()).toEqual(beforeWorkstationSnapshots);
    expect(internals.employeeDailyScheduleService.getSnapshots()).toEqual(beforeScheduleSnapshots);
    expect(internals.companyProgressionService.getProgressionSnapshot()).toEqual(beforeProgression);
    expect(internals.officeLayoutService.getActiveLayout(beforeProgression.layoutId)).toEqual(beforeLayout);
    expect(conversationService.createConversation).not.toHaveBeenCalled();
    expect(conversationService.createConversationViewModel).not.toHaveBeenCalled();
  });
});

describe("OfficeProjectPortalController office zone progression unlocks", () => {
  it("reports the Reception zone as locked, required at level 2, with no employees hired", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    expect(controller.getNextOfficeZoneUnlock()).toEqual({
      zoneType: "reception",
      label: "Reception",
      requiredLevel: 2,
    });

    const dashboardSnapshot = controller.getCompanyDashboardSnapshot();
    expect(dashboardSnapshot.officeZoneProgress).toEqual({
      unlockedZoneCount: 5,
      nextUnlock: { zoneType: "reception", label: "Reception", requiredLevel: 2 },
    });
  });

  it("unlocks Reception once level 2's milestones are met by real employee/task counts", () => {
    const state = createProjectPortalState();
    state.employees = Array.from({ length: 5 }, (_, index) =>
      createEmployee({ id: `employee-${index + 1}`, name: `Employee ${index + 1}`, status: "Idle" }));
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [createTask({ id: "task-done", status: "Done" })],
    };
    const controller = createControllerHarness(state);

    expect(controller.getCompanyProgressionSnapshot().companyLevel).toBe(2);
    expect(controller.getCompanyProgressionSnapshot().unlockedOfficeZones).toContain("reception");

    const dashboardSnapshot = controller.getCompanyDashboardSnapshot();
    expect(dashboardSnapshot.officeZoneProgress.unlockedZoneCount).toBe(7);
    expect(dashboardSnapshot.officeZoneProgress.nextUnlock).toEqual({
      zoneType: "serverArea",
      label: "Server Room",
      requiredLevel: 3,
    });
  });

  it("stores latest company progression triggers during dashboard refresh", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    controller.getCompanyDashboardSnapshot();
    expect(state.companyProgressionTriggers).toEqual([]);

    state.employees = Array.from({ length: 5 }, (_, index) =>
      createEmployee({ id: `employee-${index + 1}`, name: `Employee ${index + 1}`, status: "Idle" }));
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [createTask({ id: "task-done", status: "Done" })],
    };

    controller.getCompanyDashboardSnapshot();
    expect(state.companyProgressionTriggers).toHaveLength(1);
    expect(state.companyProgressionTriggers[0]).toMatchObject({
      triggerId: "company-level-2-reached",
      fromLevel: 1,
      toLevel: 2,
      companyStage: "smallOffice",
    });

    controller.getCompanyDashboardSnapshot();
    expect(state.companyProgressionTriggers).toEqual([]);
  });

  it("returns copied company growth gameplay loop output from stored progression triggers", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    controller.getCompanyDashboardSnapshot();
    state.employees = Array.from({ length: 5 }, (_, index) =>
      createEmployee({ id: `employee-${index + 1}`, name: `Employee ${index + 1}`, status: "Idle" }));
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [createTask({ id: "task-done", status: "Done" })],
    };
    controller.getCompanyDashboardSnapshot();

    const result = controller.getCompanyGrowthGameplayLoopResult();
    expect(result.triggers).toHaveLength(1);
    expect(result.effects[0]).toMatchObject({
      triggerId: "company-level-2-reached",
      effectId: "company-level-2-reached:world-effect",
      toLevel: 2,
    });
    expect(result.rewards[0]).toMatchObject({
      triggerId: "company-level-2-reached",
      effectId: result.effects[0].effectId,
      rewardId: "company-level-2-reached:world-effect:reward",
    });
    expect(result.eventFeed[0]).toMatchObject({
      triggerId: "company-level-2-reached",
      rewardId: result.rewards[0].rewardId,
    });

    result.triggers[0].unlockedOfficeZones[0] = "storage";
    result.effects[0].unlockedOfficeZones[0] = "storage";
    result.rewards[0].milestoneIds[0] = "mutated";
    result.eventFeed[0].milestoneIds[0] = "mutated";

    const nextResult = controller.getCompanyGrowthGameplayLoopResult();
    expect(nextResult.triggers[0].unlockedOfficeZones).toContain("reception");
    expect(nextResult.effects[0].unlockedOfficeZones).toContain("reception");
    expect(nextResult.rewards[0].milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees"]);
    expect(nextResult.eventFeed[0].milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees"]);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  view: {
    render: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  employeeConversationService?: {
    createConversation: ReturnType<typeof vi.fn>;
    createConversationViewModel: ReturnType<typeof vi.fn>;
  };
  companyProgressionService: CompanyProgressionService;
  companyProgressionTriggerService: CompanyProgressionTriggerService;
  companyGrowthGameplayLoopService: CompanyGrowthGameplayLoopService;
  officeLayoutService: OfficeLayoutService;
  companyDashboardProvider: InternalSimulationDashboardProvider;
  companyInfluencePlanningService: CompanyInfluencePlanningService;
  aiService: ReturnType<typeof createMockAIService>;
  aiProjectManagerService: AIProjectManagerService;
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
  harness.companyInfluencePlanningService = new CompanyInfluencePlanningService();
  harness.aiService = createMockAIService();
  harness.aiProjectManagerService = new AIProjectManagerService(harness.aiService);

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

function createEmployee(overrides: Partial<Employee> & Pick<Employee, "id" | "name" | "status">): Employee {
  return {
    role: "Engineer",
    avatarColor: "#64748b",
    capabilities: ["TypeScript"],
    description: `${overrides.name} test employee`,
    ...overrides,
  };
}

function createTask(overrides: Partial<ProjectTask> & Pick<ProjectTask, "id" | "status">): ProjectTask {
  return {
    title: "Readonly influence task",
    description: "Task used by company influence planning integration tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}
