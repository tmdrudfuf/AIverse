import { describe, expect, it } from "vitest";

import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController employee insight integration", () => {
  it("composes read-only employee insight sources from existing office state", () => {
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
      createEmployee({
        id: "employee-idle",
        name: "Iris Idle",
        role: "Designer",
        status: "Idle",
      }),
    ];
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [
        createTask({
          id: "task-active",
          title: "Build employee insight card",
          assigneeId: "employee-working",
          assignee: "Alex Working",
          status: "In Progress",
        }),
      ],
    };

    const controller = createControllerHarness(state);

    const sources = controller.getEmployeeInsightSources();

    expect(sources.map((source) => source.employeeId)).toEqual(["employee-idle", "employee-working"]);

    const workingSource = sources.find((source) => source.employeeId === "employee-working");
    expect(workingSource).toMatchObject({
      employeeId: "employee-working",
      name: "Alex Working",
      role: "Engineer",
      aiState: "working",
      simulationState: "working",
      currentTask: {
        id: "task-active",
        title: "Build employee insight card",
        status: "In Progress",
      },
      currentProject: {
        id: "daily-proof",
        name: "Daily Proof",
      },
      workProgress: {
        label: "In Progress",
        status: "In Progress",
        percent: 50,
      },
      scheduleState: "inMeeting",
      workstationState: "occupied",
      companyProgression: {
        companyLevel: 1,
        layoutId: "garage-startup-level-1",
      },
    });
    expect(workingSource?.movementPosition).toMatchObject({
      x: 248,
      y: 182,
      positionHint: { zone: "workstation", slot: 0 },
    });
    expect(workingSource?.aiSnapshot?.contextSummary).toMatchObject({
      simulationState: "working",
      movementZone: "workstation",
      movementState: "arrived",
      scheduleState: "inMeeting",
      layoutId: "garage-startup-level-1",
      companyLevel: 1,
    });

    const idleSource = sources.find((source) => source.employeeId === "employee-idle");
    expect(idleSource).toMatchObject({
      employeeId: "employee-idle",
      name: "Iris Idle",
      role: "Designer",
      aiState: "idle",
      currentTask: undefined,
      currentProject: undefined,
      workProgress: undefined,
    });
  });

  it("does not mutate existing preview-backed office snapshots while composing insight sources", () => {
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
    const visibleEmployees = [
      {
        employeeId: "employee-readonly",
        currentState: "working" as const,
        currentTaskId: "task-readonly",
        currentProjectId: "daily-proof",
        lastStateChangeAt: "2026-01-01T09:00:00.000Z",
        displayLabel: "Riley Readonly - Working",
      },
    ];
    internals.workstationOccupancyService.deriveSnapshots(visibleEmployees);
    internals.employeeDailyScheduleService.deriveSnapshots(visibleEmployees);
    internals.employeeNpcMovementService.deriveSnapshots(visibleEmployees);

    const beforeMovementSnapshots = internals.employeeNpcMovementService.getSnapshots();
    const beforeWorkstationSnapshots = internals.workstationOccupancyService.getSnapshots();
    const beforeScheduleSnapshots = internals.employeeDailyScheduleService.getSnapshots();
    const beforeEmployees = state.employees.map((employee) => ({ ...employee }));
    const beforeTaskCollections = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);

    controller.getEmployeeInsightSources();

    expect(internals.employeeNpcMovementService.getSnapshots()).toEqual(beforeMovementSnapshots);
    expect(internals.workstationOccupancyService.getSnapshots()).toEqual(beforeWorkstationSnapshots);
    expect(internals.employeeDailyScheduleService.getSnapshots()).toEqual(beforeScheduleSnapshots);
    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTaskCollections);
    expect(state.workSessions).toEqual(beforeWorkSessions);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
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
  harness.companyProgressionService = new CompanyProgressionService();
  harness.officeLayoutService = new OfficeLayoutService();

  return controller;
}

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
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
    description: "Task used by employee insight integration tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}
