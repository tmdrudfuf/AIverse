import { describe, expect, it, vi } from "vitest";

import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
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

describe("OfficeProjectPortalController backlog task development bridge", () => {
  it("selecting a Ready task previews development eligibility without execution", () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({
      title: "Build reports",
      description: "Create report filters.",
      priority: "high",
    });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    internals.externalProjectAdosExecutionService.start = vi.fn();

    const probe = controller.getProjectBacklogProbeState();

    expect(probe).toMatchObject({
      projectId: "project-a",
      selectedTaskTitle: "Build reports",
      selectedTaskStatus: "ready",
      developmentEligible: true,
      hasActiveProjectRun: false,
    });
    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
    expect(internals.state.externalProjectDevelopmentRequestDrafts["project-a"]).toBeUndefined();
    expect(internals.state.externalProjectAdosRunPreparations["project-a"]).toBeUndefined();
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].status).toBe("ready");
  });

  it("explicit Start Development maps the Ready task to the same canonical project and full durable requirements", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    const fullDescription = [
      "Implement export filters.",
      "Keep quoted text \"as data\".",
      "Do not run: cmd /c del C:\\important",
      "```ps1",
      "Invoke-Expression bad",
      "```",
    ].join("\n");
    controller.createBacklogTaskFromInput({
      title: "Build export filters",
      description: fullDescription,
      priority: "urgent",
    });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    const task = internals.state.projectBacklogCollections["project-a"].tasks[0];
    const start = vi.fn(async (
      input: StartExternalProjectAdosExecutionInput,
    ): Promise<StartExternalProjectAdosExecutionOutcome> => ({
      execution: execution(input.projectId, input.preparation!),
      result: startedResult(input.projectId, input.preparation!.id, `${input.projectId}:run`),
    }));
    internals.externalProjectAdosExecutionService.start = start;

    await controller.startSelectedBacklogTaskDevelopment();

    const draft = Object.values(internals.state.externalProjectDevelopmentRequestDrafts)[0];
    const preparation = Object.values(internals.state.externalProjectAdosRunPreparations)[0];
    expect(draft).toBeDefined();
    expect(preparation).toBeDefined();
    if (!draft || !preparation) throw new Error("Expected task-scoped draft and preparation");
    const updatedTask = internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(draft).toMatchObject({
      projectId: "project-a",
      sourceBacklogTaskId: task.id,
    });
    expect(draft.requestText).toContain("Build export filters");
    expect(draft.requestText).toContain(fullDescription);
    expect(draft.requirementsArtifactContent).toContain(`Source backlog task id: ${task.id}`);
    expect(draft.requirementsArtifactContent).toContain(fullDescription);
    expect(preparation.requirementsFileContent).toContain(fullDescription);
    expect(preparation.requirementsFileContent).toContain(`Prepared execution id: ${preparation.id}`);
    expect(start).toHaveBeenCalledOnce();
    expect(start.mock.calls[0]?.[0]).toMatchObject({
      projectId: "project-a",
      project: { id: "project-a" },
      preparation: { projectId: "project-a" },
    });
    expect(updatedTask).toMatchObject({
      projectId: "project-a",
      developmentRequestId: draft.id,
      executionPreparationId: preparation.id,
      executionRunId: "project-a:run",
      status: "in_progress",
    });
  });

  it("keeps sequential Ready task executions in the same project associated to their own task records", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({ title: "First task", description: "First durable request." });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    controller.createBacklogTaskFromInput({ title: "Second task", description: "Second durable request." });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    internals.externalProjectAdosExecutionService.start = vi.fn(async (input) => ({
      execution: {
        ...execution(input.projectId, input.preparation!),
        id: `${input.projectId}:run:${input.preparation!.id}`,
      },
      result: startedResult(input.projectId, input.preparation!.id, `${input.projectId}:run:${input.preparation!.id}`),
    }));

    const firstCreatedTaskId = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "First task")?.id;
    const secondCreatedTaskId = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "Second task")?.id;
    expect(firstCreatedTaskId).toBeDefined();
    expect(secondCreatedTaskId).toBeDefined();
    if (!firstCreatedTaskId || !secondCreatedTaskId) throw new Error("Expected two created backlog tasks");

    internals.state.selectedBacklogTaskId = firstCreatedTaskId;
    await controller.startSelectedBacklogTaskDevelopment();
    const firstTask = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.id === firstCreatedTaskId)!;
    const firstDraftId = firstTask.developmentRequestId;
    const firstPreparationId = firstTask.executionPreparationId;
    const firstRunId = firstTask.executionRunId;

    internals.state.selectedBacklogTaskId = secondCreatedTaskId;
    await controller.startSelectedBacklogTaskDevelopment();
    const secondTask = internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.id === secondCreatedTaskId)!;

    expect(internals.externalProjectAdosExecutionService.start).toHaveBeenCalledTimes(2);
    expect(firstTask.developmentRequestId).toContain(firstTask.id);
    expect(secondTask.developmentRequestId).toContain(secondTask.id);
    expect(secondTask.developmentRequestId).not.toBe(firstDraftId);
    expect(secondTask.executionPreparationId).not.toBe(firstPreparationId);
    expect(secondTask.executionRunId).not.toBe(firstRunId);
    expect(Object.values(internals.state.externalProjectDevelopmentRequestDrafts)).toHaveLength(2);
    expect(Object.values(internals.state.externalProjectAdosRunPreparations)).toHaveLength(2);
    expect(Object.values(internals.state.externalProjectAdosExecutions)).toHaveLength(2);

    internals.state.selectedBacklogTaskId = firstTask.id;
    const firstProbe = controller.getProjectBacklogProbeState();
    internals.state.selectedBacklogTaskId = secondTask.id;
    const secondProbe = controller.getProjectBacklogProbeState();

    expect(firstProbe.associatedDevelopmentRequestId).toBe(firstDraftId);
    expect(firstProbe.associatedExecutionRunId).toBe(firstRunId);
    expect(secondProbe.associatedDevelopmentRequestId).toBe(secondTask.developmentRequestId);
    expect(secondProbe.associatedExecutionRunId).toBe(secondTask.executionRunId);
  });

  it("does not create duplicate requests or runs for a repeated Start Development", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({ title: "Build once", description: "Only one run.", priority: "high" });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    internals.externalProjectAdosExecutionService.start = vi.fn(async (input) => ({
      execution: execution(input.projectId, input.preparation!),
      result: startedResult(input.projectId, input.preparation!.id, `${input.projectId}:run`),
    }));

    await controller.startSelectedBacklogTaskDevelopment();
    await controller.startSelectedBacklogTaskDevelopment();

    expect(internals.externalProjectAdosExecutionService.start).toHaveBeenCalledTimes(1);
    expect(Object.values(internals.state.externalProjectDevelopmentRequestDrafts)).toHaveLength(1);
    expect(Object.values(internals.state.externalProjectAdosExecutions)).toHaveLength(1);
  });

  it("reload reconnects the existing association and does not relaunch", async () => {
    const storage = createMemoryStorage();
    const first = createController(storage);
    openBacklog(first.controller, first.internals, "project-a");
    first.controller.createBacklogTaskFromInput({ title: "Reload bridge", description: "Persist association." });
    first.controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    first.internals.externalProjectAdosExecutionService.start = vi.fn(async (input) => ({
      execution: execution(input.projectId, input.preparation!),
      result: startedResult(input.projectId, input.preparation!.id, `${input.projectId}:run`),
    }));
    await first.controller.startSelectedBacklogTaskDevelopment();

    const second = createController(storage);
    openBacklog(second.controller, second.internals, "project-a");
    second.internals.externalProjectAdosExecutionService.start = vi.fn();
    const probe = second.controller.getProjectBacklogProbeState();

    const task = second.internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(probe.associatedDevelopmentRequestId).toBe(task.developmentRequestId);
    expect(probe.associatedExecutionRunId).toBe("project-a:run");
    expect(probe.developmentEligible).toBe(false);
    expect(second.internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
  });

  it("fails closed for Project A task selected under Project B and ignores latest global run", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({ title: "A task", description: "Must stay in A." });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    const aTaskId = internals.state.projectBacklogCollections["project-a"].tasks[0].id;
    internals.state.externalProjectAdosExecutions["project-b"] = execution("project-b", preparation("project-b"));
    openBacklog(controller, internals, "project-b");
    internals.state.selectedBacklogTaskId = aTaskId;
    internals.externalProjectAdosExecutionService.start = vi.fn();

    await controller.startSelectedBacklogTaskDevelopment();

    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
    expect(internals.state.externalProjectDevelopmentRequestDrafts["project-b"]).toBeUndefined();
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].executionRunId).toBeUndefined();
  });

  it("keeps planning blocked distinct from execution blocked and does not mark in_progress when blocked before acceptance", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({ title: "Blocked execution", description: "Provider unavailable." });
    controller.updateSelectedBacklogTaskFromInput({ status: "ready" });
    const start = vi.fn(async (
      input: StartExternalProjectAdosExecutionInput,
    ): Promise<StartExternalProjectAdosExecutionOutcome> => ({
      result: {
        ...startedResult(input.projectId, input.preparation!.id, undefined),
        status: "Blocked" as const,
        reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE" as const],
        started: false,
        implementerStarted: false,
      },
    }));
    internals.externalProjectAdosExecutionService.start = start;

    await controller.startSelectedBacklogTaskDevelopment();

    const task = internals.state.projectBacklogCollections["project-a"].tasks[0];
    expect(task.status).toBe("ready");
    expect(task.executionRunId).toBeUndefined();
    expect(Object.values(internals.state.externalProjectAdosRunStatuses)[0]).toMatchObject({
      stage: "Blocked",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"],
    });

    controller.updateSelectedBacklogTaskFromInput({ status: "blocked", blockedReason: "Waiting on operator." });
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0]).toMatchObject({
      status: "blocked",
      blockedReason: "Waiting on operator.",
    });
    expect(Object.values(internals.state.externalProjectAdosRunStatuses)[0]?.stage).toBe("Blocked");
  });

  it("disables execution for unavailable and non-Ready tasks", async () => {
    const { controller, internals } = createController();
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({ title: "Backlog task", description: "Not ready." });
    internals.externalProjectAdosExecutionService.start = vi.fn();

    await controller.startSelectedBacklogTaskDevelopment();
    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();

    openBacklog(controller, internals, "project-unavailable");
    await controller.startSelectedBacklogTaskDevelopment();
    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
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

function openBacklog(
  controller: OfficeProjectPortalController,
  internals: ReturnType<typeof getControllerInternals>,
  projectId: string,
) {
  internals.state.selectedBacklogProjectId = projectId;
  (controller as unknown as { openProjectBacklog: (projectId: string) => void }).openProjectBacklog(projectId);
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
    ...(entry.localRepositoryBinding ? {} : { unavailableReason: "MissingLocalPath" }),
  }));
}

