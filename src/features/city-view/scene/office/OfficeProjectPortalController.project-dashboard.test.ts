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
import {
  EXTERNAL_PROJECT_DRAFT_ID,
  addExternalProjectDraftToState,
  applyExternalProjectDraftRepositoryIdentityChoiceToState,
  createProjectPortalState,
} from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import type {
  StartExternalProjectAdosExecutionInput,
  StartExternalProjectAdosExecutionOutcome,
} from "./external-ados-execution/ExternalProjectAdosExecutionService";
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
  it("adds and selects an external project draft from the Company Dashboard flow", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = -3;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.selectedProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
    expect(state.selectedProjectIndex).toBe(state.projects.findIndex((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID));
    expect(state.projectRegistryEntries.filter((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      id: EXTERNAL_PROJECT_DRAFT_ID,
      name: "External Project Draft",
      status: "Planned",
      type: "External",
      enabled: false,
      ownerCompany: "AIverse External",
      localRepositoryLabel: "Not connected",
      repositoryIdentity: {
        provider: "local",
        connectionState: "Unknown",
      },
    });
    expect(state.repositoryMappings.some((mapping) => mapping.projectId === EXTERNAL_PROJECT_DRAFT_ID)).toBe(false);
    expect(internals.view.render).toHaveBeenCalled();
  });

  it("reselects the existing external project draft instead of creating duplicates", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = -3;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));
    state.selectedProjectIndex = -3;
    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.projectRegistryEntries.filter((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(state.projects.filter((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(state.selectedProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
  });

  it("persists the external project draft through browser session state", () => {
    const storage = createMemoryStorage();
    const state = createProjectPortalState({ browserOfficeSessionService: false });
    state.isOpen = true;
    state.justOpened = false;
    state.selectedProjectIndex = -3;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.browserOfficeSessionService = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-24T00:00:00.000Z",
    });

    controller.updateInput(createInput({ enterPressed: true }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );
    expect(restored.projectRegistryEntries.filter((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(restored.projects.filter((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(restored.selectedProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
    expect(restored.repositoryMappings.some((mapping) => mapping.projectId === EXTERNAL_PROJECT_DRAFT_ID)).toBe(false);
  });

  it("opens the external project repository identity edit overlay from the draft dashboard and applies a choice", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("repository-identity-edit");
    expect(state.selectedRepositoryIdentityChoiceIndex).toBe(2);

    state.selectedRepositoryIdentityChoiceIndex = 0;
    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
    expect(state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      localRepository: {
        connected: true,
        label: "Bound (local)",
      },
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)?.localRepositoryLabel).toBe("Bound (local)");
  });

  it("cancels the external project repository identity edit overlay without mutation", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "repository-identity-edit";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    state.selectedRepositoryIdentityChoiceIndex = 0;
    const before = JSON.stringify(state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID));
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(JSON.stringify(state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID))).toBe(before);
  });

  it("persists edited external project repository identity through browser session state", () => {
    const storage = createMemoryStorage();
    const state = createProjectPortalState({ browserOfficeSessionService: false });
    addExternalProjectDraftToState(state);
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "repository-identity-edit";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    state.selectedRepositoryIdentityChoiceIndex = 0;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.browserOfficeSessionService = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-24T00:00:00.000Z",
    });

    controller.updateInput(createInput({ enterPressed: true }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );
    const restoredDraft = restored.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID);
    expect(restoredDraft).toMatchObject({
      localRepository: {
        connected: true,
        label: "Bound (local)",
      },
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
    expect(restored.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)?.localRepositoryLabel).toBe("Bound (local)");
  });

  it("applies external project repository identity from the dashboard without changing project-list selection", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "repository-identity-edit";
    state.selectedProjectIndex = 0;
    state.selectedProjectId = "daily-proof";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    state.selectedRepositoryIdentityChoiceIndex = 0;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
    expect(state.selectedProjectIndex).toBe(0);
    expect(state.selectedProjectId).toBe("daily-proof");
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
  });

  it("creates an external project development request draft from a configured draft dashboard", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));

    expect(Object.keys(state.externalProjectDevelopmentRequestDrafts)).toEqual([EXTERNAL_PROJECT_DRAFT_ID]);
    expect(state.externalProjectDevelopmentRequestDrafts[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      status: "Draft",
      title: "Development request for External Project Draft",
      repositoryProvider: "local",
      repositoryOwner: "AIverse",
      repositoryName: "AIverse",
      branchName: "codex/126-external-project-repository-identity-edit-overlay",
      specPath: "specs/126-external-project-repository-identity-edit-overlay/spec.md",
    });
    expect(state.viewMode).toBe("project-dashboard");
    expect(state.repositorySyncSnapshots[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.issueSyncCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
  });

  it("reuses the existing external project development request draft on repeated dashboard activation", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));
    const firstDraft = state.externalProjectDevelopmentRequestDrafts[EXTERNAL_PROJECT_DRAFT_ID];
    controller.updateInput(createInput({ enterPressed: true }));

    expect(Object.keys(state.externalProjectDevelopmentRequestDrafts)).toEqual([EXTERNAL_PROJECT_DRAFT_ID]);
    expect(state.externalProjectDevelopmentRequestDrafts[EXTERNAL_PROJECT_DRAFT_ID]?.id).toBe(firstDraft?.id);
    expect(state.externalProjectDevelopmentRequestDrafts[EXTERNAL_PROJECT_DRAFT_ID]?.createdAt).toBe(firstDraft?.createdAt);
  });

  it("persists external project development request drafts through browser session state", () => {
    const storage = createMemoryStorage();
    const state = createProjectPortalState({ browserOfficeSessionService: false });
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.browserOfficeSessionService = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-24T00:00:00.000Z",
    });

    controller.updateInput(createInput({ actionPressed: true }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );
    expect(restored.externalProjectDevelopmentRequestDrafts[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      status: "Draft",
      repositoryProvider: "local",
      repositoryOwner: "AIverse",
      repositoryName: "AIverse",
    });
  });

  it("creates an external project ADOS run preparation after the development request draft exists", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));

    expect(Object.keys(state.externalProjectAdosRunPreparations)).toEqual([EXTERNAL_PROJECT_DRAFT_ID]);
    expect(state.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      developmentRequestDraftId: `${EXTERNAL_PROJECT_DRAFT_ID}:external-development-request-draft`,
      status: "Prepared",
      featureBranch: "codex/129-trusted-local-ados-execution-bridge",
      authoritativeBaseSha: "00f22e1997979c087a1d85f9a6b01fe5450bfdf5",
      specPath: "specs/129-trusted-local-ados-execution-bridge/spec.md",
      reviewerCommand: "claude -p",
      executionPolicyVersion: 1,
    });
    expect(state.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]?.validationCommands).toContain("npm run test:e2e:home-canvas");
    expect(state.repositorySyncSnapshots[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.issueSyncCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.validationRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.reviewerRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
  });

  it("reuses the existing external project ADOS run preparation on repeated dashboard activation", () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));
    const firstPreparation = state.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID];
    controller.updateInput(createInput({ actionPressed: true }));

    expect(Object.keys(state.externalProjectAdosRunPreparations)).toEqual([EXTERNAL_PROJECT_DRAFT_ID]);
    expect(state.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]?.id).toBe(firstPreparation?.id);
    expect(state.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]?.createdAt).toBe(firstPreparation?.createdAt);
  });

  it("persists external project ADOS run preparations through browser session state", () => {
    const storage = createMemoryStorage();
    const state = createProjectPortalState({ browserOfficeSessionService: false });
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.browserOfficeSessionService = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-24T00:00:00.000Z",
    });

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );
    expect(restored.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      status: "Prepared",
      featureBranch: "codex/129-trusted-local-ados-execution-bridge",
      reviewerCommand: "claude -p",
    });
    expect(restored.externalProjectAdosRunPreparations[EXTERNAL_PROJECT_DRAFT_ID]?.validationCommands).toHaveLength(6);
    expect(restored.validationRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(restored.reviewerRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
  });

  it("starts trusted local external ADOS execution only after preparation exists", async () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    const start = vi.fn(async (input: StartExternalProjectAdosExecutionInput) => createExternalAdosExecutionOutcome(input));
    internals.externalProjectAdosExecutionService = { start };

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    expect(start).not.toHaveBeenCalled();

    controller.updateInput(createInput({ actionPressed: true }));
    await flushPromises();

    expect(start).toHaveBeenCalledOnce();
    expect(start.mock.calls[0]?.[0]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      preparation: {
        id: `${EXTERNAL_PROJECT_DRAFT_ID}:external-ados-run-preparation`,
        featureBranch: "codex/129-trusted-local-ados-execution-bridge",
      },
    });
    expect(state.externalProjectAdosExecutions[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      status: "Completed",
      trustedLocalExecutionApproved: true,
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
    expect(state.externalProjectAdosExecutionResults[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      status: "Completed",
      started: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
    expect(state.validationRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.reviewerRuntimeCollections[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
  });

  it("persists trusted local external ADOS execution through browser session state", async () => {
    const storage = createMemoryStorage();
    const state = createProjectPortalState({ browserOfficeSessionService: false });
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.browserOfficeSessionService = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-25T00:00:00.000Z",
    });
    internals.externalProjectAdosExecutionService = {
      start: vi.fn(async (input: StartExternalProjectAdosExecutionInput) => createExternalAdosExecutionOutcome(input)),
    };

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    await flushPromises();

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(
      createProjectPortalState({ browserOfficeSessionService: false }),
    );
    expect(restored.externalProjectAdosExecutions[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      projectId: EXTERNAL_PROJECT_DRAFT_ID,
      status: "Completed",
      featureBranch: "codex/129-trusted-local-ados-execution-bridge",
      reviewStarted: false,
      githubMutationStarted: false,
    });
    expect(restored.externalProjectAdosExecutionResults[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      status: "Completed",
      started: true,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
  });

  it("records a blocked external ADOS execution result without creating an execution", async () => {
    const state = createProjectPortalState();
    addExternalProjectDraftToState(state);
    applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree");
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = EXTERNAL_PROJECT_DRAFT_ID;
    const controller = createControllerHarness(state);
    const internals = getControllerInternals(controller);
    internals.externalProjectAdosExecutionService = {
      start: vi.fn(async (input: StartExternalProjectAdosExecutionInput) => ({
        result: {
          id: `${input.projectId}:external-ados-execution-result:${input.preparation?.id}:external-ados-execution-v1`,
          projectId: input.projectId,
          preparationId: input.preparation?.id,
          status: "Blocked",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING"],
          started: false,
          duplicateExistingExecution: false,
          implementerStarted: false,
          validationStarted: false,
          reviewStarted: false,
          repositoryMutationStarted: false,
          githubMutationStarted: false,
          publishStarted: false,
          mergeStarted: false,
          deployStarted: false,
          resultAt: "2026-08-25T00:00:00.000Z",
          rulesVersion: "external-ados-execution-v1",
        },
      })),
    };

    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));
    await flushPromises();

    expect(state.externalProjectAdosExecutions[EXTERNAL_PROJECT_DRAFT_ID]).toBeUndefined();
    expect(state.externalProjectAdosExecutionResults[EXTERNAL_PROJECT_DRAFT_ID]).toMatchObject({
      status: "Blocked",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING"],
      started: false,
      validationStarted: false,
      reviewStarted: false,
      githubMutationStarted: false,
    });
  });

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

  it("keeps Space on Active Work when candidate tasks are loaded without a selected promotion", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.taskCollections["daily-proof"] = createMultiTaskCollection();
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("task-detail");
    expect(state.selectedTaskProjectId).toBe("daily-proof");
    expect(state.selectedTaskIndex).toBe(1);
    expect(state.selectedTaskId).toBe("task-review");
    expect(state.selectedCandidateTaskId).toBeUndefined();
  });

  it("keeps Enter on Active Work when candidate tasks are loaded without a selected promotion", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.taskCollections["daily-proof"] = createMultiTaskCollection();
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ downPressed: true }));
    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.viewMode).toBe("task-detail");
    expect(state.selectedTaskProjectId).toBe("daily-proof");
    expect(state.selectedTaskIndex).toBe(1);
    expect(state.selectedTaskId).toBe("task-review");
    expect(state.selectedCandidateTaskId).toBeUndefined();
  });

  it("does not treat candidateTasks[0] as a selected candidate detail target", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ openCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedCandidateTaskId).toBeUndefined();
  });

  it("keeps Space available for existing candidate promotion status cycling", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("Approved");
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ actionPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedCandidateTaskId).toBeUndefined();
    expect(state.candidatePromotionDecisionRecords["daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1"]).toMatchObject({
      promotionStatus: "Deferred",
      candidateTaskId: "candidate-12",
    });
  });

  it("opens selected candidate detail from Project Dashboard with the candidate detail input", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ openCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.selectedCandidateTaskId).toBe("candidate-12");

    controller.updateInput(createInput({ escapePressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(state.selectedCandidateTaskId).toBeUndefined();
  });

  it("records an Approved decision from candidate detail and stays on candidate detail", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "candidate-detail";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.selectedCandidateTaskId = "candidate-12";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ approveCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.selectedCandidateTaskId).toBe("candidate-12");
    expect(state.candidatePromotionDecisionRecords["daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1"]).toMatchObject({
      promotionStatus: "Approved",
      candidateTaskId: "candidate-12",
    });
    expect(state.candidatePromotionReviewCollections["daily-proof"].reviews[0].promotionStatus).toBe("Approved");
  });

  it("records Deferred and Rejected decisions from candidate detail for the selected candidate", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "candidate-detail";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.selectedCandidateTaskId = "candidate-12";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ deferCandidateDetailPressed: true }));

    expect(state.candidatePromotionDecisionRecords["daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1"]).toMatchObject({
      promotionStatus: "Deferred",
      candidateTaskId: "candidate-12",
    });

    controller.updateInput(createInput({ rejectCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.candidatePromotionDecisionRecords["daily-proof:candidate-promotion:candidate-12:candidate-promotion-v1"]).toMatchObject({
      promotionStatus: "Rejected",
      candidateTaskId: "candidate-12",
    });
  });

  it("does not record stale candidate detail decisions", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "candidate-detail";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.selectedCandidateTaskId = "missing-candidate";
    state.candidateTaskCollections["daily-proof"] = createCandidateTaskCollection();
    state.candidatePromotionReviewCollections["daily-proof"] = createCandidatePromotionCollection("PendingReview");
    const controller = createControllerHarness(state);
    const beforeCandidateTasks = structuredClone(state.candidateTaskCollections);
    const beforePromotions = structuredClone(state.candidatePromotionReviewCollections);
    const beforeDecisions = structuredClone(state.candidatePromotionDecisionRecords);

    controller.updateInput(createInput({ approveCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.candidateTaskCollections).toEqual(beforeCandidateTasks);
    expect(state.candidatePromotionReviewCollections).toEqual(beforePromotions);
    expect(state.candidatePromotionDecisionRecords).toEqual(beforeDecisions);
  });

  it("opens detail for the selected candidate promotion rather than an unrelated fallback", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "project-dashboard";
    state.selectedProjectDashboardProjectId = "daily-proof";
    state.selectedCandidatePromotionIndex = 1;
    const candidateTasks = createCandidateTaskCollection();
    candidateTasks.tasks.push({
      ...candidateTasks.tasks[0],
      id: "candidate-34",
      originatingIssueId: "ai-verse/daily-proof#34",
      issueNumber: 34,
      title: "Add onboarding checklist",
      summary: "Add onboarding checklist",
    });
    candidateTasks.taskCount = 2;
    state.candidateTaskCollections["daily-proof"] = candidateTasks;
    const candidatePromotions = createCandidatePromotionCollection("PendingReview");
    candidatePromotions.reviews.push({
      ...candidatePromotions.reviews[0],
      id: "daily-proof:candidate-promotion:candidate-34:candidate-promotion-v1",
      candidateTaskId: "candidate-34",
      candidateTaskTitle: "Add onboarding checklist",
      candidateTaskProvenance: {
        ...candidatePromotions.reviews[0].candidateTaskProvenance,
        candidateTaskId: "candidate-34",
        originatingIssueId: "ai-verse/daily-proof#34",
        issueNumber: 34,
      },
    });
    candidatePromotions.reviewCount = 2;
    state.candidatePromotionReviewCollections["daily-proof"] = candidatePromotions;
    const controller = createControllerHarness(state);
    state.projectDashboardSnapshot = controller.getProjectDashboardSnapshot("daily-proof");

    controller.updateInput(createInput({ openCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("candidate-detail");
    expect(state.selectedCandidateTaskId).toBe("candidate-34");
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

    controller.updateInput(createInput({ openCandidateDetailPressed: true }));

    expect(state.viewMode).toBe("project-dashboard");
    expect(state.selectedCandidateTaskId).toBeUndefined();
    expect(state.candidateTaskCollections).toEqual(beforeCandidateTasks);
    expect(state.candidatePromotionReviewCollections).toEqual(beforePromotions);
    expect(state.candidatePromotionDecisionRecords).toEqual(beforeDecisions);
  });

  it("refreshes task completion progression feedback and level triggers when a Review task is marked Done", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "task-detail";
    state.selectedTaskProjectId = "daily-proof";
    state.selectedTaskIndex = 0;
    state.selectedTaskId = "task-dashboard";
    state.taskCollections["daily-proof"] = createReviewTaskCollection();
    state.employees = Array.from({ length: 5 }, (_, index) => createEmployee({
      id: `employee-${index + 1}`,
      name: `Employee ${index + 1}`,
      assignedTaskId: index === 0 ? "task-dashboard" : undefined,
      currentProjectId: index === 0 ? "daily-proof" : undefined,
      status: index === 0 ? "Working" : "Idle",
    }));
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));

    const task = state.taskCollections["daily-proof"].tasks[0];
    expect(task.status).toBe("Done");
    expect(task.activityLog?.[0]).toMatchObject({
      type: "status_changed",
      message: "Task marked done",
    });
    expect(state.taskCompletionProgressionFeedback).toMatchObject({
      projectId: "daily-proof",
      taskId: "task-dashboard",
      taskTitle: "Build project dashboard",
      previousCompanyLevel: 1,
      currentCompanyLevel: 2,
      levelUp: true,
      message: "Task complete: company advanced to level 2.",
    });
    expect(state.taskCompletionProgressionFeedback?.milestoneSummary).toContain("Complete first client project");
    expect(state.receptionDeskUpgradeBenefits).toMatchObject({
      level: 2,
      benefits: expect.arrayContaining(["Reception area unlocked"]),
    });
    expect(state.companyProgressionTriggers[0]).toMatchObject({
      fromLevel: 1,
      toLevel: 2,
    });
    expect(state.companyProgressionTriggers[0]?.milestones.map((milestone) => milestone.milestoneId)).toEqual([
      "complete-first-client-project",
      "hire-five-employees",
    ]);
    expect(state.employees[0]).toMatchObject({
      id: "employee-1",
      status: "Idle",
      assignedTaskId: undefined,
      currentProjectId: undefined,
    });
  });

  it("refreshes reception desk upgrade benefits from current company progression", () => {
    const levelOneState = createProjectPortalState();
    const levelOneController = createControllerHarness(levelOneState);

    levelOneController.open();

    expect(levelOneState.receptionDeskUpgradeBenefits).toBeUndefined();

    const levelTwoState = createProjectPortalState();
    levelTwoState.employees = Array.from({ length: 5 }, (_, index) => createEmployee({ id: `employee-${index + 1}` }));
    levelTwoState.taskCollections["daily-proof"] = createDoneTaskCollection();
    const levelTwoController = createControllerHarness(levelTwoState);

    levelTwoController.open();

    expect(levelTwoState.receptionDeskUpgradeBenefits).toMatchObject({
      source: "reception_desk_upgrade",
      level: 2,
      heading: "Reception Upgrade Benefits",
      benefits: [
        "Reception area unlocked",
        "Employee capacity increased to 10",
        "Workspace coordination now has a front-desk entry point",
      ],
    });
  });

  it("records task completion feedback without a false level-up when only milestone progress changes", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "task-detail";
    state.selectedTaskProjectId = "daily-proof";
    state.selectedTaskIndex = 0;
    state.selectedTaskId = "task-dashboard";
    state.taskCollections["daily-proof"] = createReviewTaskCollection();
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.taskCollections["daily-proof"].tasks[0].status).toBe("Done");
    expect(state.companyProgressionTriggers).toEqual([]);
    expect(state.taskCompletionProgressionFeedback).toMatchObject({
      taskId: "task-dashboard",
      previousCompanyLevel: 1,
      currentCompanyLevel: 1,
      levelUp: false,
      message: "Task complete: progression updated at level 1.",
    });
    expect(state.taskCompletionProgressionFeedback?.milestoneSummary).toContain("Complete first client project 1/1");
    expect(state.taskCompletionProgressionFeedback?.milestoneSummary).toContain("Hire five employees 0/5");
  });

  it("does not create completion progression feedback for non-Done or already Done actions", () => {
    const state = createProjectPortalState();
    state.isOpen = true;
    state.justOpened = false;
    state.viewMode = "task-detail";
    state.selectedTaskProjectId = "daily-proof";
    state.selectedTaskIndex = 0;
    state.selectedTaskId = "task-dashboard";
    state.taskCollections["daily-proof"] = createTaskCollection();
    const controller = createControllerHarness(state);

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.taskCollections["daily-proof"].tasks[0].status).toBe("Review");
    expect(state.taskCompletionProgressionFeedback).toBeUndefined();
    expect(state.companyProgressionTriggers).toEqual([]);

    state.taskCollections["daily-proof"] = createDoneTaskCollection();
    state.selectedTaskId = "task-dashboard";

    controller.updateInput(createInput({ enterPressed: true }));

    expect(state.taskCompletionProgressionFeedback).toBeUndefined();
    expect(state.companyProgressionTriggers).toEqual([]);
  });
});

