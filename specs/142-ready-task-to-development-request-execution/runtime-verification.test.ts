import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";

import { BrowserOfficeSessionService } from "../../src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "../../src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes";
import { ExternalProjectAdosExecutionService } from "../../src/features/city-view/scene/office/external-ados-execution/ExternalProjectAdosExecutionService";
import type {
  ImplementerRuntimeProvider,
  ImplementerRuntimeProviderCommand,
  ImplementerRuntimeProviderResult,
} from "../../src/features/city-view/scene/office/implementer-runtime/ImplementerRuntimeProvider";
import { deriveLiveAgentWorkState } from "../../src/features/city-view/scene/office/LiveAgentWorkVisualization";
import { OfficeProjectPortalController } from "../../src/features/city-view/scene/office/OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  getControllerInternals,
} from "../../src/features/city-view/scene/office/OfficeProjectPortalController.testHelpers";
import type { ProjectPortalProject, ProjectPortalState } from "../../src/features/city-view/scene/office/OfficeProjectPortalTypes";
import type { ProjectRegistryEntry } from "../../src/features/city-view/scene/office/project-registry/ProjectRegistryTypes";

const PROJECT_ID = "spec-142-disposable-project";
const PROJECT_NAME = "Spec 142 Disposable Project";
const COMPANY_NAME = "Spec 142 Test Company";
const TASK_TITLE = "Bridge Ready backlog task to ADOS";
const TASK_DESCRIPTION = [
  "Build the selected Ready backlog task through the existing Spec 138 request path.",
  "Preserve quotes, newlines, and shell-like text as data.",
  "Do not execute: powershell -NoProfile -Command \"Remove-Item C:\\important\"",
  "```ps1",
  "Invoke-Expression $operatorText",
  "```",
].join("\n");
const NOW = "2026-08-31T12:00:00.000Z";
const EVIDENCE_PATH = path.join(process.cwd(), "specs/142-ready-task-to-development-request-execution/runtime-evidence.json");
const DISPOSABLE_PROJECT_EVIDENCE_PATH = `.agent-workflow/disposable-projects/${PROJECT_ID}`;

type CapturingProvider = ImplementerRuntimeProvider & {
  commands: ImplementerRuntimeProviderCommand[];
  invoke: Mock<(command: ImplementerRuntimeProviderCommand) => Promise<ImplementerRuntimeProviderResult>>;
};

