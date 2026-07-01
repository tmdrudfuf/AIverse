import { describe, expect, it } from "vitest";

import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController employee AI integration", () => {
  it("composes employee AI snapshots from simulation, workstation, schedule, movement, progression, and layout context", () => {
    const state = createProjectPortalState();
    state.employees = [
      createEmployee({
        id: "employee-working",
        name: "Alex Working",
        status: "Working",
        assignedTaskId: "task-active",
        currentProjectId: "daily-proof",
      }),
      createEmployee({
        id: "employee-idle",
        name: "Iris Idle",
        status: "Idle",
      }),
    ];
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [
        createTask({
          id: "task-active",
          assigneeId: "employee-working",
          assignee: "Alex Working",
          status: "In Progress",
        }),
      ],
    };

    const controller = createControllerHarness(state);

    const snapshots = controller.getEmployeeAIStateSnapshots();

    expect(snapshots.map((snapshot) => snapshot.employeeId)).toEqual(["employee-idle", "employee-working"]);

    const idleSnapshot = snapshots.find((snapshot) => snapshot.employeeId === "employee-idle");
    expect(idleSnapshot).toMatchObject({
      currentState: "idle",
      contextSummary: {
        simulationState: "idle",
        movementZone: "meetingArea",
        movementState: "idle",
        scheduleState: "inMeeting",
        layoutId: "garage-startup-level-1",
        companyLevel: 1,
      },
    });

    const workingSnapshot = snapshots.find((snapshot) => snapshot.employeeId === "employee-working");
    expect(workingSnapshot).toMatchObject({
      currentState: "working",
      contextSummary: {
        simulationState: "working",
        movementZone: "workstation",
        movementState: "arrived",
        scheduleState: "inMeeting",
        layoutId: "garage-startup-level-1",
        companyLevel: 1,
      },
    });
  });

  it("uses the latest known movement timestamp for Employee AI preview movement", () => {
    const state = createProjectPortalState();
    state.employees = [
      createEmployee({
        id: "employee-moving",
        name: "Mina Moving",
        status: "Idle",
      }),
    ];
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    const seededTimestamp = "2026-01-01T09:30:00.000Z";
    internals.employeeNpcMovementService.deriveSnapshots(
      [
        {
          employeeId: "employee-moving",
          currentState: "assigned",
          lastStateChangeAt: seededTimestamp,
          displayLabel: "Mina Moving - Assigned",
        },
      ],
      seededTimestamp,
      {
        "employee-moving": { zone: "workstation", slot: 0 },
      },
    );

    const snapshots = controller.getEmployeeAIStateSnapshots();

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0]).toMatchObject({
      employeeId: "employee-moving",
      currentState: "walking",
      lastUpdatedAt: seededTimestamp,
      contextSummary: {
        movementState: "moving",
      },
    });
  });

  it("does not mutate office services or portal collections while previewing Employee AI state", () => {
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
    const beforeProgression = internals.companyProgressionService.getProgressionSnapshot();
    const beforeLayout = internals.officeLayoutService.getActiveLayout(beforeProgression.layoutId);

    controller.getEmployeeAIStateSnapshots();

    expect(internals.employeeNpcMovementService.getSnapshots()).toEqual(beforeMovementSnapshots);
    expect(internals.workstationOccupancyService.getSnapshots()).toEqual(beforeWorkstationSnapshots);
    expect(internals.employeeDailyScheduleService.getSnapshots()).toEqual(beforeScheduleSnapshots);
    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTaskCollections);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(internals.companyProgressionService.getProgressionSnapshot()).toEqual(beforeProgression);
    expect(internals.officeLayoutService.getActiveLayout(beforeProgression.layoutId)).toEqual(beforeLayout);
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
    description: "Task used by employee AI integration tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}
