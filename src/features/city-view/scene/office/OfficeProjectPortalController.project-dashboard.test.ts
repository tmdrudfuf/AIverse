import { describe, expect, it, vi } from "vitest";

import { AIProjectManagerService } from "./ai/AIProjectManagerService";
import type { ProjectManagementSuggestion } from "./ai/AIProjectManagerTypes";
import { createMockAIService } from "./ai/MockAIServiceFactory";
import { InternalSimulationDashboardProvider } from "./dashboard/InternalSimulationDashboardProvider";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { Employee } from "./employees/EmployeeTypes";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { GitHubProjectDashboardProvider } from "./project-dashboard/GitHubProjectDashboardProvider";
import { InternalSimulationProjectDashboardProvider } from "./project-dashboard/InternalSimulationProjectDashboardProvider";
import { MockGitHubRepositoryProvider } from "./github/MockGitHubRepositoryProvider";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import { CompanyProgressionTriggerService } from "./progression/CompanyProgressionTriggerService";
import type { CandidatePromotionReviewCollection } from "./candidate-promotions/CandidatePromotionTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { RepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type { TaskCollection } from "./tasks/ProjectTaskTypes";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";

describe("OfficeProjectPortalController project dashboard", () => {
  it("opens a selected project dashboard from the Company Dashboard flow", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = 0;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(state.projectDashboardSnapshot?.project).toMatchObject({
      projectId: "daily-proof",
      name: "Daily Proof",
      isAvailable: true,
    });
    expect(state.projectDashboardSnapshot?.externalSources?.[0]).toMatchObject({
      sourceType: "github",
      sourceId: "github:ai-verse/daily-proof",
      statusLabel: "Fresh",
    });
    expect(state.repositorySummaries["daily-proof"]?.connectionStatus).toBe("connected");
    expect(state.taskCollections["daily-proof"]?.tasks.map((task) => task.id)).toEqual(["task-dashboard"]);
    expect(internals.view.render).toHaveBeenCalled();
  });

  it("returns from Project Dashboard to Company Dashboard without losing runtime project data", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.viewMode).toBe("project-dashboard");

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("list");
    expect(state.selectedProjectDashboardProjectId).toBeUndefined();
    expect(state.projectDashboardSnapshot).toBeUndefined();
    expect(state.taskCollections["daily-proof"]?.tasks.map((task) => task.id)).toEqual(["task-dashboard"]);
    expect(state.companyDashboardSnapshot?.projects.projects.map((project) => project.projectId)).toContain("daily-proof");
  });

  it("derives an unavailable snapshot when the selected project is missing", () => {
    const state = createProjectPortalState();
    const controller = createControllerHarness(state);

    const snapshot = controller.getProjectDashboardSnapshot("missing-project");

    expect(snapshot.project).toMatchObject({
      projectId: "missing-project",
      name: "Project unavailable",
      isAvailable: false,
    });
    expect(state.projectDashboardSnapshot).toBe(snapshot);
  });

  it("passes existing project-management suggestions into the Project Dashboard without creating new ones", () => {
    const state = createProjectPortalState();
    state.projectManagementSuggestions["daily-proof"] = createSuggestion();
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.aiProjectManagerService.createProjectManagementSuggestion = vi.fn(async () => {
      throw new Error("Project Dashboard must not create management suggestions.");
    });

    const snapshot = controller.getProjectDashboardSnapshot("daily-proof");

    expect(snapshot.advisory).toMatchObject({
      status: "available",
      healthSummary: "Daily Proof has 1 active task and 0 completed tasks.",
      topRiskLabel: "Dashboard advisory needs review.",
      nextAttentionLabel: "Reduce project risk: Critical dashboard work needs attention.",
    });
    expect(internals.aiProjectManagerService.createProjectManagementSuggestion).not.toHaveBeenCalled();
  });

  it("preserves existing detail and workspace state when opening project dashboard is not requested", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "detail";
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("list");
    expect(state.selectedProjectDashboardProjectId).toBeUndefined();
    expect(state.projectDashboardSnapshot).toBeUndefined();
  });

  it("does not mutate project, task, employee, schedule, work-session, influence, progression, NPC, insight, knowledge, or conversation state", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.employees = [createEmployee()];
    state.companyInfluencePlan = {
      selectedFocusId: "project-risk",
      updatedAt: "2026-01-01T09:00:00.000Z",
    };
    state.taskCollections["daily-proof"] = createTaskCollection();
    state.workSessions["task-dashboard"] = [{
      id: "session-dashboard",
      taskId: "task-dashboard",
      projectId: "daily-proof",
      employeeId: "employee-1",
      employeeName: "Ada",
      provider: "placeholder",
      status: "running",
      startedAt: "2026-01-01T10:00:00.000Z",
    }];
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);

    const beforeProjects = structuredClone(state.projects);
    const beforeRepositoryMappings = structuredClone(state.repositoryMappings);
    const beforeTasks = structuredClone(state.taskCollections);
    const beforeEmployees = structuredClone(state.employees);
    const beforeWorkSessions = structuredClone(state.workSessions);
    const beforeSuggestions = structuredClone(state.projectManagementSuggestions);
    const beforeInfluence = structuredClone(state.companyInfluencePlan);
    const beforeProgression = internals.companyProgressionService.getProgressionSnapshot();
    const beforeMovement = internals.employeeNpcMovementService.getSnapshots();
    const beforeSchedule = internals.employeeDailyScheduleService.getSnapshots();
    const beforeWorkstations = internals.workstationOccupancyService.getSnapshots();
    internals.aiService.analyzeTask = vi.fn(async () => {
      throw new Error("Project Dashboard must not analyze tasks.");
    });
    internals.aiService.recommendEmployeeForTask = vi.fn(async () => {
      throw new Error("Project Dashboard must not recommend employees.");
    });
    internals.aiProjectManagerService.createProjectManagementSuggestion = vi.fn(async () => {
      throw new Error("Project Dashboard must not create management suggestions.");
    });

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(state.projects).toEqual(beforeProjects);
    expect(state.repositoryMappings).toEqual(beforeRepositoryMappings);
    expect(state.taskCollections).toEqual(beforeTasks);
    expect(state.employees).toEqual(beforeEmployees);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(state.projectManagementSuggestions).toEqual(beforeSuggestions);
    expect(state.companyInfluencePlan).toEqual(beforeInfluence);
    expect(internals.companyProgressionService.getProgressionSnapshot()).toEqual(beforeProgression);
    expect(internals.employeeNpcMovementService.getSnapshots()).toEqual(beforeMovement);
    expect(internals.employeeDailyScheduleService.getSnapshots()).toEqual(beforeSchedule);
    expect(internals.workstationOccupancyService.getSnapshots()).toEqual(beforeWorkstations);
    expect(internals.aiService.analyzeTask).not.toHaveBeenCalled();
    expect(internals.aiService.recommendEmployeeForTask).not.toHaveBeenCalled();
    expect(internals.aiProjectManagerService.createProjectManagementSuggestion).not.toHaveBeenCalled();
  });

  it("loads fixture-backed repository summaries through the portal flow without creating advisory data", async () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    const fixtureProvider = new MockGitHubRepositoryProvider();
    internals.repositoryService.getRepositorySummary = vi.fn((projectId: string) => fixtureProvider.getRepositorySummary(projectId));
    internals.aiProjectManagerService.createProjectManagementSuggestion = vi.fn(async () => {
      throw new Error("Fixture repository data must not generate project advisory suggestions.");
    });

    const beforeProjects = structuredClone(state.projects);
    const beforeMappings = structuredClone(state.repositoryMappings);
    const beforeSuggestions = structuredClone(state.projectManagementSuggestions);

    controller.updateInput(createInput({ enterPressed: true }));
    await flushPromises();

    expect(internals.repositoryService.getRepositorySummary).toHaveBeenCalledWith("daily-proof");
    expect(state.repositorySummaries["daily-proof"]).toMatchObject({
      name: "daily-proof",
      openIssueCount: 4,
      openPullRequestCount: 2,
      checkStatus: {
        state: "passing",
        label: "CI passing",
      },
      sourceStatus: {
        state: "fresh",
        label: "Fresh",
      },
    });
    expect(state.projectDashboardSnapshot?.externalSources?.[0]).toMatchObject({
      sourceType: "github",
      displayName: "ai-verse/daily-proof",
      statusLabel: "Fresh",
    });
    expect(state.projectDashboardSnapshot?.advisory.status).toBe("empty");
    expect(state.projects).toEqual(beforeProjects);
    expect(state.repositoryMappings).toEqual(beforeMappings);
    expect(state.projectManagementSuggestions).toEqual(beforeSuggestions);
    expect(internals.aiProjectManagerService.createProjectManagementSuggestion).not.toHaveBeenCalled();
  });

  it("moves Project Dashboard Active Work selection and opens the selected task detail", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.taskCollections["daily-proof"] = createMultiTaskCollection();
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ downPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardActiveWorkIndex).toBe(1);

    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("task-detail");
    expect(state.selectedTaskProjectId).toBe("daily-proof");
    expect(state.selectedTaskIndex).toBe(1);
    expect(state.selectedTaskId).toBe("task-review");
  });

  it("leaves Project Dashboard data unchanged when the selected Active Work task is stale", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.taskCollections["daily-proof"] = createTaskCollection();
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = {
      ...controller.getProjectDashboardSnapshot("daily-proof"),
      activeWork: [{
        id: "missing-task",
        title: "Missing task",
        status: "In Progress",
        priority: "High",
        progressPercent: 50,
        updatedAt: "2026-01-01T10:00:00.000Z",
      }],
    };
    const beforeTasks = structuredClone(state.taskCollections);
    const beforeProjects = structuredClone(state.projects);
    const beforeEmployees = structuredClone(state.employees);
    const beforeWorkSessions = structuredClone(state.workSessions);
    const beforeInfluence = structuredClone(state.companyInfluencePlan);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedTaskProjectId).toBeUndefined();
    expect(state.selectedTaskId).toBeUndefined();
    expect(state.taskCollections).toEqual(beforeTasks);
    expect(state.projects).toEqual(beforeProjects);
    expect(state.employees).toEqual(beforeEmployees);
    expect(state.workSessions).toEqual(beforeWorkSessions);
    expect(state.companyInfluencePlan).toEqual(beforeInfluence);
  });

  it("opens selected candidate detail from Project Dashboard with the action input", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.selectedCandidateTaskId).toBe("candidate-12");

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(state.selectedCandidateTaskId).toBeUndefined();
  });

  it("keeps Enter on Project Dashboard available for existing candidate progression", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedCandidateTaskId).toBeUndefined();
    expect(state.candidatePromotionDecisionRecords["daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1"]).toMatchObject({
      promotionStatus: "Approved",
      candidateTaskId: "candidate-12",
    });
  });

  it("leaves Project Dashboard unchanged when selected candidate detail target is stale", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview", "missing-candidate");
    const controller = createControllerHarness(state);
    const beforeCandidateTasks = structuredClone(state.candidateTaskCollections);
    const beforePromotions = structuredClone(state.candidatePromotionReviewCollections);
    const beforeDecisions = structuredClone(state.candidatePromotionDecisionRecords);

    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedCandidateTaskId).toBeUndefined();
    expect(state.candidateTaskCollections).toEqual(beforeCandidateTasks);
    expect(state.candidatePromotionReviewCollections).toEqual(beforePromotions);
    expect(state.candidatePromotionDecisionRecords).toEqual(beforeDecisions);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  view: {
    render: ReturnType<typeof vi.fn>;
    hide: ReturnType<typeof vi.fn>;
    destroy: ReturnType<typeof vi.fn>;
  };
  taskService: {
    getTaskCollection: ReturnType<typeof vi.fn>;
  };
  repositoryService: {
    getRepositorySummary: ReturnType<typeof vi.fn>;
  };
  repositorySyncService: {
    readRepositorySnapshot: ReturnType<typeof vi.fn>;
  };
  issueSyncService: {
    readIssueSnapshots: ReturnType<typeof vi.fn>;
  };
  employeeAIService: EmployeeAIService;
  employeeSimulationService: EmployeeSimulationService;
  employeeNpcMovementService: EmployeeNpcMovementService;
  workstationOccupancyService: WorkstationOccupancyService;
  employeeDailyScheduleService: EmployeeDailyScheduleService;
  companyProgressionService: CompanyProgressionService;
  companyProgressionTriggerService: CompanyProgressionTriggerService;
  officeLayoutService: OfficeLayoutService;
  companyDashboardProvider: InternalSimulationDashboardProvider;
  projectDashboardProvider: InternalSimulationProjectDashboardProvider;
  githubProjectDashboardProvider: GitHubProjectDashboardProvider;
  companyInfluencePlanningService: CompanyInfluencePlanningService;
  aiService: ReturnType<typeof createMockAIService>;
  aiProjectManagerService: AIProjectManagerService;
  repositoryRequestVersion: number;
  repositorySyncRequestVersion: number;
  issueSyncRequestVersion: number;
  taskRequestVersion: number;
  employeeRequestVersion: number;
  employeeNpcBootstrapRequestVersion: number;
  taskAnalysisRequestVersion: number;
  employeeRecommendationRequestVersion: number;
  projectManagerRequestVersion: number;
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
  harness.taskService = {
    getTaskCollection: vi.fn(async () => createTaskCollection()),
  };
  harness.repositoryService = {
    getRepositorySummary: vi.fn(async () => createRepositorySummary()),
  };
  harness.repositorySyncService = {
    readRepositorySnapshot: vi.fn(async () => createRepositorySyncSnapshot()),
  };
  harness.issueSyncService = {
    readIssueSnapshots: vi.fn(async () => createIssueSnapshotCollection()),
  };
  harness.employeeAIService = new EmployeeAIService();
  harness.employeeSimulationService = new EmployeeSimulationService();
  harness.employeeNpcMovementService = new EmployeeNpcMovementService();
  harness.workstationOccupancyService = new WorkstationOccupancyService();
  harness.employeeDailyScheduleService = new EmployeeDailyScheduleService();
  harness.companyProgressionService = new CompanyProgressionService();
  harness.companyProgressionTriggerService = new CompanyProgressionTriggerService();
  harness.officeLayoutService = new OfficeLayoutService();
  harness.companyDashboardProvider = new InternalSimulationDashboardProvider();
  harness.projectDashboardProvider = new InternalSimulationProjectDashboardProvider();
  harness.githubProjectDashboardProvider = new GitHubProjectDashboardProvider();
  harness.companyInfluencePlanningService = new CompanyInfluencePlanningService();
  harness.aiService = createMockAIService();
  harness.aiProjectManagerService = new AIProjectManagerService(harness.aiService);
  harness.repositoryRequestVersion = 0;
  harness.repositorySyncRequestVersion = 0;
  harness.issueSyncRequestVersion = 0;
  harness.taskRequestVersion = 0;
  harness.employeeRequestVersion = 0;
  harness.employeeNpcBootstrapRequestVersion = 0;
  harness.taskAnalysisRequestVersion = 0;
  harness.employeeRecommendationRequestVersion = 0;
  harness.projectManagerRequestVersion = 0;

  return controller;
}

