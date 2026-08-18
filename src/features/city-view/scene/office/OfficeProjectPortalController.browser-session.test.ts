import { describe, expect, it } from "vitest";

import { ActiveWorkSessionStartService } from "./active-work-sessions/ActiveWorkSessionStartService";
import { createActiveWorkSessionId } from "./active-work-sessions/ActiveWorkSessionTypes";
import {
  createConfirmedEmployeeAssignmentRecordId,
  type ConfirmedEmployeeAssignmentRecord,
} from "./confirmed-assignments/ConfirmedEmployeeAssignmentTypes";
import type { Employee } from "./employees/EmployeeTypes";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import {
  getControllerInternals,
  createInput,
  createSceneStub,
} from "./OfficeProjectPortalController.testHelpers";
import { createPreparedWorkSessionId, type PreparedWorkSessionRecord } from "./prepared-work-sessions/PreparedWorkSessionTypes";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";
import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import {
  BROWSER_OFFICE_SESSION_STORAGE_KEY,
  type BrowserOfficeSessionStorage,
} from "./browser-session/BrowserOfficeSessionTypes";

describe("OfficeProjectPortalController browser office session save restore", () => {
  it("restores active office work into a fresh controller state", () => {
    const storage = createMemoryStorage();
    const seedService = new BrowserOfficeSessionService({ storage });
    const source = createRestorableState();
    seedService.saveState(source);

    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
    });
    const internals = getControllerInternals(controller);

    expect(internals.state.taskCollections["daily-proof"]?.tasks[0]).toMatchObject({
      id: "task-12",
      status: "In Progress",
      assigneeId: "gpt-engineer",
    });
    expect(internals.state.employees[0]).toMatchObject({
      id: "gpt-engineer",
      status: "Working",
      assignedTaskId: "task-12",
    });
    expect(internals.state.workSessions["task-12"]?.[0]?.id).toBe(createSessionId());
  });

  it("saves session workflow records after input processing", () => {
    const storage = createMemoryStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });
    const internals = getControllerInternals(controller);
    applyRestorableSession(internals.state as ProjectPortalState);

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({}));

    const saved = JSON.parse(storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY) ?? "{}") as {
      taskCollections?: Record<string, { tasks: ProjectTask[] }>;
      confirmedEmployeeAssignmentRecords?: Record<string, ConfirmedEmployeeAssignmentRecord>;
      preparedWorkSessionRecords?: Record<string, PreparedWorkSessionRecord>;
      workSessions?: Record<string, WorkSession[]>;
    };

    expect(saved.taskCollections?.["daily-proof"]?.tasks[0]?.id).toBe("task-12");
    expect(Object.keys(saved.confirmedEmployeeAssignmentRecords ?? {})).toContain(createAssignment().id);
    expect(Object.keys(saved.preparedWorkSessionRecords ?? {})).toContain(createPreparedSession().id);
    expect(saved.workSessions?.["task-12"]?.[0]?.id).toBe(createSessionId());
  });

  it("treats restored active work as already started instead of creating a duplicate", () => {
    const storage = createMemoryStorage();
    const seedService = new BrowserOfficeSessionService({ storage });
    seedService.saveState(createRestorableState());

    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
    });
    const internals = getControllerInternals(controller);
    internals.activeWorkSessionStartService = new ActiveWorkSessionStartService();

    const handled = internals.startSelectedWorkSessionForPromotion("daily-proof", "candidate-12");

    expect(handled).toBe(true);
    const result = internals.state.activeWorkSessionStartResultCollections["daily-proof"]?.results.at(-1);
    expect(result).toMatchObject({
      status: "AlreadyStarted",
      reasonCodes: ["ALREADY_STARTED"],
      activeSessionId: createSessionId(),
      duplicateExistingSession: true,
    });
    expect(internals.state.workSessions["task-12"]).toHaveLength(1);
  });
});

function createRestorableState() {
  const state = createProjectPortalState({ browserOfficeSessionService: false });
  applyRestorableSession(state);
  return state;
}

