import { describe, expect, it, vi } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateProjectTaskPromotionResultCollection } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionTypes";
import type { CandidatePromotionDecision, CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { ActiveWorkSessionStartResultCollection } from "./active-work-sessions/ActiveWorkSessionTypes";
import type { ExecutionPlanCollection, ExecutionPlanResultCollection } from "./execution-plans/ExecutionPlanTypes";
import type {
  ExecutionReadinessCollection,
  ExecutionReadinessResultCollection,
} from "./execution-readiness/ExecutionReadinessTypes";
import type {
  HumanExecutionApprovalCollection,
  HumanExecutionApprovalResultCollection,
} from "./human-execution-approvals/HumanExecutionApprovalTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import type {
  PreparedWorkSessionRecord,
  PreparedWorkSessionResultCollection,
} from "./prepared-work-sessions/PreparedWorkSessionTypes";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import type { WorkSession } from "./work-sessions/WorkSessionTypes";

describe("OfficeProjectPortalController issue sync concurrency and isolation", () => {
  it("keeps a newer Succeeded result even when an older request resolves Failed afterward", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferredResults = [createDeferred<IssueSnapshotCollection>(), createDeferred<IssueSnapshotCollection>()];
    let callIndex = 0;
    internals.issueSyncService = {
      readIssueSnapshots: () => deferredResults[callIndex++]!.promise,
    };

    controller.open();
    controller.updateInput(createInput({})); // consume the justOpened guard
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const firstCall = internals.syncIssueSnapshots("daily-proof"); // older, slower
    const secondCall = internals.syncIssueSnapshots("daily-proof"); // newer, faster

    deferredResults[1]!.resolve(succeededCollection());
    await secondCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");

    deferredResults[0]!.resolve(failedCollection("stale, should be discarded"));
    await firstCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
  });

  it("keeps a newer Failed result even when an older request resolves Succeeded afterward", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferredResults = [createDeferred<IssueSnapshotCollection>(), createDeferred<IssueSnapshotCollection>()];
    let callIndex = 0;
    internals.issueSyncService = {
      readIssueSnapshots: () => deferredResults[callIndex++]!.promise,
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const firstCall = internals.syncIssueSnapshots("daily-proof"); // older, slower
    const secondCall = internals.syncIssueSnapshots("daily-proof"); // newer, faster

    deferredResults[1]!.resolve(failedCollection("newer failure"));
    await secondCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Failed");

    deferredResults[0]!.resolve(succeededCollection());
    await firstCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Failed");
  });

  it("does not apply an in-flight issue sync result after the player navigates away from the project dashboard", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferred = createDeferred<IssueSnapshotCollection>();
    internals.issueSyncService = { readIssueSnapshots: () => deferred.promise };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const syncCall = internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Syncing");

    controller.updateInput(createInput({ escapePressed: true }));
    expect(internals.state.viewMode).toBe("list");

    deferred.resolve(succeededCollection());
    await syncCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).not.toBe("Succeeded");
  });

  it("never shows project A's issue collection when project B's dashboard is opened before B's sync resolves", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    const projectB = internals.state.projects.find((project) => project.id === "portfolio");
    if (projectB) {
      projectB.repositoryIdentity = { provider: "github", owner: "ai-verse", name: "portfolio", connectionState: "Configured" };
    }

    const deferredB = createDeferred<IssueSnapshotCollection>();
    internals.issueSyncService = {
      readIssueSnapshots: (identity: { name?: string }) =>
        identity.name === "daily-proof" ? Promise.resolve(succeededCollection()) : deferredB.promise,
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");

    internals.state.selectedProjectDashboardProjectId = "portfolio";
    const syncCallB = internals.syncIssueSnapshots("portfolio");

    expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Syncing");

    deferredB.resolve(failedCollection("B resolved"));
    await syncCallB;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateTaskCollections["portfolio"]?.syncStatus).toBe("Failed");
  });

  it("resolves the repository summary refresh, repository sync, and issue sync together from openProjectDashboard, without one invalidating another", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);
      setDailyProofIdentity(internals);

      controller.open();
      controller.updateInput(createInput({})); // consume the justOpened guard
      controller.updateInput(createInput({ enterPressed: true })); // list -> project-dashboard
      await flushPromises();

      expect(internals.state.repositorySummaries["daily-proof"]?.connectionStatus).toBe("connected");
      expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).toBe("Succeeded");
      expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
      expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("maps candidate tasks from issue sync without creating executable project tasks", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return {
          provider: "github",
          owner: "ai-verse",
          name: "daily-proof",
          syncStatus: "Succeeded",
          issues: [
            createIssue("ai-verse/daily-proof#1", 1, "An issue that must not become a task", ["bug"]),
          ],
          openCount: 1,
          closedCount: 0,
          isTruncated: false,
          lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
        };
      },
    };
    const before = structuredClone(internals.state.taskCollections);
    const employeesBefore = structuredClone(internals.state.employees);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.issueSyncCollections["daily-proof"]?.issues).toHaveLength(1);
    expect(issueSyncReadCount).toBe(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks).toHaveLength(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]).toMatchObject({
      originatingIssueId: "ai-verse/daily-proof#1",
      issueNumber: 1,
      estimatedPriority: "High",
      estimatedTaskType: "Bug",
    });
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toHaveLength(1);
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations[0]).toMatchObject({
      candidateTaskId: internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]?.id,
      recommendedEmployeeId: "gpt-engineer",
      assignmentStatus: "Recommended",
      taskType: "Bug",
    });
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews[0]).toMatchObject({
      promotionStatus: "PendingReview",
      candidateTaskId: internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]?.id,
      recommendedEmployeeId: "gpt-engineer",
    });
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
    expect(internals.state.taskCollections).toEqual(before);
  });

  it("clears stale assignment recommendations when candidate task sync becomes unavailable", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];

    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return issueSyncReadCount === 1
          ? succeededIssueCollectionWithBug()
          : failedCollection("Issue sync failed.");
      },
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toHaveLength(1);

    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendationStatus).toBe("Failed");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toEqual([]);
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviewStatus).toBe("Failed");
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews).toEqual([]);
  });

  it("reports no employee pool without mutating candidate tasks or creating work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [];
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations[0]).toMatchObject({
      assignmentStatus: "Unavailable",
      unavailableReason: "No employees are available for assignment recommendations.",
    });
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews[0]).toMatchObject({
      promotionStatus: "Unavailable",
    });
    expect(internals.state.taskCollections).toEqual({});
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
  });

  it("approval records a local promotion decision without creating active work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return succeededIssueCollectionWithBug();
      },
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    const tasksBefore = structuredClone(internals.state.taskCollections);
    const employeesBefore = structuredClone(internals.state.employees);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.updateInput(createInput({ enterPressed: true }));

    const decision = Object.values(internals.state.candidatePromotionDecisionRecords)[0];
    expect(decision).toMatchObject({
      promotionStatus: "Approved",
      decisionSource: "Human",
      activeTaskCreated: false,
      executionStarted: false,
    });
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews[0]?.promotionStatus).toBe("Approved");
    expect(internals.state.taskCollections).toEqual(tasksBefore);
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
    expect(issueSyncReadCount).toBe(1);
  });

  it("does not approve ineligible promotion reviews", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return {
          ...succeededIssueCollectionWithBug(),
          issues: [createIssue("ai-verse/daily-proof#1", 1, "Closed bug", ["bug"], "Closed")],
          openCount: 0,
          closedCount: 1,
        };
      },
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(Object.values(internals.state.candidatePromotionDecisionRecords)).toEqual([]);
    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews[0]?.eligibility.isApprovable).toBe(false);
    expect(issueSyncReadCount).toBe(2);
  });

  it("promotes an approved Candidate Task into one local ProjectTask without starting work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [],
    };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    const employeesBefore = structuredClone(internals.state.employees);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.updateInput(createInput({ enterPressed: true })); // approve locally
    controller.updateInput(createInput({ enterPressed: true })); // explicit promote command

    const tasks = internals.state.taskCollections["daily-proof"].tasks;
    const result = internals.state.candidateProjectTaskPromotionResultCollections["daily-proof"]?.results[0];
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: "daily-proof:promoted-task:daily-proof:candidate-task:ai-verse/daily-proof#1:candidate-promotion-v1",
      status: "Todo",
    });
    expect(tasks[0]!.title).toBe("Fix crash");
    expect(tasks[0]!.assignee).toBeUndefined();
    expect(tasks[0]!.assigneeId).toBeUndefined();
    expect(result).toMatchObject({
      status: "Promoted",
      activeTaskCreated: true,
      workStarted: false,
      employeeAssigned: false,
      executionStarted: false,
    });
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
  });

  it("confirms the recommended employee for a promoted ProjectTask without starting work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    const employeesBefore = structuredClone(internals.state.employees);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.updateInput(createInput({ enterPressed: true })); // approve locally
    controller.updateInput(createInput({ enterPressed: true })); // promote to ProjectTask
    controller.updateInput(createInput({ enterPressed: true })); // confirm assignment

    const tasks = internals.state.taskCollections["daily-proof"].tasks;
    const assignmentResult = internals.state.confirmedEmployeeAssignmentResultCollections["daily-proof"]?.results[0];
    const assignmentRecord = Object.values(internals.state.confirmedEmployeeAssignmentRecords)[0];

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      assigneeId: "gpt-engineer",
      assignee: "GPT Engineer",
      status: "Todo",
    });
    expect(tasks[0]?.activityLog?.filter((activity) => activity.type === "employee_assigned")).toHaveLength(1);
    expect(assignmentResult).toMatchObject({
      status: "Assigned",
      assignedTask: true,
      humanConfirmed: true,
      workStarted: false,
      workSessionCreated: false,
      executionStarted: false,
    });
    expect(assignmentRecord).toMatchObject({
      projectTaskId: tasks[0]?.id,
      employeeId: "gpt-engineer",
      humanConfirmed: true,
      workStarted: false,
      workSessionCreated: false,
      executionStarted: false,
    });
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
  });

  it("assignment confirmation creates no duplicate activity before the later preparation action", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));

    const tasks = internals.state.taskCollections["daily-proof"].tasks;
    const result = internals.state.confirmedEmployeeAssignmentResultCollections["daily-proof"]?.results[0];
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.activityLog?.filter((activity) => activity.type === "employee_assigned")).toHaveLength(1);
    expect(Object.values(internals.state.confirmedEmployeeAssignmentRecords)).toHaveLength(1);
    expect(result?.status).toBe("Assigned");
    expect(result?.duplicateExistingAssignment).toBe(false);
    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(0);
  });

  it("prepares a confirmed assignment only after a distinct explicit input and never starts work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true })); // approve locally
    controller.updateInput(createInput({ enterPressed: true })); // promote to ProjectTask
    controller.updateInput(createInput({ enterPressed: true })); // confirm assignment only
    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(0);
    expect(internals.state.preparedWorkSessionResultCollections["daily-proof"]).toBeUndefined();

    const tasksBefore = structuredClone(internals.state.taskCollections);
    const employeesBefore = structuredClone(internals.state.employees);
    const assignmentsBefore = structuredClone(internals.state.confirmedEmployeeAssignmentRecords);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.updateInput(createInput({ enterPressed: true })); // prepare work session

    const preparationRecord = Object.values(internals.state.preparedWorkSessionRecords)[0];
    const preparationResult = internals.state.preparedWorkSessionResultCollections["daily-proof"]?.results[0];
    expect(preparationRecord).toMatchObject({
      projectTaskId: tasksBefore["daily-proof"]?.tasks[0]?.id,
      employeeId: "gpt-engineer",
      humanPrepared: true,
      active: false,
      workStarted: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(preparationResult).toMatchObject({
      status: "Prepared",
      prepared: true,
      active: false,
      workStarted: false,
      executionStarted: false,
      employeeMoved: false,
    });
    expect(internals.state.taskCollections).toEqual(tasksBefore);
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.confirmedEmployeeAssignmentRecords).toEqual(assignmentsBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
  });

  it("does not duplicate prepared-session records when the next explicit input starts work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    const firstPreparedId = Object.values(internals.state.preparedWorkSessionRecords)[0]?.id;
    controller.updateInput(createInput({ enterPressed: true }));

    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(1);
    expect(Object.values(internals.state.preparedWorkSessionRecords)[0]?.id).toBe(firstPreparedId);
    expect(internals.state.activeWorkSessionStartResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Started",
      preparedSessionId: firstPreparedId,
      started: true,
    });
  });

  it("starts a prepared work session only after a distinct explicit input", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true })); // approve locally
    controller.updateInput(createInput({ enterPressed: true })); // promote to ProjectTask
    controller.updateInput(createInput({ enterPressed: true })); // confirm assignment
    controller.updateInput(createInput({ enterPressed: true })); // prepare only

    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(1);
    expect(internals.state.activeWorkSessionStartResultCollections["daily-proof"]).toBeUndefined();
    expect(internals.state.workSessions).toEqual({});
    expect(internals.state.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("Todo");
    expect(internals.state.employees[0]?.status).toBe("Idle");

    controller.updateInput(createInput({ enterPressed: true })); // start work session

    const activeResult = internals.state.activeWorkSessionStartResultCollections["daily-proof"]?.results[0];
    const activeSession = internals.state.workSessions[internals.state.taskCollections["daily-proof"]!.tasks[0]!.id]?.[0];
    expect(activeResult).toMatchObject({
      status: "Started",
      started: true,
      active: true,
      workStarted: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(activeSession).toMatchObject({
      status: "running",
      employeeId: "gpt-engineer",
      provider: "placeholder",
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(internals.state.taskCollections["daily-proof"]?.tasks[0]).toMatchObject({
      status: "In Progress",
      assigneeId: "gpt-engineer",
      assignee: "GPT Engineer",
    });
    expect(internals.state.employees[0]).toMatchObject({
      status: "Working",
      assignedTaskId: internals.state.taskCollections["daily-proof"]?.tasks[0]?.id,
      currentProjectId: "daily-proof",
    });
    expect(Object.values(internals.state.preparedWorkSessionRecords)[0]).toMatchObject({
      active: false,
      workStarted: false,
      executionStarted: false,
    });
  });

  it("creates an execution plan only after a separate input following work-session start", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.projects[0]!.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
      connectionState: "Available",
    };
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      provider: "github",
      availability: "available",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      currentBranch: "codex/070-execution-plan-foundation",
      syncStatus: "Succeeded",
      workingTreeState: "clean",
    };
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true })); // approve
    controller.updateInput(createInput({ enterPressed: true })); // promote
    controller.updateInput(createInput({ enterPressed: true })); // confirm assignment
    controller.updateInput(createInput({ enterPressed: true })); // prepare
    controller.updateInput(createInput({ enterPressed: true })); // start

    expect(internals.state.executionPlanCollections["daily-proof"]).toBeUndefined();

    controller.updateInput(createInput({ enterPressed: true })); // create execution plan

    const plan = internals.state.executionPlanCollections["daily-proof"]?.plans[0];
    const result = internals.state.executionPlanResultCollections["daily-proof"]?.results[0];
    expect(result).toMatchObject({
      status: "Created",
      createdPlan: true,
      executionStarted: false,
      subprocessStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(plan).toMatchObject({
      featureId: "070-execution-plan-foundation",
      projectTaskId: internals.state.taskCollections["daily-proof"]?.tasks[0]?.id,
      implementerAgent: "Implementer",
      reviewerAgent: "Reviewer",
      branchName: "codex/070-execution-plan-foundation",
      specPath: "specs/070-execution-plan-foundation/spec.md",
      executionStarted: false,
      runtimeStarted: false,
      subprocessStarted: false,
    });
    expect(internals.state.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(internals.state.employees[0]?.status).toBe("Working");

    controller.updateInput(createInput({ enterPressed: true })); // evaluate execution readiness

    expect(internals.state.executionReadinessResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Ready",
      reasonCodes: ["READY"],
      executionApproved: false,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(internals.state.executionReadinessCollections["daily-proof"]?.readiness[0]?.checks).toHaveLength(10);
    expect(internals.state.humanExecutionApprovalCollections["daily-proof"]?.approvals).toHaveLength(0);

    controller.updateInput(createInput({ enterPressed: true })); // approve execution

    expect(internals.state.humanExecutionApprovalCollections["daily-proof"]?.approvals).toHaveLength(1);
    expect(internals.state.humanExecutionApprovalCollections["daily-proof"]?.approvals[0]).toMatchObject({
      decision: "Approved",
      approvedBy: "Local Human",
      executionApproved: true,
      executionStarted: false,
      agentStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(internals.state.humanExecutionApprovalResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Approved",
      reasonCodes: ["APPROVED"],
      approved: true,
      executionStarted: false,
      agentStarted: false,
    });
    expect(internals.state.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(internals.state.employees[0]?.status).toBe("Working");

    controller.updateInput(createInput({ enterPressed: true })); // repeat approval

    expect(internals.state.humanExecutionApprovalCollections["daily-proof"]?.approvals).toHaveLength(1);
    expect(internals.state.humanExecutionApprovalResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "AlreadyApproved",
      reasonCodes: ["ALREADY_APPROVED"],
      duplicateExistingApproval: true,
      executionApproved: true,
    });
  });

  it("revalidates an existing execution plan before execution readiness", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.projects[0]!.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-spec-070",
      connectionState: "Available",
    };
    internals.state.repositorySyncSnapshots["daily-proof"] = {
      provider: "github",
      availability: "available",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      currentBranch: "codex/070-execution-plan-foundation",
      syncStatus: "Succeeded",
      workingTreeState: "clean",
    };
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    for (let index = 0; index < 6; index += 1) controller.updateInput(createInput({ enterPressed: true }));
    const firstPlanId = internals.state.executionPlanCollections["daily-proof"]?.plans[0]?.planId;
    internals.state.employees = [employee({ id: "gpt-engineer", status: "Offline", capabilities: ["Coding"] })];

    controller.updateInput(createInput({ enterPressed: true }));

    expect(internals.state.executionPlanCollections["daily-proof"]?.plans[0]?.planId).toBe(firstPlanId);
    expect(internals.state.executionPlanCollections["daily-proof"]?.plans).toHaveLength(1);
    expect(internals.state.executionPlanResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Blocked",
      reasonCodes: ["EMPLOYEE_STALE"],
      createdPlan: false,
      duplicateExistingPlan: false,
      executionStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(internals.state.executionReadinessResultCollections["daily-proof"]).toBeUndefined();
    expect(internals.state.humanExecutionApprovalCollections["daily-proof"]).toBeUndefined();
  });

  it("revalidates an already-started session and blocks stale employee state", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    const firstSessionId = Object.values(internals.state.workSessions)[0]?.[0]?.id;
    internals.state.employees = [employee({ id: "gpt-engineer", status: "Offline", capabilities: ["Coding"] })];

    controller.updateInput(createInput({ enterPressed: true }));

    expect(Object.values(internals.state.workSessions)[0]?.[0]?.id).toBe(firstSessionId);
    expect(internals.state.activeWorkSessionStartResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Unavailable",
      reasonCodes: ["EMPLOYEE_UNAVAILABLE"],
      started: false,
      duplicateExistingSession: false,
    });
  });

  it("revalidates an already-prepared assignment and blocks stale started task state", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    const preparedRecordId = Object.values(internals.state.preparedWorkSessionRecords)[0]?.id;
    const task = internals.state.taskCollections["daily-proof"]!.tasks[0]!;
    internals.state.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{ ...task, status: "In Progress" }],
    };

    controller.updateInput(createInput({ enterPressed: true }));

    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(1);
    expect(Object.values(internals.state.preparedWorkSessionRecords)[0]?.id).toBe(preparedRecordId);
    expect(internals.state.activeWorkSessionStartResultCollections["daily-proof"]?.results[0]).toMatchObject({
      status: "Ineligible",
      reasonCodes: ["TASK_ALREADY_STARTED"],
      started: false,
      duplicateExistingSession: false,
    });
  });

  it("blocks preparation when employee has an active work session at command time", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    const task = internals.state.taskCollections["daily-proof"]?.tasks[0];
    internals.state.workSessions = {
      "other-task": [{
        id: "session-1",
        taskId: "other-task",
        projectId: "daily-proof",
        employeeId: "gpt-engineer",
        employeeName: "GPT Engineer",
        provider: "placeholder",
        status: "running",
        startedAt: "2026-01-02T00:00:00.000Z",
      }],
    };

    controller.updateInput(createInput({ enterPressed: true }));

    expect(Object.values(internals.state.preparedWorkSessionRecords)).toHaveLength(0);
    expect(internals.state.preparedWorkSessionResultCollections["daily-proof"]?.results[0]).toMatchObject({
      projectTaskId: task?.id,
      status: "Conflict",
      reasonCodes: ["EMPLOYEE_CONFLICT"],
      prepared: false,
    });
  });

  it("blocks confirmed assignment when the recommended employee becomes unavailable before command time", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return succeededIssueCollectionWithBug();
      },
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    internals.state.employees = [employee({ id: "gpt-engineer", status: "Offline", capabilities: ["Coding"] })];

    controller.updateInput(createInput({ enterPressed: true })); // approve locally
    controller.updateInput(createInput({ enterPressed: true })); // promote to ProjectTask
    controller.updateInput(createInput({ enterPressed: true })); // blocked assignment attempt

    const task = internals.state.taskCollections["daily-proof"].tasks[0];
    const result = internals.state.confirmedEmployeeAssignmentResultCollections["daily-proof"]?.results[0];
    expect(task?.assigneeId).toBeUndefined();
    expect(result).toMatchObject({
      status: "Unavailable",
      reasonCodes: ["EMPLOYEE_UNAVAILABLE"],
      assignedTask: false,
      workStarted: false,
    });
    expect(Object.values(internals.state.confirmedEmployeeAssignmentRecords)).toHaveLength(0);
  });

  it("does not auto-promote merely because a Candidate Task is approved", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    internals.state.taskCollections["daily-proof"] = { projectId: "daily-proof", tasks: [] };
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    controller.updateInput(createInput({ enterPressed: true }));
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidatePromotionReviewCollections["daily-proof"]?.reviews[0]?.promotionStatus).toBe("Approved");
    expect(internals.state.taskCollections["daily-proof"].tasks).toHaveLength(0);
    expect(internals.state.candidateProjectTaskPromotionResultCollections["daily-proof"]).toBeUndefined();
  });

  it("does not create duplicate candidate tasks for duplicate issue snapshots", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.issueSyncService = {
      readIssueSnapshots: async () => ({
        provider: "github",
        syncStatus: "Succeeded",
        issues: [
          createIssue("ai-verse/daily-proof#9", 9, "First copy", ["enhancement"]),
          createIssue("ai-verse/daily-proof#9", 9, "Duplicate copy", ["bug"]),
        ],
        openCount: 2,
        closedCount: 0,
        isTruncated: false,
        lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
      }),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateTaskCollections["daily-proof"]?.taskCount).toBe(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]?.title).toBe("First copy");
  });

  it("reaches Portfolio's project dashboard from the list and reports an honest Unavailable issue sync, never a fabricated Succeeded, using the real wired providers", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);

      controller.open();
      controller.updateInput(createInput({})); // consume the justOpened guard
      controller.updateInput(createInput({ downPressed: true })); // daily-proof -> portfolio
      controller.updateInput(createInput({ enterPressed: true })); // list -> project-dashboard
      await flushPromises();

      expect(internals.state.selectedProjectDashboardProjectId).toBe("portfolio");
      expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Unavailable");
      expect(internals.state.candidateTaskCollections["portfolio"]?.syncStatus).toBe("Unavailable");
      expect(internals.state.candidateTaskCollections["portfolio"]?.tasks).toEqual([]);
      expect(internals.state.issueSyncCollections["portfolio"]?.errorSummary).toBeTruthy();
      expect(internals.state.issueSyncCollections["portfolio"]?.issues).toEqual([]);
      expect(fetchStub).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