function createRepositorySyncSnapshot(): RepositorySyncSnapshot {
  return {
    provider: "github",
    availability: "available",
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    latestCommit: {
      sha: "abc1234",
      message: "Prepare Daily Proof workspace mock data",
      committedAt: "2026-06-26T18:00:00.000Z",
    },
    syncStatus: "Succeeded",
    lastSuccessfulSyncAt: "2026-06-26T18:30:00.000Z",
  };
}

function createIssueSnapshotCollection(): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [],
    openCount: 0,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-06-26T18:30:00.000Z",
  };
}

function createRepositorySummary(): GitHubRepositorySummary {
  return {
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    latestCommit: {
      sha: "abc1234",
      message: "Prepare Daily Proof workspace mock data",
      authorName: "AIverse",
      committedAt: "2026-06-26T18:00:00.000Z",
    },
    openIssueCount: 0,
    openPullRequestCount: 0,
    checkStatus: {
      state: "passing",
      label: "Checks passing",
    },
    lastUpdatedAt: "2026-06-26T18:30:00.000Z",
    connectionStatus: "connected",
  };
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

function createTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      description: "Read-only project detail slice.",
      status: "In Progress",
      priority: "High",
      projectId: "daily-proof",
      createdAt: "2026-01-01T09:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
  };
}

function createMultiTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [
      {
        id: "task-dashboard",
        title: "Build project dashboard",
        description: "Read-only project detail slice.",
        status: "Review",
        priority: "High",
        projectId: "daily-proof",
        createdAt: "2026-01-01T09:00:00.000Z",
        updatedAt: "2026-01-01T10:00:00.000Z",
      },
      {
        id: "task-review",
        title: "Review project dashboard",
        description: "Review the task board entry action.",
        status: "In Progress",
        priority: "Medium",
        projectId: "daily-proof",
        createdAt: "2026-01-01T09:00:00.000Z",
        updatedAt: "2026-01-01T10:15:00.000Z",
      },
      {
        id: "task-done",
        title: "Archive previous dashboard note",
        description: "Completed task should not appear as active work.",
        status: "Done",
        priority: "Low",
        projectId: "daily-proof",
        createdAt: "2026-01-01T09:00:00.000Z",
        updatedAt: "2026-01-01T10:30:00.000Z",
      },
    ],
  };
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
      issueCreatedAt: "2026-01-01T09:00:00.000Z",
      issueUpdatedAt: "2026-01-01T10:00:00.000Z",
      mappedAt: "2026-01-01T10:05:00.000Z",
      syncedAt: "2026-01-01T10:05:00.000Z",
    }],
    taskCount: 1,
    mappedAt: "2026-01-01T10:05:00.000Z",
    sourceIssueCount: 1,
    sourceIssueSyncStatus: "Succeeded",
    sourceIssueSyncedAt: "2026-01-01T10:00:00.000Z",
  };
}