function projectEntry(id: string, available: boolean): ProjectRegistryEntry {
  return {
    id,
    displayName: id === "project-a" ? "Project A" : id === "project-b" ? "Project B" : "Unavailable Project",
    shortDescription: `${id} project`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: { connected: true, label: "Bound (local)" },
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

function preparation(projectId: string): ExternalProjectAdosRunPreparation {
  return {
    id: `${projectId}:external-ados-run-preparation`,
    projectId,
    developmentRequestDraftId: `${projectId}:external-development-request-draft`,
    status: "Prepared",
    featureId: "202608310102-build-feature",
    featureBranch: "codex/202608310102-build-feature",
    authoritativeBaseSha: "runtime-derived",
    specPath: "specs/202608310102-build-feature/spec.md",
    requirementsFilePath: `.aiverse/external-requests/${projectId}/20260831010203000-requirements.md`,
    requirementsFileContent: "# Development Request",
    validationCommands: [
      "npm test",
      "npx tsc --noEmit",
      "npm run build",
      "npm run test:e2e:home-canvas",
      "git diff --check",
      "git diff --cached --check",
    ],
    reviewerCommand: "claude -p",
    executionPolicyVersion: 1,
    createdAt: "2026-08-31T01:02:03.000Z",
    updatedAt: "2026-08-31T01:02:03.000Z",
    sideEffectBoundary: "Local preparation only.",
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
    startedAt: "2026-08-31T02:00:00.000Z",
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

function startedResult(projectId: string, preparationId: string, executionId: string | undefined) {
  return {
    id: `${projectId}:result`,
    projectId,
    preparationId,
    executionId,
    status: "Completed" as const,
    reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED" as const],
    started: true,
    duplicateExistingExecution: false,
    implementerStarted: true,
    validationStarted: false as const,
    reviewStarted: false as const,
    repositoryMutationStarted: false as const,
    githubMutationStarted: false as const,
    publishStarted: false as const,
    mergeStarted: false as const,
    deployStarted: false as const,
    resultAt: "2026-08-31T02:00:00.000Z",
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
