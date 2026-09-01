import { describe, expect, it, vi } from "vitest";

import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  flushPromises,
  getControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";
import type { ProjectPortalProject } from "./OfficeProjectPortalTypes";
import type { ExternalProjectAdosExecution } from "./external-ados-execution/ExternalProjectAdosExecutionTypes";
import type {
  StartExternalProjectAdosExecutionInput,
  StartExternalProjectAdosExecutionOutcome,
} from "./external-ados-execution/ExternalProjectAdosExecutionService";
import type { ExternalProjectAdosRunPreparation } from "./external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import type { ProjectRegistryEntry } from "./project-registry/ProjectRegistryTypes";

describe("OfficeProjectPortalController autonomous backlog execution", () => {
  it("defaults autonomy off and persists operator enablement by project only", async () => {
    const storage = createMemoryStorage();
    const first = createController(storage);
    openBacklog(first.controller, "project-a");

    expect(first.controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyEnabled: false,
      autonomyState: "off",
      autonomyReason: "PolicyDisabled",
    });

    expect(first.controller.updateSelectedProjectAutonomyPolicy({
      enabled: true,
      allowedPriorities: ["high"],
    })).toBe(true);
    await flushPromises();

    openBacklog(first.controller, "project-b");
    expect(first.controller.getProjectBacklogProbeState()).toMatchObject({
      projectId: "project-b",
      autonomyEnabled: false,
      autonomyReason: "PolicyDisabled",
    });

    const second = createController(storage);
    openBacklog(second.controller, "project-a");
    expect(second.controller.getProjectBacklogProbeState()).toMatchObject({
      projectId: "project-a",
      autonomyEnabled: true,
      autonomyAllowedPriorities: ["high"],
    });
    openBacklog(second.controller, "project-b");
    expect(second.controller.getProjectBacklogProbeState().autonomyEnabled).toBe(false);
  });

  it("does not auto-start Ready tasks when policy is off", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    internals.externalProjectAdosExecutionService.start = vi.fn();

    createReadyTask(controller, "Ready manual task", "high");
    await controller.reevaluateSelectedProjectAutonomy();

    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0]).toMatchObject({
      title: "Ready manual task",
      status: "ready",
    });
  });

  it("selects deterministically and starts through the existing Spec 142 bridge once", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    const start = vi.fn(startedOutcome);
    internals.externalProjectAdosExecutionService.start = start;

    controller.createBacklogTaskFromInput({ title: "High newest", description: "Do work.", priority: "high" });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    controller.createBacklogTaskFromInput({ title: "Urgent B", description: "Do urgent work.", priority: "urgent" });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    controller.createBacklogTaskFromInput({ title: "Urgent A", description: "Do urgent work.", priority: "urgent" });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });

    const urgentA = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Urgent A")!;
    const urgentB = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Urgent B")!;
    urgentA.id = "task-a";
    urgentA.updatedAt = "2026-08-31T01:00:00.000Z";
    urgentB.id = "task-b";
    urgentB.updatedAt = "2026-08-31T01:00:00.000Z";

    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["urgent", "high"] });
    await flushPromises();
    await controller.reevaluateSelectedProjectAutonomy();
    await controller.reevaluateSelectedProjectAutonomy();

    expect(start).toHaveBeenCalledOnce();
    const task = internals.state.projectBacklogCollections["project-a"].tasks.find((item) => item.id === "task-a")!;
    expect(task.status).toBe("in_progress");
    expect(task.developmentRequestId).toBe("project-a:backlog-task:task-a:external-development-request-draft");
    expect(task.executionPreparationId).toBe(`${task.developmentRequestId}:external-ados-run-preparation`);
    expect(task.executionRunId).toBe("project-a:run");
    expect(Object.keys(internals.state.externalProjectDevelopmentRequestDrafts)).toEqual(["project-a:backlog-task:task-a"]);
    expect(Object.keys(internals.state.externalProjectAdosRunPreparations)).toEqual(["project-a:backlog-task:task-a"]);
    expect(Object.keys(internals.state.externalProjectAdosExecutions)).toEqual(["project-a:backlog-task:task-a"]);
  });

  it("blocks another autonomous start for active, associated, or blocked project execution", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    const start = vi.fn(startedOutcome);
    internals.externalProjectAdosExecutionService.start = start;

    createReadyTask(controller, "First run", "high");
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["high"] });
    await flushPromises();

    createReadyTask(controller, "Second run", "high");
    await controller.reevaluateSelectedProjectAutonomy();

    expect(start).toHaveBeenCalledOnce();
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyState: "blocked",
      autonomyReason: "ActiveRunExists",
    });
    expect(internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Second run")?.status).toBe("ready");
  });

  it("failed pre-start evaluation leaves a Ready task unchanged", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    createReadyTask(controller, "Cannot start", "urgent");
    internals.externalProjectAdosExecutionService.start = undefined as unknown as typeof internals.externalProjectAdosExecutionService.start;
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["urgent"] });

    await controller.reevaluateSelectedProjectAutonomy();

    const task = internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(task).toMatchObject({
      title: "Cannot start",
      status: "ready",
    });
    expect(task.developmentRequestId).toBeUndefined();
    expect(task.executionPreparationId).toBeUndefined();
    expect(task.executionRunId).toBeUndefined();
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyState: "blocked",
      autonomyReason: "ExecutionUnavailable",
    });
  });

  it("reload does not relaunch an already associated execution", async () => {
    const storage = createMemoryStorage();
    const first = createController(storage);
    openBacklog(first.controller, "project-a");
    first.internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    createReadyTask(first.controller, "Reload stable", "high");
    first.controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["high"] });
    await flushPromises();
    expect(first.internals.externalProjectAdosExecutionService.start).toHaveBeenCalledOnce();

    const second = createController(storage);
    openBacklog(second.controller, "project-a");
    second.internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    await flushPromises();
    await second.controller.reevaluateSelectedProjectAutonomy();

    expect(second.internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
    expect(Object.values(second.internals.state.externalProjectAdosExecutions)).toHaveLength(1);
  });

  it("disabling autonomy prevents future starts without terminating an active run", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    const start = vi.fn(startedOutcome);
    internals.externalProjectAdosExecutionService.start = start;

    createReadyTask(controller, "Active work", "high");
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["high"] });
    await flushPromises();
    const executionBeforeDisable = Object.values(internals.state.externalProjectAdosExecutions)[0];

    controller.updateSelectedProjectAutonomyPolicy({ enabled: false, allowedPriorities: ["high"] });
    createReadyTask(controller, "Future work", "high");
    await controller.reevaluateSelectedProjectAutonomy();

    expect(start).toHaveBeenCalledOnce();
    expect(Object.values(internals.state.externalProjectAdosExecutions)[0]).toEqual(executionBeforeDisable);
    expect(internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Future work")?.status).toBe("ready");
  });

  it("policy edits do not mutate active run and future selection uses the new priority filter", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);

    createReadyTask(controller, "High work", "high");
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["high"] });
    await flushPromises();
    const execution = Object.values(internals.state.externalProjectAdosExecutions)[0];

    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["urgent"] });
    createReadyTask(controller, "Filtered high", "high");
    await controller.reevaluateSelectedProjectAutonomy();

    expect(Object.values(internals.state.externalProjectAdosExecutions)[0]).toEqual(execution);
    expect(internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Filtered high")?.status).toBe("ready");
  });

  it("does not accept suggestions or create backlog tasks when no eligible Ready task exists", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, "project-a");
    internals.state.projectBacklogSuggestionCollections["project-a"] = {
      projectId: "project-a",
      candidates: [{
        id: "suggestion-a",
        projectId: "project-a",
        title: "Suggested task",
        description: "A suggested task must remain advisory.",
        sourceContextSummary: "Project A",
        generatedAt: "2026-09-01T00:00:00.000Z",
        updatedAt: "2026-09-01T00:00:00.000Z",
        status: "proposed",
        suggestedPriority: "urgent",
      }],
    };

    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["urgent"] });
    await flushPromises();
    await controller.reevaluateSelectedProjectAutonomy();

    expect(internals.state.projectBacklogSuggestionCollections["project-a"].candidates[0].status).toBe("proposed");
    expect(internals.state.projectBacklogCollections["project-a"]?.tasks ?? []).toHaveLength(0);
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      autonomyState: "waiting",
      autonomyReason: "NoEligibleReadyTask",
    });
  });

  it("Project A policy cannot affect Project B Ready tasks", async () => {
    const { controller, internals } = createController();
    internals.externalProjectAdosExecutionService.start = vi.fn(startedOutcome);
    openBacklog(controller, "project-a");
    controller.updateSelectedProjectAutonomyPolicy({ enabled: true, allowedPriorities: ["high"] });
    await flushPromises();

    openBacklog(controller, "project-b");
    createReadyTask(controller, "Project B urgent", "urgent");
    await controller.reevaluateSelectedProjectAutonomy();

    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
    expect(internals.state.projectBacklogCollections["project-b"].tasks[0].status).toBe("ready");
    expect(controller.getProjectBacklogProbeState()).toMatchObject({
      projectId: "project-b",
      autonomyEnabled: false,
    });
  });
});