function createCandidatePromotionCollection(
  status: "PendingReview" | "Approved",
  candidateTaskId = "candidate-12",
): CandidatePromotionReviewCollection {
  return {
    projectId: "daily-proof",
    sourceCandidateTaskStatus: "Succeeded",
    sourceAssignmentStatus: "Succeeded",
    reviewStatus: "Succeeded",
    reviews: [{
      id: `daily-proof:candidate-promotion:${candidateTaskId}:candidate-promotion-v1`,
      projectId: "daily-proof",
      candidateTaskId,
      candidateTaskTitle: "Fix crash on launch",
      candidateTaskType: "Bug",
      candidateTaskPriority: "High",
      candidateTaskState: "Open",
      candidateTaskProvenance: {
        candidateTaskId,
        originatingIssueId: "ai-verse/daily-proof#12",
        issueNumber: 12,
        sourceProvider: "github",
      },
      assignmentRecommendationId: "assignment-12",
      recommendedEmployeeId: "employee-1",
      recommendedEmployeeName: "Ada",
      assignmentStatus: "Recommended",
      promotionStatus: status,
      eligibility: {
        status: "PendingReview",
        isApprovable: true,
        reasonCodes: ["ELIGIBLE_RECOMMENDED_ASSIGNMENT"],
        summary: "Ready for promotion.",
      },
      availableActions: status === "PendingReview" ? ["Approved", "Deferred", "Rejected"] : ["Deferred"],
      rulesetVersion: "candidate-promotion-v1",
    }],
    reviewCount: 1,
    selectedIndex: 0,
    generatedAt: "2026-01-01T10:10:00.000Z",
    rulesetVersion: "candidate-promotion-v1",
    sourceCandidateTaskCount: 1,
    sourceAssignmentCount: 1,
  };
}

function createEmployee(): Employee {
  return {
    id: "employee-1",
    name: "Ada",
    role: "Engineer",
    status: "Working",
    avatarColor: "#64748b",
    capabilities: ["TypeScript"],
    description: "Project dashboard test employee",
    assignedTaskId: "task-dashboard",
    currentProjectId: "daily-proof",
  };
}

function createSuggestion(): ProjectManagementSuggestion {
  return {
    projectId: "daily-proof",
    healthSummary: {
      projectId: "daily-proof",
      status: "watch",
      summary: "Daily Proof has 1 active task and 0 completed tasks.",
      totalTasks: 1,
      activeTasks: 1,
      completedTasks: 0,
      activeEmployees: 1,
      recentActivityCount: 1,
    },
    risks: [{
      id: "risk-1",
      projectId: "daily-proof",
      severity: "medium",
      message: "Dashboard advisory needs review.",
      relatedTaskIds: ["task-dashboard"],
    }],
    nextAction: {
      projectId: "daily-proof",
      action: "Reduce project risk",
      reason: "Critical dashboard work needs attention.",
      taskId: "task-dashboard",
    },
    createdAt: "2026-01-01T11:45:00.000Z",
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}
