import { describe, expect, it, vi } from "vitest";

import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ImplementerRuntimeProvider, ImplementerRuntimeProviderCommand } from "../implementer-runtime/ImplementerRuntimeProvider";
import type { ExternalProjectAdosRunPreparation } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationTypes";
import { EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS } from "../external-ados-run-preparation/ExternalProjectAdosRunPreparationService";
import { ExternalProjectAdosExecutionService } from "./ExternalProjectAdosExecutionService";

describe("ExternalProjectAdosExecutionService", () => {
  it("starts the trusted local implementer provider from a prepared external ADOS run", async () => {
    const provider = createStubProvider("Completed", true);
    const outcome = await new ExternalProjectAdosExecutionService(provider).start({
      projectId: "external-project-draft",
      project: createProject(),
      preparation: createPreparation(),
      now: "2026-08-25T00:00:00.000Z",
    });

    expect(provider.invoke).toHaveBeenCalledOnce();
    expect(provider.invoke.mock.calls[0]?.[0]).toMatchObject({
      command: "claude",
      inputMode: "argument",
      workingDirectory: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-trusted-local-ados-execution-bridge",
    });
    expect(provider.invoke.mock.calls[0]?.[0]?.prompt).toContain("Do not start review.");
    expect(outcome.execution).toMatchObject({
      projectId: "external-project-draft",
      status: "Completed",
      featureBranch: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.featureBranch,
      trustedLocalExecutionApproved: true,
      implementerStarted: true,
      validationStarted: false,
      reviewStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
    });
    expect(outcome.result).toMatchObject({
      status: "Completed",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_STARTED"],
      started: true,
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
    });
  });

  it("blocks stale preparation metadata without invoking the provider", async () => {
    const provider = createStubProvider("Completed", true);
    const outcome = await new ExternalProjectAdosExecutionService(provider).start({
      projectId: "external-project-draft",
      project: createProject(),
      preparation: createPreparation({ featureBranch: "codex/old-feature" }),
      now: "2026-08-25T00:00:00.000Z",
    });

    expect(provider.invoke).not.toHaveBeenCalled();
    expect(outcome.execution).toBeUndefined();
    expect(outcome.result).toMatchObject({
      status: "Blocked",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PREPARATION_STALE"],
      started: false,
    });
  });

  it("blocks missing local worktree binding without invoking the provider", async () => {
    const provider = createStubProvider("Completed", true);
    const outcome = await new ExternalProjectAdosExecutionService(provider).start({
      projectId: "external-project-draft",
      project: createProject({ localRepositoryBinding: undefined }),
      preparation: createPreparation(),
      now: "2026-08-25T00:00:00.000Z",
    });

    expect(provider.invoke).not.toHaveBeenCalled();
    expect(outcome.execution).toBeUndefined();
    expect(outcome.result.reasonCodes).toEqual(["EXTERNAL_ADOS_EXECUTION_LOCAL_BINDING_MISSING"]);
  });

  it("reuses an existing execution without invoking the provider again", async () => {
    const provider = createStubProvider("Completed", true);
    const service = new ExternalProjectAdosExecutionService(provider);
    const first = await service.start({
      projectId: "external-project-draft",
      project: createProject(),
      preparation: createPreparation(),
      now: "2026-08-25T00:00:00.000Z",
    });
    const second = await service.start({
      projectId: "external-project-draft",
      project: createProject(),
      preparation: createPreparation(),
      existingExecution: first.execution,
      now: "2026-08-25T00:01:00.000Z",
    });

    expect(provider.invoke).toHaveBeenCalledTimes(1);
    expect(second.execution?.id).toBe(first.execution?.id);
    expect(second.result).toMatchObject({
      status: "Completed",
      reasonCodes: ["EXTERNAL_ADOS_EXECUTION_ALREADY_COMPLETED"],
      duplicateExistingExecution: true,
    });
  });
});

function createStubProvider(
  status: Awaited<ReturnType<ImplementerRuntimeProvider["invoke"]>>["status"],
  started: boolean,
): ImplementerRuntimeProvider & { invoke: ReturnType<typeof vi.fn> } {
  return {
    providerId: "claude",
    invoke: vi.fn(async (command: ImplementerRuntimeProviderCommand) => ({
      status,
      evidence: {
        providerId: "claude",
        agentId: "Claude",
        role: "Implementer",
        commandDisplay: [command.command, ...command.arguments].join(" "),
        workingDirectory: command.workingDirectory,
        started,
        completed: status === "Completed",
        timedOut: status === "TimedOut",
        cancelled: status === "Cancelled",
        exitCode: status === "Completed" ? 0 : undefined,
        durationMs: 25,
        stdoutSummary: "done",
        stderrSummary: "",
        outputTruncated: false,
      },
    })),
  };
}

function createProject(overrides: Partial<ProjectPortalProject> = {}): ProjectPortalProject {
  return {
    id: "external-project-draft",
    name: "External Project Draft",
    status: "Planned",
    type: "External",
    enabled: true,
    description: "Draft external project.",
    linkedServices: [],
    nextAction: { label: "Review project workspace", enabled: true, placeholder: true },
    localRepositoryBinding: {
      projectId: "external-project-draft",
      repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-trusted-local-ados-execution-bridge",
      branchName: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.featureBranch,
      specPath: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.specPath,
      source: "manual",
      boundAt: "2026-08-25T00:00:00.000Z",
    },
    repositoryIdentity: {
      provider: "local",
      owner: "AIverse",
      name: "AIverse",
      localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-trusted-local-ados-execution-bridge",
      connectionState: "Configured",
    },
    ...overrides,
  };
}

function createPreparation(overrides: Partial<ExternalProjectAdosRunPreparation> = {}): ExternalProjectAdosRunPreparation {
  return {
    id: "external-project-draft:external-ados-run-preparation",
    projectId: "external-project-draft",
    developmentRequestDraftId: "external-project-draft:external-development-request-draft",
    status: "Prepared",
    featureBranch: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.featureBranch,
    authoritativeBaseSha: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.authoritativeBaseSha,
    specPath: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.specPath,
    validationCommands: [...EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.validationCommands],
    reviewerCommand: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.reviewerCommand,
    executionPolicyVersion: EXTERNAL_PROJECT_ADOS_RUN_PREPARATION_DEFAULTS.executionPolicyVersion,
    createdAt: "2026-08-25T00:00:00.000Z",
    updatedAt: "2026-08-25T00:00:00.000Z",
    sideEffectBoundary: "Local preparation only.",
    ...overrides,
  };
}
