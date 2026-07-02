import { describe, expect, it, vi } from "vitest";

import { EmployeeConversationService } from "./conversations/EmployeeConversationService";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { EmployeeInsightTarget } from "./insight/EmployeeInsightTypes";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController employee knowledge integration", () => {
  it("composes read-only knowledge source data from the selected Employee Insight target", () => {
    const state = createKnowledgeState();
    const controller = createControllerHarness(state);
    const insightSource = controller.getEmployeeInsightSources()
      .find((source) => source.employeeId === "employee-working");
    const insightTarget: EmployeeInsightTarget = {
      employeeId: "employee-working",
      distance: 12,
      source: expectDefined(insightSource),
    };

    const source = controller.getEmployeeKnowledgeSource(insightTarget);

    expect(source).toMatchObject({
      insightTarget: {
        employeeId: "employee-working",
        distance: 12,
      },
      insightSource: {
        employeeId: "employee-working",
        name: "Alex Working",
        aiState: "working",
        currentTask: { id: "task-active", title: "Build employee knowledge panel" },
        currentProject: { id: "daily-proof", name: "Daily Proof" },
        scheduleState: "inMeeting",
        workstationState: "occupied",
      },
      conversationContext: {
        employee: { id: "employee-working", name: "Alex Working" },
        currentTask: { id: "task-active" },
        projectName: "Daily Proof",
      },
    });
    expect(source?.insightSource).toBe(insightTarget.source);
  });

  it("does not mutate existing office state while composing knowledge source data", () => {
    const state = createKnowledgeState();
    const controller = createControllerHarness(state);
    const insightSource = expectDefined(controller.getEmployeeInsightSources()[0]);
    const insightTarget: EmployeeInsightTarget = {
      employeeId: insightSource.employeeId,
      distance: 8,
      source: insightSource,
    };
    const beforeEmployees = state.employees.map((employee) => ({ ...employee }));
    const beforeTaskCollections = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);

    controller.getEmployeeKnowledgeSource(insightTarget);

    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTaskCollections);
    expect(state.workSessions).toEqual(beforeWorkSessions);
  });

  it("does not create conversations or conversation view models for knowledge source data", () => {
    const state = createKnowledgeState();
    const controller = createControllerHarness(state);
    const insightSource = expectDefined(controller.getEmployeeInsightSources()[0]);
    const insightTarget: EmployeeInsightTarget = {
      employeeId: insightSource.employeeId,
      distance: 8,
      source: insightSource,
    };
    const conversationService = {
      createConversation: vi.fn(() => {
        throw new Error("Employee Knowledge must not create conversations.");
      }),
      createConversationViewModel: vi.fn(() => {
        throw new Error("Employee Knowledge must not create conversation view models.");
      }),
    };
    getControllerInternals(controller).employeeConversationService = conversationService;

    const source = controller.getEmployeeKnowledgeSource(insightTarget);

    expect(source?.conversationContext?.employee?.id).toBe("employee-working");
    expect(conversationService.createConversation).not.toHaveBeenCalled();
    expect(conversationService.createConversationViewModel).not.toHaveBeenCalled();
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  employeeConversationService: EmployeeConversationService | {
    createConversation: ReturnType<typeof vi.fn>;
    createConversationViewModel: ReturnType<typeof vi.fn>;
  };
  companyProgressionService: CompanyProgressionService;
  officeLayoutService: OfficeLayoutService;
};

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = getControllerInternals(controller);

  harness.state = state;
  harness.employeeAIService = new EmployeeAIService();
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();
  harness.employeeConversationService = new EmployeeConversationService();
  harness.companyProgressionService = new CompanyProgressionService();
  harness.officeLayoutService = new OfficeLayoutService();

  return controller;
}

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function createKnowledgeState() {
  const state = createProjectPortalState();
  state.employees = [
    createEmployee({
      id: "employee-working",
      name: "Alex Working",
      role: "Engineer",
      status: "Working",
      assignedTaskId: "task-active",
      currentProjectId: "daily-proof",
    }),
  ];
  state.taskCollections["daily-proof"] = {
    projectId: "daily-proof",
    tasks: [
      createTask({
        id: "task-active",
        title: "Build employee knowledge panel",
        assigneeId: "employee-working",
        assignee: "Alex Working",
        status: "In Progress",
      }),
    ],
  };

  return state;
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
    title: "Active task",
    description: "Task used by employee knowledge integration tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}

function expectDefined<T>(value: T | undefined): T {
  expect(value).toBeDefined();
  return value as T;
}