function applyRestorableSession(state: ProjectPortalState) {
  const task = createTask({ status: "In Progress" });
  const assignment = createAssignment();
  const preparedSession = createPreparedSession();
  const activeSession = createWorkSession();

  state.selectedProjectId = "daily-proof";
  state.selectedProjectDashboardProjectId = "daily-proof";
  state.selectedProjectDashboardActiveWorkIndex = 0;
  state.selectedWorkSessionId = activeSession.id;
  state.taskCollections["daily-proof"] = {
    projectId: "daily-proof",
    tasks: [task],
  };
  state.employees = [createEmployee({
    status: "Working",
    assignedTaskId: task.id,
    currentProjectId: "daily-proof",
  })];
  state.confirmedEmployeeAssignmentRecords[assignment.id] = assignment;
  state.preparedWorkSessionRecords[preparedSession.id] = preparedSession;
  state.workSessions[task.id] = [activeSession];
}

function createTask(overrides: Partial<ProjectTask> = {}): ProjectTask {
  return {
    id: "task-12",
    title: "Fix crash on launch",
    description: [
      "Fix crash on launch",
      "Candidate Task: candidate-12",
      "Promotion Decision: promotion-12",
      "Assignment Recommendation: recommendation-12",
      "[AIverse Promotion: project=daily-proof; candidateTask=candidate-12; ruleset=candidate-promotion-v1]",
    ].join("\n"),
    status: "Todo",
    priority: "High",
    projectId: "daily-proof",
    assigneeId: "gpt-engineer",
    assignee: "GPT Engineer",
    createdAt: "2026-08-16T00:00:00.000Z",
    updatedAt: "2026-08-17T00:00:00.000Z",
    activityLog: [],
    ...overrides,
  };
}

function createAssignment(overrides: Partial<ConfirmedEmployeeAssignmentRecord> = {}): ConfirmedEmployeeAssignmentRecord {
  return {
    id: createConfirmedEmployeeAssignmentRecordId("daily-proof", "task-12", "gpt-engineer"),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    promotionDecisionId: "promotion-12",
    assignmentRecommendationId: "recommendation-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Assigned",
    reasonCodes: ["ASSIGNED"],
    assignmentSource: "Human",
    assignedAt: "2026-08-16T00:00:00.000Z",
    rulesetVersion: "confirmed-assignment-v1",
    taskStatusAtAssignment: "Todo",
    recommendationProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    humanConfirmed: true,
    workStarted: false,
    workSessionCreated: false,
    executionStarted: false,
    ...overrides,
  };
}

function createPreparedSession(overrides: Partial<PreparedWorkSessionRecord> = {}): PreparedWorkSessionRecord {
  const assignment = createAssignment();
  return {
    id: createPreparedWorkSessionId("daily-proof", "task-12", assignment.id),
    projectId: "daily-proof",
    projectTaskId: "task-12",
    candidateTaskId: "candidate-12",
    confirmedAssignmentId: assignment.id,
    assignmentRecommendationId: "recommendation-12",
    promotionDecisionId: "promotion-12",
    employeeId: "gpt-engineer",
    employeeDisplayName: "GPT Engineer",
    status: "Prepared",
    preparationSource: "Human",
    reasonCodes: ["PREPARED"],
    preparedAt: "2026-08-16T00:00:00.000Z",
    rulesetVersion: "prepared-session-v1",
    taskStatusAtPreparation: "Todo",
    assignmentProvenance: {
      candidateTaskId: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
    },
    taskProvenance: {
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      promotionDecisionId: "promotion-12",
      assignmentRecommendationId: "recommendation-12",
    },
    humanPrepared: true,
    active: false,
    workStarted: false,
    paused: false,
    completed: false,
    executionStarted: false,
    agentStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    ...overrides,
  };
}

function createEmployee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: ["Coding"],
    description: "Restored employee",
    ...overrides,
  };
}

function createWorkSession(overrides: Partial<WorkSession> = {}): WorkSession {
  return {
    id: createSessionId(),
    taskId: "task-12",
    projectId: "daily-proof",
    employeeId: "gpt-engineer",
    employeeName: "GPT Engineer",
    provider: "placeholder",
    status: "running",
    startedAt: "2026-08-17T00:00:00.000Z",
    ...overrides,
  };
}

function createSessionId() {
  return createActiveWorkSessionId("daily-proof", "task-12", createPreparedSession().id);
}

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