function createController(storage = createMemoryStorage()) {
  const controller = new OfficeProjectPortalController(createSceneStub(), {
    browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
  });
  const internals = getControllerInternals(controller);
  seedProjects(internals);
  controller.open();
  controller.updateInput(createInput({}));
  return { controller, internals };
}

function openBacklog(controller: OfficeProjectPortalController, projectId: string) {
  (controller as unknown as { openProjectBacklog: (projectId: string) => void }).openProjectBacklog(projectId);
}

function createReadyTask(
  controller: OfficeProjectPortalController,
  title: string,
  priority: "low" | "normal" | "high" | "urgent",
) {
  controller.createBacklogTaskFromInput({
    title,
    description: `${title} description.`,
    priority,
  });
  controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
}

function seedProjects(internals: ReturnType<typeof getControllerInternals>) {
  internals.state.projectRegistryEntries = [
    projectEntry("project-a", true),
    projectEntry("project-b", true),
    projectEntry("project-unavailable", false),
  ];
  internals.state.projects = internals.state.projectRegistryEntries.map((entry): ProjectPortalProject => ({
    id: entry.id,
    name: entry.displayName,
    status: "Active",
    type: "Company",
    enabled: Boolean(entry.localRepositoryBinding),
    description: entry.shortDescription,
    linkedServices: [],
    nextAction: { label: "Review workspace", enabled: true, placeholder: true },
    ownerCompany: entry.owner.companyName,
    localRepositoryLabel: entry.localRepository.label,
    localRepositoryBinding: entry.localRepositoryBinding,
    repositoryIdentity: entry.repositoryIdentity,
  }));
  internals.state.projectCompanyBindings = internals.state.projectRegistryEntries.map((entry) => ({
    bindingId: entry.id,
    buildingId: entry.id,
    projectId: entry.id,
    companyName: entry.owner.companyName,
    status: entry.localRepositoryBinding ? "bound" : "unavailable",
    ...(entry.localRepositoryBinding ? {} : { unavailableReason: "MissingLocalPath" as const }),
  }));
}

