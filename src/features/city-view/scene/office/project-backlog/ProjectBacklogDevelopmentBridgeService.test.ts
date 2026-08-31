import { describe, expect, it } from "vitest";

import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import { ProjectBacklogDevelopmentBridgeService } from "./ProjectBacklogDevelopmentBridgeService";
import type { ProjectBacklogTask } from "./ProjectBacklogTypes";

describe("ProjectBacklogDevelopmentBridgeService", () => {
  it("selecting a Ready task returns preview data without creating request artifacts", () => {
    const service = new ProjectBacklogDevelopmentBridgeService();
    const preview = service.createPreview({
      project: project("project-a"),
      task: task("project-a", {
        description: "Line one\nLine two && Remove-Item C:/x",
      }),
    });

    expect(preview).toMatchObject({
      projectId: "project-a",
      taskId: "task-a",
      eligible: true,
      planningStatus: "ready",
      taskDescription: "Line one\nLine two && Remove-Item C:/x",
      hasActiveProjectRun: false,
    });
  });

  it("creates a project-scoped development request and durable requirements from full task content", () => {
    const service = new ProjectBacklogDevelopmentBridgeService();
    const maliciousText = "Quotes \"ok\"\n`pwsh`; $(Remove-Item C:/x)\n```ps1\nInvoke-Expression bad\n```";
    const outcome = service.createRequestAndPreparation({
      project: project("project-a"),
      task: task("project-a", { description: maliciousText }),
      now: "2026-08-31T01:02:03.000Z",
    });

    if (!outcome.ok) throw new Error(outcome.reason);
    expect(outcome.draft).toMatchObject({
      projectId: "project-a",
      sourceBacklogTaskId: "task-a",
    });
    expect(outcome.draft.requestText).toContain("# Ready Task");
    expect(outcome.draft.requestText).toContain(maliciousText);
    expect(outcome.draft.requirementsArtifactContent).toContain("Source backlog task id: task-a");
    expect(outcome.draft.requirementsArtifactContent).toContain(maliciousText);
    expect(outcome.preparation.requirementsFileContent).toContain("Prepared execution id: project-a:external-ados-run-preparation");
    expect(outcome.taskPatch).toEqual({
      sourceBacklogTaskId: "task-a",
      developmentRequestId: "project-a:external-development-request-draft",
      executionPreparationId: "project-a:external-ados-run-preparation",
    });
  });

  it("fails closed for project mismatch, non-Ready tasks, unavailable projects, and active runs", () => {
    const service = new ProjectBacklogDevelopmentBridgeService();

    expect(service.createRequestAndPreparation({
      project: project("project-a"),
      task: task("project-b"),
    })).toEqual({ ok: false, reason: "ProjectMismatch" });
    expect(service.createRequestAndPreparation({
      project: project("project-a"),
      task: task("project-a", { status: "backlog" }),
    })).toEqual({ ok: false, reason: "TaskNotReady" });
    expect(service.createRequestAndPreparation({
      project: project("project-a", false),
      task: task("project-a"),
    })).toEqual({ ok: false, reason: "ProjectUnavailable" });
    expect(service.createRequestAndPreparation({
      project: project("project-a"),
      task: task("project-a"),
      existingRunStatus: runStatus("project-a", "Started"),
    })).toEqual({ ok: false, reason: "ConflictingActiveExecution" });
  });
});

function project(id: string, available = true): ProjectPortalProject {
  return {
    id,
    name: id === "project-a" ? "Project A" : "Project B",
    status: "Active",
    type: "Company",
    enabled: available,
    description: `${id} project`,
    linkedServices: [],
    nextAction: { label: "Review workspace", enabled: true, placeholder: true },
    ownerCompany: `${id} company`,
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
  };
}

function task(projectId: string, overrides: Partial<ProjectBacklogTask> = {}): ProjectBacklogTask {
  return {
    id: projectId === "project-a" ? "task-a" : "task-b",
    projectId,
    title: "Ready Task",
    description: "Build the requested feature.",
    status: "ready",
    priority: "urgent",
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
    ...overrides,
  };
}

function runStatus(projectId: string, stage: ExternalProjectAdosRunStatus["stage"]): ExternalProjectAdosRunStatus {
  return {
    id: `${projectId}:status`,
    projectId,
    stage,
    status: stage,
    source: "execution",
    reasonCodes: [],
    updatedAt: "2026-08-31T00:00:00.000Z",
    validationStarted: false,
    reviewStarted: false,
    repositoryMutationStarted: false,
    githubMutationStarted: false,
    publishStarted: false,
    mergeStarted: false,
    deployStarted: false,
    rulesVersion: "test",
  };
}