function succeededCollection(): IssueSnapshotCollection {
  return { provider: "github", syncStatus: "Succeeded", issues: [], openCount: 0, closedCount: 0, isTruncated: false };
}

function succeededIssueCollectionWithBug(): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [createIssue("ai-verse/daily-proof#1", 1, "Fix crash", ["bug"])],
    openCount: 1,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
  };
}

function failedCollection(errorSummary: string): IssueSnapshotCollection {
  return { provider: "github", syncStatus: "Failed", issues: [], openCount: 0, closedCount: 0, isTruncated: false, errorSummary };
}

function createIssue(id: string, number: number, title: string, labels: string[] = [], state: "Open" | "Closed" = "Open") {
  return {
    id,
    number,
    title,
    state,
    assignees: [],
    labels,
    provider: "github",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: "2026-01-01T00:00:00.000Z",
  };
}

type ProjectPortalProjectLike = {
  id: string;
  repositoryIdentity?: unknown;
};

type ControllerInternals = {
  state: {
    viewMode: string;
    selectedProjectDashboardProjectId: string | undefined;
    projects: ProjectPortalProjectLike[];
    repositorySummaries: Record<string, { connectionStatus: string }>;
    repositorySyncSnapshots: ProjectPortalState["repositorySyncSnapshots"];
    issueSyncCollections: Record<string, IssueSnapshotCollection>;
    candidateTaskCollections: Record<string, CandidateTaskCollection>;
    candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
    candidatePromotionReviewCollections: Record<string, CandidatePromotionReviewCollection>;
    candidatePromotionDecisionRecords: Record<string, CandidatePromotionDecision>;
    candidateProjectTaskPromotionResultCollections: Record<string, CandidateProjectTaskPromotionResultCollection>;
    confirmedEmployeeAssignmentRecords: ProjectPortalState["confirmedEmployeeAssignmentRecords"];
    confirmedEmployeeAssignmentResultCollections: ProjectPortalState["confirmedEmployeeAssignmentResultCollections"];
    preparedWorkSessionRecords: Record<string, PreparedWorkSessionRecord>;
    preparedWorkSessionResultCollections: Record<string, PreparedWorkSessionResultCollection>;
    activeWorkSessionStartResultCollections: Record<string, ActiveWorkSessionStartResultCollection>;
    executionPlanCollections: Record<string, ExecutionPlanCollection>;
    executionPlanResultCollections: Record<string, ExecutionPlanResultCollection>;
    executionReadinessCollections: Record<string, ExecutionReadinessCollection>;
    executionReadinessResultCollections: Record<string, ExecutionReadinessResultCollection>;
    humanExecutionApprovalCollections: Record<string, HumanExecutionApprovalCollection>;
    humanExecutionApprovalResultCollections: Record<string, HumanExecutionApprovalResultCollection>;
    taskCollections: Record<string, TaskCollection>;
    employees: Employee[];
    workSessions: Record<string, WorkSession[]>;
  };
  issueSyncService: {
    readIssueSnapshots: (identity: { owner?: string; name?: string; provider: string }) => Promise<IssueSnapshotCollection>;
  };
  syncIssueSnapshots: (projectId: string) => Promise<void>;
};

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: [],
    description: "Employee",
    ...overrides,
  };
}