function projectEntry(id: string, available: boolean): ProjectRegistryEntry {
  return {
    id,
    displayName: id === "project-a" ? "Project A" : id === "project-b" ? "Project B" : "Unavailable Project",
    shortDescription: `${id} project`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: { connected: available, label: available ? "Bound (local)" : "Not connected" },
    ...(available ? {
      localRepositoryBinding: {
        projectId: id,
        repositoryPath: `C:/repos/${id}`,
        worktreePath: `C:/worktrees/${id}`,
      },
    } : {}),
    repositoryIdentity: {
      provider: "local",
      connectionState: available ? "Configured" : "Unavailable",
      ...(available ? { localPath: `C:/worktrees/${id}` } : {}),
    },
    owner: { companyName: `${id} company` },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

async function startedOutcome(
  input: StartExternalProjectAdosExecutionInput,
): Promise<StartExternalProjectAdosExecutionOutcome> {
  return {
    execution: execution(input.projectId, input.preparation!),
    result: {
      id: `${input.projectId}:result`,
      projectId: input.projectId,
      preparationId: input.preparation!.id,
      executionId: `${input.projectId}:run`,
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
      resultAt: "2026-09-01T00:05:00.000Z",
      rulesVersion: "external-ados-execution-v1",
    },
  };
}

function execution(projectId: string, prep: ExternalProjectAdosRunPreparation): ExternalProjectAdosExecution {
  return {
    id: `${projectId}:run`,
    projectId,
    preparationId: prep.id,
    developmentRequestDraftId: prep.developmentRequestDraftId,
    status: "Completed",
    featureId: prep.featureId,
    featureBranch: prep.featureBranch,
    authoritativeBaseSha: prep.authoritativeBaseSha,
    specPath: prep.specPath,
    requirementsFilePath: prep.requirementsFilePath,
    repositoryPath: `C:/repos/${projectId}`,
    worktreePath: `C:/worktrees/${projectId}`,
    validationCommands: [...prep.validationCommands],
    reviewerCommand: prep.reviewerCommand,
    executionPolicyVersion: prep.executionPolicyVersion,
    trustedLocalExecutionApproved: true,
    startedBy: "Local Human",
    startedAt: "2026-09-01T00:04:00.000Z",
    implementerStarted: true,
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    evidence: {
      providerId: "stub",
      agentId: "Stub",
      role: "Implementer",
      commandDisplay: "claude -p",
      workingDirectory: `C:/worktrees/${projectId}`,
      started: true,
      completed: false,
      timedOut: false,
      cancelled: false,
      durationMs: 1,
      stdoutSummary: "",
      stderrSummary: "",
      outputTruncated: false,
    },
    rulesVersion: "external-ados-execution-v1",
  };
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
