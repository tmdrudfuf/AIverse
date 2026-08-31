import { describe, expect, it } from "vitest";

import { ProjectBacklogService } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";

describe("ProjectBacklogService", () => {
  it("creates tasks with canonical project id and keeps Project A and Project B isolated", () => {
    const service = createService();
    const collections: ProjectBacklogCollections = {};

    const a1 = service.createTask(collections, context("project-a"), {
      title: "Add login",
      description: "Add operator login to the admin page.",
      priority: "high",
    });
    const a2 = service.createTask(collections, context("project-a"), {
      title: "Fix invoice export",
      description: "Preserve invoice export filters.",
    });
    const b1 = service.createTask(collections, context("project-b"), {
      title: "Add photo tagging",
      description: "Create manual photo tagging for uploads.",
    });

    expect(a1.ok && a1.task.projectId).toBe("project-a");
    expect(a2.ok && a2.task.projectId).toBe("project-a");
    expect(b1.ok && b1.task.projectId).toBe("project-b");
    expect(collections["project-a"].tasks.map((task) => task.title)).toEqual(["Add login", "Fix invoice export"]);
    expect(collections["project-b"].tasks.map((task) => task.title)).toEqual(["Add photo tagging"]);
  });

  it("switching A to B to A restores the correct ordered project tasks", () => {
    const service = createService();
    const collections: ProjectBacklogCollections = {
      "project-a": { projectId: "project-a", tasks: [task("project-a", "a1", "A task")] },
      "project-b": { projectId: "project-b", tasks: [task("project-b", "b1", "B task")] },
    };

    expect(service.getOrderedCollection(collections, "project-a").tasks.map((item) => item.id)).toEqual(["a1"]);
    expect(service.getOrderedCollection(collections, "project-b").tasks.map((item) => item.id)).toEqual(["b1"]);
    expect(service.getOrderedCollection(collections, "project-a").tasks.map((item) => item.id)).toEqual(["a1"]);
  });

  it("edits only the owning project and rejects stale project/task combinations", () => {
    const service = createService();
    const collections: ProjectBacklogCollections = {
      "project-a": { projectId: "project-a", tasks: [task("project-a", "a1", "A task")] },
      "project-b": { projectId: "project-b", tasks: [task("project-b", "b1", "B task")] },
    };

    const stale = service.updateTask(collections, context("project-b"), "a1", { title: "Leaked" });
    const edited = service.updateTask(collections, context("project-a"), "a1", {
      title: "Updated A task",
      description: "Updated A description",
      priority: "urgent",
      status: "ready",
    });

    expect(stale).toEqual({ ok: false, reason: "ProjectMismatch" });
    expect(edited.ok && edited.task).toMatchObject({
      projectId: "project-a",
      title: "Updated A task",
      description: "Updated A description",
      priority: "urgent",
      status: "ready",
    });
    expect(collections["project-b"].tasks[0].title).toBe("B task");
  });

  it("fails closed for missing or unavailable project mutation", () => {
    const service = createService();
    const collections: ProjectBacklogCollections = {};

    expect(service.createTask(collections, context("missing-project"), {
      title: "Nope",
      description: "Cannot resolve a project.",
    })).toEqual({ ok: false, reason: "MissingProject" });
    expect(service.createTask(collections, context("project-unavailable"), {
      title: "Nope",
      description: "Missing local path disables mutation.",
    })).toEqual({ ok: false, reason: "UnavailableProject" });
    expect(collections).toEqual({});
  });

  it("orders ready and blocked attention states before priority and timestamp tie-breakers", () => {
    const service = createService();
    const tasks = [
      task("project-a", "backlog-urgent", "Backlog urgent", { status: "backlog", priority: "urgent", createdAt: "2026-08-31T00:00:01.000Z" }),
      task("project-a", "ready-normal", "Ready normal", { status: "ready", priority: "normal", createdAt: "2026-08-31T00:00:02.000Z" }),
      task("project-a", "blocked-low", "Blocked low", { status: "blocked", priority: "low", createdAt: "2026-08-31T00:00:03.000Z" }),
      task("project-a", "ready-urgent", "Ready urgent", { status: "ready", priority: "urgent", createdAt: "2026-08-31T00:00:04.000Z" }),
    ];

    expect(service.orderTasks(tasks).map((item) => item.id)).toEqual([
      "ready-urgent",
      "ready-normal",
      "blocked-low",
      "backlog-urgent",
    ]);
  });

  it("persists status transitions without creating development request or execution associations", () => {
    const service = createService();
    const collections: ProjectBacklogCollections = {};
    const created = service.createTask(collections, context("project-a"), {
      title: "Ready task",
      description: "Eligible later only.",
    });
    if (!created.ok) throw new Error("expected task");

    const updated = service.updateTask(collections, context("project-a"), created.task.id, { status: "ready" });

    expect(updated.ok && updated.task.status).toBe("ready");
    expect(updated.ok && updated.task.developmentRequestId).toBeUndefined();
    expect(updated.ok && updated.task.executionRunId).toBeUndefined();
  });

  it("distinguishes backlog blocked planning state from ADOS runtime blocked state", () => {
    const service = createService();
    const summary = service.createSummary({
      projectId: "project-a",
      tasks: [task("project-a", "blocked", "Planning blocked", {
        status: "blocked",
        blockedReason: "Waiting on design choice.",
      })],
    }, "project-a");

    expect(summary).toMatchObject({
      blockedTaskCount: 1,
      hasPlanningBlockedTasks: true,
      indicatorText: "1 Blocked task",
    });
  });
});

function createService() {
  let index = 0;
  const timestamps = [
    "2026-08-31T00:00:00.000Z",
    "2026-08-31T00:00:01.000Z",
    "2026-08-31T00:00:02.000Z",
    "2026-08-31T00:00:03.000Z",
  ];
  return new ProjectBacklogService({
    now: () => timestamps[index++] ?? "2026-08-31T00:00:04.000Z",
    createId: (projectId) => `${projectId}:task:${index}`,
  });
}

function context(projectId: string) {
  return {
    projectId,
    bindingId: projectId,
    buildingId: projectId,
    fallbackCompanyName: projectId,
    projects: projects(),
  };
}

function projects(): ProjectRegistryEntry[] {
  return [
    project("project-a", true),
    project("project-b", true),
    project("project-unavailable", false),
  ];
}

function project(id: string, available: boolean): ProjectRegistryEntry {
  return {
    id,
    displayName: id,
    shortDescription: `${id} project`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: { connected: true, label: "Bound" },
    ...(available ? {
      localRepositoryBinding: {
        projectId: id,
        repositoryPath: `C:/repos/${id}`,
        worktreePath: `C:/worktrees/${id}`,
      },
    } : {}),
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured",
      ...(available ? { localPath: `C:/worktrees/${id}` } : {}),
    },
    owner: { companyName: id },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

function task(
  projectId: string,
  id: string,
  title: string,
  overrides: Partial<ProjectBacklogTask> = {},
): ProjectBacklogTask {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    status: "backlog",
    priority: "normal",
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
    ...overrides,
  };
}