function setDailyProofIdentity(internals: ControllerInternals) {
  const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof");
  if (dailyProof) {
    dailyProof.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    ...overrides,
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

function createFetchStub() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/issues")) return jsonResponse(200, []);
    if (url.includes("/pulls")) return jsonResponse(200, [{ id: 1 }]);
    if (url.includes("/commits")) {
      return jsonResponse(200, [
        {
          sha: "abc1234",
          commit: { message: "Real read", author: { name: "Octocat", date: "2026-07-01T00:00:00.000Z" } },
        },
      ]);
    }
    return jsonResponse(200, {
      owner: { login: "ai-verse" },
      name: "daily-proof",
      default_branch: "main",
      open_issues_count: 5,
      pushed_at: "2026-07-01T00:00:00.000Z",
    });
  });
}

function createSceneStub(): PhaserScene {
  const createChainable = () => ({
    setOrigin: () => createChainable(),
    setScrollFactor: () => createChainable(),
    setDepth: () => createChainable(),
    setVisible: () => createChainable(),
    destroy: () => undefined,
  });
  const createGraphics = () => {
    const graphics = {
      fillStyle: () => graphics,
      fillRoundedRect: () => graphics,
      lineStyle: () => graphics,
      strokeRoundedRect: () => graphics,
      lineBetween: () => graphics,
    };
    return graphics;
  };
  const createContainer = () => ({
    add: () => undefined,
    removeAll: () => undefined,
    setScrollFactor: () => createContainer(),
    setDepth: () => createContainer(),
    setVisible: () => createContainer(),
    destroy: () => undefined,
  });

  return {
    scale: {
      width: 1024,
      height: 768,
    },
    add: {
      rectangle: () => createChainable(),
      graphics: () => createGraphics(),
      container: () => createContainer(),
      text: () => createChainable(),
    },
  } as unknown as PhaserScene;
}
