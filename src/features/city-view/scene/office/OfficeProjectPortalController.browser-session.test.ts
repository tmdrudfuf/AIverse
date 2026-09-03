import { describe, expect, it } from "vitest";

import { ActiveWorkSessionStartService } from "./active-work-sessions/ActiveWorkSessionStartService";
import { createActiveWorkSessionId } from "./active-work-sessions/ActiveWorkSessionTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
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
  flushPromises,
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
    expect(internals.state.projectBacklogReadinessPromotionPolicies["daily-proof"]).toMatchObject({
      projectId: "daily-proof",
      enabled: true,
      allowedPriorities: ["high"],
      maxPromotionsPerEvaluation: 1,
    });
  });

  it("restores valid Auto Ready policies and drops malformed consent state", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      ...createRestorableState(),
      version: "browser-office-session-v1",
      savedAt: "2026-09-02T00:00:00.000Z",
      projectBacklogReadinessPromotionPolicies: {
        "daily-proof": {
          projectId: "daily-proof",
          enabled: true,
          allowedPriorities: ["high"],
          allowedOrigins: ["operator-created"],
          maxPromotionsPerEvaluation: 1,
          requireNoActiveExecution: true,
          requireValidTask: true,
          requireNonDuplicate: true,
          updatedAt: "2026-09-02T00:00:00.000Z",
          updatedByOperator: true,
          lastEvaluation: {
            evaluatedAt: "2026-09-02T00:00:00.000Z",
            promotedCount: 1,
            skippedCount: 0,
            latestResultText: "Promoted: high priority allowed",
            promotedTaskIds: ["task-12"],
            skipped: [],
          },
        },
        "project-b": {
          projectId: "project-b",
          enabled: true,
        },
      },
    }));

    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
    });
    const internals = getControllerInternals(controller);

    expect(internals.state.projectBacklogReadinessPromotionPolicies["daily-proof"]).toMatchObject({
      enabled: true,
      allowedOrigins: ["operator-created"],
      lastEvaluation: {
        latestResultText: "Promoted: high priority allowed",
      },
    });
    expect(internals.state.projectBacklogReadinessPromotionPolicies["project-b"]).toBeUndefined();
  });

  it("does not save during empty input polling frames", () => {
    const { storage, setItemCount } = createCountingStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({}));

    expect(setItemCount()).toBe(0);
    expect(storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("does not save for pure project-list navigation", () => {
    const { storage, setItemCount } = createCountingStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ upPressed: true }));

    expect(setItemCount()).toBe(0);
    expect(storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY)).toBeNull();
  });

  it("saves after fifth employee recruitment mutates employees", async () => {
    const { storage, setItemCount } = createCountingStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });

    controller.open();
    controller.updateInput(createInput({}));
    controller.updateInput(createInput({ upPressed: true }));
    controller.updateInput(createInput({ upPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    await flushPromises();

    const saved = readSaved(storage);
    expect(setItemCount()).toBeGreaterThan(0);
    expect(saved.employees).toHaveLength(5);
  });

  it("saves candidate decisions and promoted project tasks after mutation", () => {
    const { storage, setItemCount } = createCountingStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });
    const internals = getControllerInternals(controller);
    applyCandidatePromotionFixture(internals.state as ProjectPortalState);

    expect(internals.recordCandidatePromotionDecision("daily-proof", "candidate-12", "Approved")).toBe(true);
    expect(internals.promoteSelectedCandidateTask("daily-proof", "candidate-12")).toBe(true);

    const saved = readSaved(storage);
    expect(setItemCount()).toBeGreaterThanOrEqual(2);
    expect(Object.values(saved.candidatePromotionDecisionRecords ?? {})[0]).toMatchObject({
      candidateTaskId: "candidate-12",
      promotionStatus: "Approved",
    });
    expect(saved.taskCollections?.["daily-proof"]?.tasks.some((task) => task.id.includes("candidate-12"))).toBe(true);
  });

  it("saves employee assignment and task status lifecycle mutations", () => {
    const { storage, setItemCount } = createCountingStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });
    const internals = getControllerInternals(controller);
    const task = createTask({ status: "In Progress", assignee: undefined, assigneeId: undefined });
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [task] };
    internals.state.employees = [createEmployee({ status: "Idle" })];
    internals.state.selectedTaskProjectId = "daily-proof";
    internals.state.selectedTaskId = task.id;
    internals.state.selectedTaskIndex = 0;
    internals.state.selectedEmployeeIndex = 0;
    internals.state.viewMode = "employee-selection";

    internals.assignSelectedEmployeeToSelectedTask();
    internals.state.viewMode = "task-detail";
    internals.moveSelectedTaskToReview();

    const saved = readSaved(storage);
    expect(setItemCount()).toBeGreaterThanOrEqual(2);
    expect(saved.taskCollections?.["daily-proof"]?.tasks[0]).toMatchObject({
      assigneeId: "gpt-engineer",
      status: "Review",
    });
  });

  it("saves active work created by async task-detail workflow before another input", async () => {
    const storage = createMemoryStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({
        storage,
        now: () => "2026-08-17T00:00:00.000Z",
      }),
    });
    const internals = getControllerInternals(controller);
    const task = createTask({ status: "Todo" });

    internals.state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [task],
    };
    internals.state.employees = [createEmployee({ status: "Working", assignedTaskId: task.id })];
    controller.open();
    internals.state.selectedTaskProjectId = "daily-proof";
    internals.state.selectedTaskId = task.id;
    internals.state.selectedTaskIndex = 0;
    internals.state.viewMode = "task-detail";

    await internals.startPlaceholderWorkOnSelectedTask();

    const saved = JSON.parse(storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY) ?? "{}") as {
      selectedWorkSessionId?: string;
      taskCollections?: Record<string, { tasks: ProjectTask[] }>;
      workSessions?: Record<string, WorkSession[]>;
    };

    expect(saved.selectedWorkSessionId).toBeTruthy();
    expect(saved.taskCollections?.["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(saved.workSessions?.[task.id]?.[0]?.taskId).toBe(task.id);
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
  state.projectBacklogReadinessPromotionPolicies["daily-proof"] = {
    projectId: "daily-proof",
    enabled: true,
    allowedPriorities: ["high"],
    allowedOrigins: ["operator-created", "ai-suggestion-manual", "ai-suggestion-automatic"],
    maxPromotionsPerEvaluation: 1,
    requireNoActiveExecution: true,
    requireValidTask: true,
    requireNonDuplicate: true,
    updatedAt: "2026-09-02T00:00:00.000Z",
    updatedByOperator: true,
  };
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

function applyCandidatePromotionFixture(state: ProjectPortalState) {
  state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
  state.candidateAssignmentCollections["daily-proof"] = createCandidateAssignmentCollection();
  state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection();
  state.taskCollections["daily-proof"] = {
    projectId: "daily-proof",
    tasks: [],
  };
  state.employees = [createEmployee({ id: "employee-1", name: "Ada", status: "Idle" })];
  state.selectedProjectDashboardProjectId = "daily-proof";
  state.viewMode = "project-dashboard";
}

function createCandidateTaskCollection(): CandidateTaskCollection {
  return {
    projectId: "daily-proof",
    sourceProvider: "github",
    syncStatus: "Succeeded",
    tasks: [{
      id: "candidate-12",
      originatingIssueId: "ai-verse/daily-proof#12",
      issueNumber: 12,
      projectId: "daily-proof",
      title: "Fix crash on launch",
      summary: "Fix crash on launch",
      labels: ["bug"],
      assignees: ["ada"],
      state: "Open",
      estimatedPriority: "High",
      estimatedTaskType: "Bug",
      sourceProvider: "github",
      sourceRepositoryOwner: "ai-verse",
      sourceRepositoryName: "daily-proof",
      sourceUrl: "https://github.com/ai-verse/daily-proof/issues/12",
      issueCreatedAt: "2026-08-16T00:00:00.000Z",
      issueUpdatedAt: "2026-08-16T01:00:00.000Z",
      mappedAt: "2026-08-16T01:05:00.000Z",
      syncedAt: "2026-08-16T01:05:00.000Z",
    }],
    taskCount: 1,
    mappedAt: "2026-08-16T01:05:00.000Z",
    sourceIssueCount: 1,
    sourceIssueSyncStatus: "Succeeded",
    sourceIssueSyncedAt: "2026-08-16T01:00:00.000Z",
  };
}

function createCandidateAssignmentCollection(): CandidateAssignmentRecommendationCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    recommendationStatus: "Succeeded",
    recommendations: [{
      id: "assignment-12",
      candidateTaskId: "candidate-12",
      candidateTaskTitle: "Fix crash on launch",
      projectId: "daily-proof",
      recommendedEmployeeId: "employee-1",
      recommendedEmployeeName: "Ada",
      employeeRole: "Engineer",
      assignmentStatus: "Recommended",
      matchTier: "Strong",
      matchedCapabilities: ["BugFixing"],
      unmatchedRequirements: [],
      warnings: [],
      taskType: "Bug",
      proposedPriority: "High",
      reasonCodes: ["CAPABILITY_MATCH"],
      generatedAt: "2026-08-16T01:10:00.000Z",
      rulesetVersion: "candidate-assignment-v1",
      provenance: {
        candidateTaskId: "candidate-12",
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
      },
      alternatives: [],
    }],
    recommendationCount: 1,
    generatedAt: "2026-08-16T01:10:00.000Z",
    rulesetVersion: "candidate-assignment-v1",
    sourceCandidateTaskCount: 1,
  };
}

