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
});

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = controller as unknown as {
    state: ProjectPortalState;
    employeeAIService: EmployeeAIService;
    employeeSimulationService: EmployeeSimulationService;
    employeeNpcMovementService: EmployeeNpcMovementService;
    workstationOccupancyService: WorkstationOccupancyService;
    employeeDailyScheduleService: EmployeeDailyScheduleService;
    companyProgressionService: CompanyProgressionService;
    officeLayoutService: OfficeLayoutService;
  };

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