describe("Spec 142 runtime bridge verification", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("proves the Ready task to trusted ADOS execution bridge against a disposable project", async () => {
    vi.useFakeTimers({ now: new Date(NOW) });
    const storage = createMemoryStorage();
    const first = createController(storage);
    seedDisposableProject(first.internals);
    const provider = createCapturingProvider();
    first.internals.externalProjectAdosExecutionService = new ExternalProjectAdosExecutionService(provider);

    openBacklog(first.controller, first.internals);
    first.controller.createBacklogTaskFromInput({
      title: TASK_TITLE,
      description: TASK_DESCRIPTION,
      priority: "urgent",
    });
    first.controller.updateSelectedBacklogTaskFromInput({ status: "ready" });

    const selectedTask = first.internals.state.projectBacklogCollections[PROJECT_ID].tasks[0];
    const preview = first.controller.getProjectBacklogProbeState();
    expect(preview).toMatchObject({
      projectId: PROJECT_ID,
      selectedTaskTitle: TASK_TITLE,
      selectedTaskStatus: "ready",
      selectedTaskPriority: "urgent",
      developmentEligible: true,
      hasActiveProjectRun: false,
    });
    expect(provider.invoke).not.toHaveBeenCalled();
    expect(Object.values(first.internals.state.externalProjectDevelopmentRequestDrafts)).toHaveLength(0);

    const started = await first.controller.startSelectedBacklogTaskDevelopment();
    expect(started).toBe(true);
    expect(provider.invoke).toHaveBeenCalledOnce();

    const associationKey = `${PROJECT_ID}:backlog-task:${selectedTask.id}`;
    const draft = first.internals.state.externalProjectDevelopmentRequestDrafts[associationKey];
    const preparation = first.internals.state.externalProjectAdosRunPreparations[associationKey];
    const execution = first.internals.state.externalProjectAdosExecutions[associationKey];
    const status = first.internals.state.externalProjectAdosRunStatuses[associationKey];
    const updatedTask = first.internals.state.projectBacklogCollections[PROJECT_ID].tasks[0];
    const command = provider.commands[0];
    expect(draft).toBeDefined();
    expect(preparation).toBeDefined();
    expect(execution).toBeDefined();
    expect(status).toBeDefined();
    if (!draft || !preparation || !execution || !status || !command) {
      throw new Error("Expected disposable runtime bridge records");
    }

    const writtenRequirementsPath = path.join(process.cwd(), preparation.requirementsFilePath ?? "");
    const writtenRequirements = readFileSync(writtenRequirementsPath, "utf8");
    const liveState = deriveLiveAgentWorkState(first.internals.state as ProjectPortalState);

    expect(draft).toMatchObject({
      projectId: PROJECT_ID,
      title: TASK_TITLE,
      sourceBacklogTaskId: selectedTask.id,
    });
    expect(preparation.requirementsFileContent).toContain(TASK_DESCRIPTION);
    expect(writtenRequirements).toBe(preparation.requirementsFileContent);
    expect(command.command).toBe("claude");
    expect(command.arguments).toEqual(["--dangerously-skip-permissions", "-p", "{{prompt}}"]);
    expect(command.workingDirectory).toBe(disposableProjectPath());
    expect(command.prompt).not.toContain(TASK_DESCRIPTION);
    expect(JSON.stringify(command.arguments)).not.toContain("Invoke-Expression");
    expect(command.files?.[0]).toMatchObject({
      relativePath: preparation.requirementsFilePath,
      baseDirectory: "applicationRoot",
      content: preparation.requirementsFileContent,
    });
    expect(updatedTask).toMatchObject({
      projectId: PROJECT_ID,
      status: "in_progress",
      developmentRequestId: draft.id,
      executionPreparationId: preparation.id,
      executionRunId: execution.id,
      executionAcceptedAt: NOW,
    });
    expect(liveState).toMatchObject({
      projectId: PROJECT_ID,
      lifecycle: "complete",
      stage: "complete",
      stageLabel: "Complete",
      specPath: preparation.specPath,
      featureBranch: preparation.featureBranch,
    });
    expect(liveState.projectStatus.rows).toContain(`Request ${TASK_TITLE}`);
    expect(liveState.projectStatus.rows.some((row) => row.startsWith(`Run id ${PROJECT_ID}`))).toBe(true);

    const second = createController(storage);
    seedDisposableProject(second.internals);
    openBacklog(second.controller, second.internals);
    second.internals.externalProjectAdosExecutionService.start = vi.fn();
    const reloadProbe = second.controller.getProjectBacklogProbeState();

    expect(reloadProbe.associatedDevelopmentRequestId).toBe(draft.id);
    expect(reloadProbe.associatedPreparationId).toBe(preparation.id);
    expect(reloadProbe.associatedExecutionRunId).toBe(execution.id);
    expect(reloadProbe.developmentEligible).toBe(false);
    expect(second.internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();

    const evidence = {
      scenario: "Spec 142 Ready backlog task to development request execution bridge",
      capturedAt: NOW,
      disposableProject: {
        projectId: PROJECT_ID,
        projectName: PROJECT_NAME,
        companyName: COMPANY_NAME,
        repositoryPath: toPersistedEvidencePath(disposableProjectPath()),
        worktreePath: toPersistedEvidencePath(disposableProjectPath()),
      },
      readyTask: {
        taskId: selectedTask.id,
        title: TASK_TITLE,
        priority: "urgent",
        statusBeforeStart: "ready",
        descriptionPreserved: preparation.requirementsFileContent?.includes(TASK_DESCRIPTION) ?? false,
      },
      previewOnly: {
        eligible: preview.developmentEligible,
        providerInvocationsBeforeStart: 0,
        requestCountBeforeStart: 0,
      },
      explicitStart: {
        accepted: started,
        providerInvocationCount: provider.invoke.mock.calls.length,
        command: command.command,
        arguments: command.arguments,
        taskTextInPrompt: command.prompt.includes(TASK_DESCRIPTION),
        taskTextInArguments: JSON.stringify(command.arguments).includes("Invoke-Expression"),
      },
      developmentRequest: {
        id: draft.id,
        projectId: draft.projectId,
        sourceBacklogTaskId: draft.sourceBacklogTaskId,
        title: draft.title,
        containsFullDescription: draft.requestText?.includes(TASK_DESCRIPTION) ?? false,
      },
      durableRequirementsArtifact: {
        path: preparation.requirementsFilePath,
        writtenBytes: writtenRequirements.length,
        containsFullDescription: writtenRequirements.includes(TASK_DESCRIPTION),
        containsSourceBacklogTaskId: writtenRequirements.includes(`Source backlog task id: ${selectedTask.id}`),
        containsDevelopmentRequestId: preparation.developmentRequestDraftId === draft.id,
        containsPreparedExecutionId: writtenRequirements.includes(`Prepared execution id: ${preparation.id}`),
      },
      trustedExecution: {
        executionId: execution.id,
        status: execution.status,
        trustedLocalExecutionApproved: execution.trustedLocalExecutionApproved,
        implementerStarted: execution.implementerStarted,
        validationStarted: execution.validationStarted,
        reviewStarted: execution.reviewStarted,
        repositoryMutationStarted: execution.repositoryMutationStarted,
        githubMutationStarted: execution.githubMutationStarted,
      },
      association: {
        associationKey,
        taskDevelopmentRequestId: updatedTask.developmentRequestId,
        taskPreparationId: updatedTask.executionPreparationId,
        taskRunId: updatedTask.executionRunId,
        statusProjectId: status.projectId,
        statusExecutionId: status.executionId,
      },
      reloadReconnect: {
        associatedDevelopmentRequestId: reloadProbe.associatedDevelopmentRequestId,
        associatedPreparationId: reloadProbe.associatedPreparationId,
        associatedExecutionRunId: reloadProbe.associatedExecutionRunId,
        relaunchedExecution: false,
      },
      liveProjectStatus: {
        lifecycle: liveState.lifecycle,
        stage: liveState.stage,
        summary: liveState.projectStatus.summary,
        rows: liveState.projectStatus.rows,
      },
    };
    writeEvidence(evidence);
  });

  it("persists disposable project paths relative to any parent feature worktree", () => {
    const firstRoot = "C:/Users/tmdru/Desktop/Ky-Project/AIverse-controlled-autonomous-backlog-execution-policy";
    const secondRoot = "C:/Users/tmdru/Desktop/Ky-Project/AIverse-controlled-ai-suggestion-acceptance-policy";

    const firstProjectPath = disposableProjectPath(firstRoot);
    const secondProjectPath = disposableProjectPath(secondRoot);

    expect(firstProjectPath).not.toBe(secondProjectPath);
    expect(toPersistedEvidencePath(firstProjectPath, firstRoot)).toBe(DISPOSABLE_PROJECT_EVIDENCE_PATH);
    expect(toPersistedEvidencePath(secondProjectPath, secondRoot)).toBe(DISPOSABLE_PROJECT_EVIDENCE_PATH);
  });
});

