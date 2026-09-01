import { describe, expect, it } from "vitest";

import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ExternalProjectAdosRunStatus } from "../external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectBacklogProjectContext } from "./ProjectBacklogService";
import { ProjectAutonomousExecutionPolicyService } from "./ProjectAutonomousExecutionPolicyService";
import type { ProjectAutonomyPolicies } from "./ProjectAutonomousExecutionPolicyTypes";
import type { ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";

describe("ProjectAutonomousExecutionPolicyService", () => {
  it("defaults missing and malformed project policy to off", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });

    expect(service.getPolicy(undefined, "project-a")).toMatchObject({
      projectId: "project-a",
      enabled: false,
      allowedPriorities: [],
      maxConcurrentExecutions: 1,
      requireNoActiveRun: true,
      allowedTaskStatuses: ["ready"],
      updatedByOperator: false,
    });

    expect(service.clonePolicies({
      "project-a": { projectId: "project-b", enabled: true },
    } as unknown as ProjectAutonomyPolicies)).toEqual({});
  });

  it("persists operator enablement only for the canonical project", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomyPolicies = {};

    const result = service.updatePolicy(policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["urgent", "high"],
    });

    expect(result.ok).toBe(true);
    expect(policies["project-a"]).toMatchObject({
      enabled: true,
      allowedPriorities: ["high", "urgent"],
      updatedByOperator: true,
    });
    expect(service.getPolicy(policies, "project-b").enabled).toBe(false);
  });

  it("does not enable autonomy until the operator selects at least one allowed priority", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomyPolicies = {};

    const result = service.updatePolicy(policies, context("project-a"), {
      enabled: true,
      allowedPriorities: [],
    });

    expect(result.ok).toBe(true);
    expect(policies["project-a"]).toMatchObject({
      enabled: false,
      allowedPriorities: [],
      updatedByOperator: true,
    });
    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "urgent")],
    })).toMatchObject({ state: "off", reason: "PolicyDisabled" });
  });

  it("fails closed when policy is off, project unavailable, or project disconnected", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies: ProjectAutonomyPolicies = {
      "project-a": enabledPolicy("project-a", ["high"]),
      "project-b": enabledPolicy("project-b", ["urgent"]),
    };

    expect(service.evaluate({
      policies: {},
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "high")],
    })).toMatchObject({ state: "off", reason: "PolicyDisabled" });

    expect(service.evaluate({
      policies,
      project: project("project-b", false),
      context: context("project-b", false),
      tasks: [task("project-b", "urgent")],
    })).toMatchObject({ state: "off", reason: "ProjectUnavailable" });

    expect(service.evaluate({
      policies,
      project: { ...project("project-a"), repositoryIdentity: { provider: "local", connectionState: "Unavailable" } },
      context: context("project-a"),
      tasks: [task("project-a", "high")],
    })).toMatchObject({ state: "off", reason: "ProjectDisconnected" });
  });

  it("filters non-Ready and disallowed priority tasks without creating work", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["urgent"]) };

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "high")],
    })).toMatchObject({ state: "waiting", reason: "PriorityNotAllowed" });

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "urgent", { status: "backlog" })],
    })).toMatchObject({ state: "waiting", reason: "TaskNotReady" });
  });

  it("selects deterministically by priority, oldest Ready timestamp, and task id", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["urgent", "high"]) };

    const result = service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [
        task("project-a", "high", { id: "task-z", updatedAt: "2026-08-31T02:00:00.000Z" }),
        task("project-a", "urgent", { id: "task-b", updatedAt: "2026-08-31T01:00:00.000Z" }),
        task("project-a", "urgent", { id: "task-a", updatedAt: "2026-08-31T01:00:00.000Z" }),
      ],
    });

    expect(result).toMatchObject({
      state: "eligible",
      selectedTask: { id: "task-a", priority: "urgent" },
      eligibleTaskCount: 3,
    });
  });

  it("blocks when active or blocked project execution exists", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["high"]) };

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "high")],
      activeRunStatus: runStatus("project-a", "Started"),
    })).toMatchObject({ state: "blocked", reason: "ActiveRunExists" });

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "high")],
      activeRunStatus: runStatus("project-a", "Blocked"),
    })).toMatchObject({ state: "blocked", reason: "ActiveRunExists" });
  });

  it("ignores cross-project tasks and stops when no eligible Ready task exists", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["high"]) };

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-b", "high")],
    })).toMatchObject({ state: "waiting", reason: "NoEligibleReadyTask" });
  });

  it("does not treat existing task associations as new eligibility", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["high"]) };

    expect(service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks: [task("project-a", "high", { developmentRequestId: "request-1" })],
    })).toMatchObject({ state: "waiting", reason: "TaskAlreadyAssociated" });
  });

  it("reports unavailable execution services without mutating backlog or suggestions", () => {
    const service = new ProjectAutonomousExecutionPolicyService({ now: () => NOW });
    const policies = { "project-a": enabledPolicy("project-a", ["high"]) };
    const tasks = [task("project-a", "high")];

    const result = service.evaluate({
      policies,
      project: project("project-a"),
      context: context("project-a"),
      tasks,
      executionAvailable: false,
    });

    expect(result).toMatchObject({ state: "blocked", reason: "ExecutionUnavailable" });
    expect(tasks).toHaveLength(1);
  });
});

const NOW = "2026-09-01T00:00:00.000Z";

function enabledPolicy(projectId: string, allowedPriorities: ProjectBacklogPriority[]) {
  return {
    projectId,
    enabled: true,
    allowedPriorities,
    maxConcurrentExecutions: 1,
    requireNoActiveRun: true,
    allowedTaskStatuses: ["ready" as const],
    updatedAt: NOW,
    updatedByOperator: true,
  };
}

function project(id: string, available = true): ProjectPortalProject {
  return {
    id,
    name: id,
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

function context(id: string, available = true): ProjectBacklogProjectContext {
  return {
    projectId: id,
    bindingId: id,
    buildingId: id,
    fallbackCompanyName: `${id} company`,
    projects: [{
      id,
      displayName: id,
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
      createdAt: NOW,
      lastActivityAt: NOW,
    }],
  };
}

function task(projectId: string, priority: ProjectBacklogPriority, overrides: Partial<ProjectBacklogTask> = {}): ProjectBacklogTask {
  return {
    id: `${projectId}:task`,
    projectId,
    title: `${projectId} task`,
    description: "Build the requested work.",
    status: "ready",
    priority,
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
    updatedAt: NOW,
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