type ControllerInternals = {
  state: ProjectPortalState;
  view: {
    render: ReturnType<typeof vi.fn>;
    show: ReturnType<typeof vi.fn>;
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
  externalProjectAdosExecutionService: {
    start: ReturnType<typeof vi.fn>;
  };
  browserOfficeSessionService?: BrowserOfficeSessionService;
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
    show: vi.fn(),
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
  harness.externalProjectAdosExecutionService = {
    start: vi.fn(async (input: StartExternalProjectAdosExecutionInput) => createExternalAdosExecutionOutcome(input)),
  };
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

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

function createExternalAdosExecutionOutcome(
  input: StartExternalProjectAdosExecutionInput,
): StartExternalProjectAdosExecutionOutcome {
  const preparation = input.preparation!;
  const binding = input.project!.localRepositoryBinding!;
  const executionId = `${input.projectId}:external-ados-execution:${preparation.id}:external-ados-execution-v1`;
  return {
    execution: {
      id: executionId,
      projectId: input.projectId,
      preparationId: preparation.id,
      developmentRequestDraftId: preparation.developmentRequestDraftId,
      status: "Completed",
      featureBranch: preparation.featureBranch,
      authoritativeBaseSha: preparation.authoritativeBaseSha,
      specPath: preparation.specPath,
      repositoryPath: binding.repositoryPath,
      worktreePath: binding.worktreePath,
      validationCommands: [...preparation.validationCommands],
      reviewerCommand: preparation.reviewerCommand,
      executionPolicyVersion: preparation.executionPolicyVersion,
      trustedLocalExecutionApproved: true,
      startedBy: "Local Human",
      startedAt: "2026-08-25T00:00:00.000Z",
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: "claude --dangerously-skip-permissions -p {{prompt}}",
        workingDirectory: binding.worktreePath,
        started: true,
        completed: true,
        timedOut: false,
        cancelled: false,
        exitCode: 0,
        durationMs: 25,
        stdoutSummary: "done",
        stderrSummary: "",
        outputTruncated: false,
      },
      rulesVersion: "external-ados-execution-v1",
    },
    result: {
      id: `${input.projectId}:external-ados-execution-result:${preparation.id}:external-ados-execution-v1`,
      projectId: input.projectId,
      preparationId: preparation.id,
      executionId,
      status: "Completed",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      started: true,
      duplicateExistingExecution: false,
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      resultAt: "2026-08-25T00:00:00.000Z",
      rulesVersion: "external-ados-execution-v1",
    },
  };
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
    openCandidateDetailPressed: false,
    approveCandidateDetailPressed: false,
    deferCandidateDetailPressed: false,
    rejectCandidateDetailPressed: false,
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

function createReviewTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      description: "Read-only project detail slice.",
      status: "Review",
      priority: "High",
      projectId: "daily-proof",
      assignee: "Employee 1",
      assigneeId: "employee-1",
      createdAt: "2026-01-01T09:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
  };
}

function createDoneTaskCollection(): TaskCollection {
  return {
    projectId: "daily-proof",
    tasks: [{
      id: "task-dashboard",
      title: "Build project dashboard",
      description: "Read-only project detail slice.",
      status: "Done",
      priority: "High",
      projectId: "daily-proof",
      createdAt: "2026-01-01T09:00:00.000Z",
      updatedAt: "2026-01-01T10:00:00.000Z",
    }],
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

function createEmployee(overrides: Partial<Employee> = {}): Employee {
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
    ...overrides,
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