function createController(storage = createMemoryStorage()) {
  const controller = new OfficeProjectPortalController(createSceneStub(), {
    browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
  });
  const internals = getControllerInternals(controller);
  controller.open();
  controller.updateInput(createInput({}));
  return { controller, internals };
}

function seedDisposableProject(internals: ReturnType<typeof getControllerInternals>) {
  const project = disposableProject();
  const entry = disposableProjectEntry();
  mkdirSync(disposableProjectPath(), { recursive: true });
  internals.state.projectRegistryEntries = [entry];
  internals.state.projects = [project];
  internals.state.projectCompanyBindings = [{
    bindingId: `${PROJECT_ID}-building`,
    buildingId: `${PROJECT_ID}-building`,
    projectId: PROJECT_ID,
    companyName: COMPANY_NAME,
    status: "bound",
  }];
  internals.state.activeProjectCompanyContext = {
    binding: internals.state.projectCompanyBindings[0],
    projectId: PROJECT_ID,
    displayName: PROJECT_NAME,
    companyName: COMPANY_NAME,
    localRepositoryBinding: entry.localRepositoryBinding,
    repositoryIdentity: entry.repositoryIdentity,
    status: "bound",
  };
  internals.state.selectedProjectIndex = 0;
  internals.state.selectedProjectId = PROJECT_ID;
  internals.state.selectedProjectDashboardProjectId = PROJECT_ID;
  internals.state.selectedBacklogProjectId = PROJECT_ID;
}

