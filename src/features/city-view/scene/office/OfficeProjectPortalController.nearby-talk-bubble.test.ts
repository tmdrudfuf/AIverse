import { describe, expect, it } from "vitest";

import { EmployeeConversationService } from "./conversations/EmployeeConversationService";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController nearby talk bubble integration", () => {
  it("resolves the nearest employee and creates a deterministic conversation view model", () => {
    const state = createTalkState();
    const controller = createControllerHarness(state);

    const target = controller.getNearbyEmployeeConversationTarget({ zone: "workstation", slot: 0 });
    const viewModel = target ? controller.getEmployeeConversationViewModel(target.employeeId) : undefined;

    expect(target).toEqual({
      employeeId: "employee-working",
      distance: 0,
    });
    expect(viewModel).toMatchObject({
      employeeId: "employee-working",
      speakerName: "Alex Working",
      dialogueText: "I'm working on Build nearby talk bubbles.",
      dialogueType: "working",
      displayDurationMs: 3200,
      positionHint: { zone: "workstation", slot: 0 },
    });
  });

  it("does not mutate office state when resolving nearby talk bubble data", () => {
    const state = createTalkState();
    const controller = createControllerHarness(state);
    const beforeEmployees = structuredClone(state.employees);
    const beforeTaskCollections = structuredClone(state.taskCollections);
    const beforeWorkSessions = structuredClone(state.workSessions);
    const beforeEmployeeSimulations = structuredClone(state.employeeSimulations);

    const target = controller.getNearbyEmployeeConversationTarget({ zone: "workstation", slot: 0 });
    if (target) controller.getEmployeeConversationViewModel(target.employeeId);

    expect(state.employees).toEqual(beforeEmployees);
    expect(state.taskCollections).toEqual(beforeTaskCollections);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(state.employeeSimulations).toEqual(beforeEmployeeSimulations);
  });

  it("returns no nearby conversation target when the player position is not resolved", () => {
    const controller = createControllerHarness(createTalkState());

    expect(controller.getNearbyEmployeeConversationTarget({ zone: "unknown-zone", slot: 0 })).toBeUndefined();
    expect(controller.getNearbyEmployeeConversationTarget({ zone: "workstation" })).toBeUndefined();
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  employeeConversationService: EmployeeConversationService;
};

function createControllerHarness(state: ProjectPortalState): OfficeProjectPortalController {
  const controller = Object.create(OfficeProjectPortalController.prototype) as OfficeProjectPortalController;
  const harness = controller as unknown as ControllerInternals;

  harness.state = state;
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();
  harness.employeeConversationService = new EmployeeConversationService();

  return controller;
}

function createTalkState() {
  const state = createProjectPortalState();
  state.employees = [
    createEmployee({
      id: "employee-working",
      name: "Alex Working",
      status: "Working",
      assignedTaskId: "task-talk",
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
        id: "task-talk",
        title: "Build nearby talk bubbles",
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
    description: "Task used by nearby talk bubble tests.",
    priority: "Medium",
    projectId: "daily-proof",
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    ...overrides,
  };
}
