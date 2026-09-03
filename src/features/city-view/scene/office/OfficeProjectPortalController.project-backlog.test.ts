import { describe, expect, it, vi } from "vitest";

import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import {
  createInput,
  createSceneStub,
  getControllerInternals,
} from "./OfficeProjectPortalController.testHelpers";
import type { ProjectRegistryEntry } from "./project-registry/ProjectRegistryTypes";

describe("OfficeProjectPortalController project backlog", () => {
  it("creates different persisted backlogs for Project A and Project B and restores A after switching", () => {
    const storage = createMemoryStorage();
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage }),
    });
    const internals = getControllerInternals(controller);
    seedProjects(internals);

    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");
    expect(controller.shouldShowProjectBacklogInput()).toBe(true);

    expect(controller.createBacklogTaskFromInput({
      title: "Add customer search",
      description: "Add customer search to the admin page.",
      priority: "high",
    })).toBe(true);
    expect(controller.createBacklogTaskFromInput({
      title: "Fix invoice export",
      description: "Keep selected filters in exported invoices.",
      priority: "normal",
    })).toBe(true);

    openBacklog(controller, internals, "project-b");
    expect(internals.state.projectBacklogCollections["project-b"]?.tasks ?? []).toEqual([]);
    expect(controller.createBacklogTaskFromInput({
      title: "Add photo tagging",
      description: "Create manual tagging for uploaded photos.",
      priority: "urgent",
    })).toBe(true);

    openBacklog(controller, internals, "project-a");
    expect(internals.state.projectBacklogCollections["project-a"].tasks.map((task) => task.title)).toEqual([
      "Add customer search",
      "Fix invoice export",
    ]);
    expect(internals.state.projectBacklogCollections["project-b"].tasks.map((task) => task.title)).toEqual([
      "Add photo tagging",
    ]);

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(createSeededState());
    expect(restored.projectBacklogCollections["project-a"].tasks).toHaveLength(2);
    expect(restored.projectBacklogCollections["project-b"].tasks[0]).toMatchObject({
      projectId: "project-b",
      title: "Add photo tagging",
    });
  });

  it("edits only the owning project and rejects stale selected task leakage", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage: createMemoryStorage() }),
    });
    const internals = getControllerInternals(controller);
    seedProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");
    controller.createBacklogTaskFromInput({
      title: "Original A",
      description: "Original A description",
      priority: "normal",
    });
    const taskId = internals.state.projectBacklogCollections["project-a"].tasks[0].id;

    openBacklog(controller, internals, "project-b");
    internals.state.selectedBacklogTaskId = taskId;
    expect(controller.updateSelectedBacklogTaskFromInput({
      title: "Leaked edit",
      description: "Should not apply",
      priority: "urgent",
      status: "ready",
    })).toBe(false);
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].title).toBe("Original A");

    openBacklog(controller, internals, "project-a");
    expect(controller.updateSelectedBacklogTaskFromInput({
      title: "Ready A",
      description: "Still a planning artifact.",
      priority: "urgent",
      status: "ready",
    })).toBe(true);
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0]).toMatchObject({
      title: "Ready A",
      status: "ready",
      priority: "urgent",
    });
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].developmentRequestId).toBeUndefined();
    expect(internals.state.projectBacklogCollections["project-a"].tasks[0].executionRunId).toBeUndefined();
    expect(internals.state.externalProjectDevelopmentRequestDrafts["project-a"]).toBeUndefined();
    expect(internals.state.externalProjectAdosRunStatuses["project-a"]).toBeUndefined();
  });

  it("fails closed when the selected backlog project is missing or unavailable", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage: createMemoryStorage() }),
    });
    const internals = getControllerInternals(controller);
    seedProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));

    openBacklog(controller, internals, "missing-project");
    expect(controller.createBacklogTaskFromInput({ title: "Missing", description: "No project." })).toBe(false);

    openBacklog(controller, internals, "project-unavailable");
    expect(controller.createBacklogTaskFromInput({ title: "Unavailable", description: "No local path." })).toBe(false);
    expect(internals.state.projectBacklogCollections["missing-project"]?.tasks ?? []).toEqual([]);
    expect(internals.state.projectBacklogCollections["project-unavailable"]?.tasks ?? []).toEqual([]);
  });

  it("auto-promotes eligible backlog tasks per project without starting ADOS or affecting other projects", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage: createMemoryStorage() }),
    });
    const internals = getControllerInternals(controller);
    seedProjects(internals);
    internals.externalProjectAdosExecutionService = { start: vi.fn() };
    controller.open();
    controller.updateInput(createInput({}));

    openBacklog(controller, internals, "project-a");
    expect(internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: ["high"],
      maxPromotionsPerEvaluation: 1,
    })).toBe(true);
    expect(controller.createBacklogTaskFromInput({
      title: "A1 high",
      description: "Promotable project A task.",
      priority: "high",
    })).toBe(true);
    expect(controller.createBacklogTaskFromInput({
      title: "A2 low",
      description: "Filtered project A task.",
      priority: "low",
    })).toBe(true);

    openBacklog(controller, internals, "project-b");
    expect(controller.createBacklogTaskFromInput({
      title: "B1 urgent",
      description: "Project B stays manual.",
      priority: "urgent",
    })).toBe(true);

    const projectATasks = internals.state.projectBacklogCollections["project-a"].tasks;
    expect(projectATasks.find((task) => task.title === "A1 high")).toMatchObject({
      projectId: "project-a",
      status: "ready",
    });
    expect(projectATasks.find((task) => task.title === "A2 low")).toMatchObject({
      projectId: "project-a",
      status: "backlog",
    });
    expect(internals.state.projectBacklogCollections["project-b"].tasks[0]).toMatchObject({
      projectId: "project-b",
      status: "backlog",
    });
    expect(internals.state.projectBacklogReadinessPromotionPolicies["project-a"]).toMatchObject({
      enabled: true,
      allowedPriorities: ["high"],
    });
    expect(internals.state.projectBacklogReadinessPromotionPolicies["project-b"]?.enabled ?? false).toBe(false);
    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();

    openBacklog(controller, internals, "project-a");
    expect(internals.evaluateSelectedProjectBacklogReadinessPromotion()).toBe(false);
    expect(internals.state.projectBacklogCollections["project-a"].tasks.filter((task) => task.title === "A1 high")).toHaveLength(1);
    expect(internals.state.projectBacklogCollections["project-a"].tasks.find((task) => task.title === "A1 high")?.status).toBe("ready");
    expect(internals.externalProjectAdosExecutionService.start).not.toHaveBeenCalled();
  });

  it("active execution safety blocks auto Ready while manual Ready remains functional", () => {
    const controller = new OfficeProjectPortalController(createSceneStub(), {
      browserOfficeSessionService: new BrowserOfficeSessionService({ storage: createMemoryStorage() }),
    });
    const internals = getControllerInternals(controller);
    seedProjects(internals);
    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");
    expect(internals.updateSelectedProjectBacklogReadinessPromotionPolicy({
      enabled: true,
      allowedPriorities: ["high"],
      maxPromotionsPerEvaluation: 1,
    })).toBe(true);
    internals.state.externalProjectAdosRunStatuses["active-project-a"] = {
      id: "active-project-a",
      projectId: "project-a",
      stage: "Started",
      status: "Started",
      source: "execution",
      reasonCodes: [],
      updatedAt: "2026-09-02T00:00:00.000Z",
      validationStarted: false,
      reviewStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      publishStarted: false,
      mergeStarted: false,
      deployStarted: false,
      rulesVersion: "external-project-ados-run-status-v1",
    };
    expect(controller.createBacklogTaskFromInput({
      title: "Blocked by active run",
      description: "Should stay backlog until active work clears.",
      priority: "high",
    })).toBe(true);

    expect(internals.evaluateSelectedProjectBacklogReadinessPromotion()).toBe(false);
    const task = internals.state.projectBacklogCollections["project-a"].tasks.find((item) => item.title === "Blocked by active run")!;
    expect(task.status).toBe("backlog");
    expect(internals.state.projectBacklogReadinessPromotionPolicies["project-a"].lastEvaluation?.latestResultText)
      .toBe("Skipped: active execution exists");

    expect(controller.updateSelectedBacklogTaskFromInput({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: "ready",
    })).toBe(true);
    expect(internals.state.projectBacklogCollections["project-a"].tasks.find((item) => item.id === task.id)?.status).toBe("ready");
  });
});

function openBacklog(
  controller: OfficeProjectPortalController,
  internals: ReturnType<typeof getControllerInternals>,
  projectId: string,
) {
  internals.state.selectedBacklogProjectId = projectId;
  (controller as unknown as { openProjectBacklog: (projectId: string) => void }).openProjectBacklog(projectId);
}

function createSeededState() {
  const controller = new OfficeProjectPortalController(createSceneStub(), {
    browserOfficeSessionService: new BrowserOfficeSessionService({ storage: createMemoryStorage() }),
  });
  const internals = getControllerInternals(controller);
  seedProjects(internals);
  return internals.state as never;
}

function seedProjects(internals: ReturnType<typeof getControllerInternals>) {
  internals.state.projectRegistryEntries = [
    project("project-a", true),
    project("project-b", true),
    project("project-unavailable", false),
  ];
  internals.state.projects = internals.state.projectRegistryEntries.map((entry) => ({
    id: entry.id,
    name: entry.displayName,
    status: "Active",
    type: "Company",
    enabled: true,
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

function project(id: string, available: boolean): ProjectRegistryEntry {
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
      connectionState: "Configured",
      ...(available ? { localPath: `C:/worktrees/${id}` } : {}),
    },
    owner: { companyName: id },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
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
