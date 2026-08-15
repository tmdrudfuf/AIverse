import { describe, expect, it } from "vitest";

import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController NPC workstation task animation", () => {
  it("marks a working employee at an arrived workstation for active task animation", () => {
    const state = createStateWithTaskEmployee({
      employeeStatus: "Working",
      taskStatus: "In Progress",
    });
    const controller = createControllerHarness(state);

    const viewModels = controller.getEmployeeNpcViewModels();

    expect(viewModels).toHaveLength(1);
    expect(viewModels[0]).toMatchObject({
      employeeId: "employee-working",
      state: "working",
      positionHint: { zone: "workstation", slot: 0 },
      movementState: "arrived",
      workAnimation: {
        kind: "workstationTask",
        active: true,
        taskId: "task-active",
        taskTitle: "Build workstation animation",
      },
    });
  });

  it.each([
    ["idle employee", "Idle" as const, undefined, undefined],
    ["assigned employee", "Idle" as const, "Todo" as const, "task-active"],
    ["unavailable employee", "Offline" as const, "In Progress" as const, "task-active"],
  ])("does not mark a %s for active task animation", (_label, employeeStatus, taskStatus, assignedTaskId) => {
    const state = createStateWithTaskEmployee({
      employeeStatus,
      taskStatus,
      assignedTaskId,
    });
    const controller = createControllerHarness(state);

    const viewModels = controller.getEmployeeNpcViewModels();

    expect(viewModels[0]?.workAnimation).toBeUndefined();
  });

  it("does not mark a working employee while movement toward the workstation is still in flight", () => {
    const state = createStateWithTaskEmployee({
      employeeStatus: "Working",
      taskStatus: "In Progress",
    });
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);

    internals.employeeNpcMovementService.deriveSnapshots(
      [{
        employeeId: "employee-working",
        currentState: "idle",
        lastStateChangeAt: "2026-01-01T09:00:00.000Z",
        displayLabel: "Alex Working - Idle",
      }],
      "2026-01-01T09:00:00.000Z",
      {
        "employee-working": { zone: "idleSpot", slot: 0 },
      },
    );

    const viewModels = controller.getEmployeeNpcViewModels();

    expect(viewModels[0]).toMatchObject({
      movementState: "moving",
      positionHint: { zone: "workstation", slot: 0 },
    });
    expect(viewModels[0]?.workAnimation).toBeUndefined();
  });

  it("does not mutate portal collections or office service snapshots while deriving work animation state", () => {
    const state = createStateWithTaskEmployee({
      employeeStatus: "Working",
      taskStatus: "In Progress",
    });
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    const beforeEmployees = state.employees.map((employee) => ({ ...employee }));
    const beforeTasks = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);

    controller.getEmployeeNpcViewModels();
    const afterFirstMovement = internals.employeeNpcMovementService.getSnapshots();
    const afterFirstWorkstations = internals.workstationOccupancyService.getSnapshots();
    const afterFirstSchedules = internals.employeeDailyScheduleService.getSnapshots();

    controller.getEmployeeNpcViewModels();

    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTasks);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(internals.employeeNpcMovementService.getSnapshots()).toEqual(afterFirstMovement);
    expect(internals.workstationOccupancyService.getSnapshots()).toEqual(afterFirstWorkstations);
    expect(internals.employeeDailyScheduleService.getSnapshots()).toEqual(afterFirstSchedules);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
};

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = getControllerInternals(controller);

  harness.state = state;
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();

  return controller;
}

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function createStateWithTaskEmployee(options: {
  employeeStatus: Employee["status"];
  taskStatus?: ProjectTask["status"];
  assignedTaskId?: string;
}) {
  const state = createProjectPortalState();
  const taskStatus = options.taskStatus;
  const assignedTaskId = options.assignedTaskId ?? (options.employeeStatus === "Working" ? "task-active" : undefined);

  state.employees = [
    createEmployee({
      id: "employee-working",
      name: "Alex Working",
      status: options.employeeStatus,
      assignedTaskId,
      currentProjectId: assignedTaskId ? "daily-proof" : undefined,
    }),
  ];

  if (taskStatus) {
    state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [
        createTask({
          id: "task-active",
          title: "Build workstation animation",
          assigneeId: assignedTaskId ? "employee-working" : undefined,
          assignee: assignedTaskId ? "Alex Working" : undefined,
          status: taskStatus,
        }),
      ],
    };
  }

  return state;
}

function createEmployee(overrides: Partial<Employee> & Pick<Employee, "id" | "name" | "status">): Employee {
  return {
    role: "Engineer",
    avatarColor: "#22c55e",
    capabilities: ["TypeScript"],
    description: `${overrides.name} test employee`,
    ...overrides,
  };
}

function createTask(overrides: Partial<ProjectTask> & Pick<ProjectTask, "id" | "status">): ProjectTask {
  return {
    title: "Active task",
    description: "Task used by NPC workstation task animation tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}