function createCandidatePromotionCollection(): CandidatePromotionReviewCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    sourceAssignmentStatus: "Succeeded",
    reviewStatus: "Succeeded",
    reviews: [{
      id: "daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1",
      projectId: "daily-proof",
      candidateTaskId: "candidate-12",
      candidateTaskTitle: "Fix crash on launch",
      candidateTaskType: "Bug",
      candidateTaskPriority: "High",
      candidateTaskState: "Open",
      candidateTaskProvenance: {
        candidateTaskId: "candidate-12",
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
        sourceProvider: "github",
        sourceUrl: "https://github.com/ai-verse/daily-proof/issues/12",
      },
      assignmentRecommendationId: "assignment-12",
      recommendedEmployeeId: "employee-1",
      recommendedEmployeeName: "Ada",
      assignmentStatus: "Recommended",
      promotionStatus: "PendingReview",
      eligibility: {
        status: "PendingReview",
        isApprovable: true,
        reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
        summary: "Ready for promotion.",
      },
      availableActions: ["Approved", "Deferred", "Rejected"],
      rulesetVersion: "candidate-promotion-v1",
    }],
    reviewCount: 1,
    selectedIndex: 0,
    generatedAt: "2026-08-16T01:15:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
    sourceCandidateTaskCount: 1,
    sourceAssignmentCount: 1,
  };
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

function createCountingStorage() {
  let writes = 0;
  const storage = createMemoryStorage();
  return {
    storage: {
      getItem: storage.getItem,
      setItem: (key: string, value: string) => {
        writes += 1;
        storage.setItem(key, value);
      },
    } satisfies BrowserOfficeSessionStorage,
    setItemCount: () => writes,
  };
}

function readSaved(storage: BrowserOfficeSessionStorage) {
  return JSON.parse(storage.getItem(BROWSER_OFFICE_SESSION_STORAGE_KEY) ?? "{}") as ProjectPortalState;
}