function openBacklog(
  controller: OfficeProjectPortalController,
  internals: ReturnType<typeof getControllerInternals>,
) {
  internals.state.selectedBacklogProjectId = PROJECT_ID;
  (controller as unknown as { openProjectBacklog: (projectId: string) => void }).openProjectBacklog(PROJECT_ID);
}

function disposableProject(): ProjectPortalProject {
  const projectPath = disposableProjectPath();
  return {
    id: PROJECT_ID,
    name: PROJECT_NAME,
    status: "Active",
    type: "Company",
    enabled: true,
    description: "Disposable project for Spec 142 runtime bridge verification.",
    linkedServices: [],
    nextAction: { label: "Review workspace", enabled: true, placeholder: true },
    ownerCompany: COMPANY_NAME,
    localRepositoryLabel: "Bound disposable local project",
    localRepositoryBinding: {
      projectId: PROJECT_ID,
      repositoryPath: projectPath,
      worktreePath: projectPath,
      branchName: "codex/spec-142-disposable-bridge",
      specPath: "specs/spec-142-disposable-bridge/spec.md",
      source: "runtime-verification",
      boundAt: NOW,
    },
    repositoryIdentity: {
      provider: "local",
      name: PROJECT_NAME,
      localPath: projectPath,
      connectionState: "Configured",
    },
  };
}

function disposableProjectEntry(): ProjectRegistryEntry {
  const projectPath = disposableProjectPath();
  return {
    id: PROJECT_ID,
    displayName: PROJECT_NAME,
    shortDescription: "Disposable project for Spec 142 bridge verification.",
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: {
      connected: true,
      label: "Bound disposable local project",
    },
    localRepositoryBinding: {
      projectId: PROJECT_ID,
      repositoryPath: projectPath,
      worktreePath: projectPath,
      branchName: "codex/spec-142-disposable-bridge",
      specPath: "specs/spec-142-disposable-bridge/spec.md",
      source: "runtime-verification",
      boundAt: NOW,
    },
    repositoryIdentity: {
      provider: "local",
      name: PROJECT_NAME,
      localPath: projectPath,
      connectionState: "Configured",
    },
    owner: { companyName: COMPANY_NAME },
    createdAt: NOW,
    lastActivityAt: NOW,
  };
}

function createCapturingProvider(): CapturingProvider {
  const commands: ImplementerRuntimeProviderCommand[] = [];
  const provider = {
    providerId: "spec-142-disposable-provider",
    commands,
    invoke: vi.fn(async (command: ImplementerRuntimeProviderCommand): Promise<ImplementerRuntimeProviderResult> => {
      commands.push(command);
      for (const file of command.files ?? []) {
        const targetPath = path.join(process.cwd(), file.relativePath);
        mkdirSync(path.dirname(targetPath), { recursive: true });
        writeFileSync(targetPath, file.content, "utf8");
      }
      return {
        status: "Completed",
        evidence: {
          providerId: "spec-142-disposable-provider",
          agentId: "Disposable ADOS Provider",
          role: "Implementer",
          commandDisplay: [command.command, ...command.arguments].join(" "),
          workingDirectory: command.workingDirectory,
          started: true,
          completed: true,
          timedOut: false,
          cancelled: false,
          exitCode: 0,
          durationMs: 42,
          stdoutSummary: "Disposable trusted provider accepted the structured ADOS command.",
          stderrSummary: "",
          outputTruncated: false,
        },
      };
    }),
  } satisfies CapturingProvider;
  return provider;
}

function disposableProjectPath(repositoryRoot = process.cwd()) {
  return path.join(repositoryRoot, ".agent-workflow", "disposable-projects", PROJECT_ID).replace(/\\/g, "/");
}

function toPersistedEvidencePath(absolutePath: string, repositoryRoot = process.cwd()) {
  const normalizedPath = absolutePath.replace(/\\/g, "/");
  const normalizedRoot = repositoryRoot.replace(/\\/g, "/").replace(/\/+$/, "");
  if (normalizedPath === normalizedRoot) return ".";
  const rootPrefix = `${normalizedRoot}/`;
  if (normalizedPath.startsWith(rootPrefix)) return normalizedPath.slice(rootPrefix.length);
  return normalizedPath;
}

function writeEvidence(evidence: unknown) {
  mkdirSync(path.dirname(EVIDENCE_PATH), { recursive: true });
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
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
