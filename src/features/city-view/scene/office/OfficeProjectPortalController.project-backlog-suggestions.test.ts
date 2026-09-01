import { describe, expect, it, vi } from "vitest";

import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { createInput, createSceneStub, flushPromises, getControllerInternals } from "./OfficeProjectPortalController.testHelpers";
import { BrowserOfficeSessionService } from "./browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./browser-session/BrowserOfficeSessionTypes";
import type { ProjectBacklogSuggestionProvider } from "./project-backlog/ProjectBacklogSuggestionTypes";

describe("OfficeProjectPortalController backlog suggestions", () => {
  it("requires explicit operator action and does not generate on open or reload", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([{ title: "Add A search", description: "Search Project A backlog." }]);
    const controller = createController(storage, provider);
    const internals = getControllerInternals(controller);
    seedTwoProjects(internals);

    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");

    expect(provider.generateSuggestions).not.toHaveBeenCalled();
    expect(internals.state.projectBacklogSuggestionCollections).toEqual({});

    const reloaded = createController(storage, provider);
    const reloadedInternals = getControllerInternals(reloaded);
    seedTwoProjects(reloadedInternals);
    reloaded.open();
    reloaded.updateInput(createInput({}));

    expect(provider.generateSuggestions).not.toHaveBeenCalled();
  });

  it("generates scoped suggestions, accepts edited text for Project A only, and rejects Project B without backlog mutation", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([
      { title: "Add Project A filters", description: "Persist filters for Project A backlog.", priority: "high" },
      { title: "Add Project A sync notes", description: "Explain Project A sync failures." },
    ]);
    const controller = createController(storage, provider);
    const internals = getControllerInternals(controller);
    seedTwoProjects(internals);
    internals.state.projectBacklogCollections = {
      "project-a": {
        projectId: "project-a",
        tasks: [{
          id: "a-existing",
          projectId: "project-a",
          title: "Existing Project A task",
          description: "Project A context.",
          status: "backlog",
          priority: "normal",
          createdAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
        }],
      },
      "project-b": {
        projectId: "project-b",
        tasks: [{
          id: "b-existing",
          projectId: "project-b",
          title: "Existing Project B task",
          description: "Project B context.",
          status: "backlog",
          priority: "normal",
          createdAt: "2026-08-31T00:00:00.000Z",
          updatedAt: "2026-08-31T00:00:00.000Z",
        }],
      },
    };
    internals.state.externalProjectAdosRunStatuses["project-a"] = adosStatus("project-a", "Started");
    internals.state.externalProjectAdosRunStatuses["project-b"] = adosStatus("project-b", "Blocked");

    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");
    controller.updateInput(createInput({ generateBacklogSuggestionsPressed: true }));
    await flushPromises();

    const projectAPrompt = vi.mocked(provider.generateSuggestions).mock.calls[0][0];
    expect(projectAPrompt.projectId).toBe("project-a");
    expect(JSON.stringify(projectAPrompt)).toContain("Existing Project A task");
    expect(JSON.stringify(projectAPrompt)).not.toContain("Existing Project B task");
    expect(internals.state.projectBacklogSuggestionCollections["project-a"].candidates).toHaveLength(2);
    expect(internals.state.projectBacklogCollections["project-a"].tasks).toHaveLength(1);

    controller.updateInput(createInput({
      acceptBacklogSuggestionPressed: true,
      backlogSuggestionTitle: "Operator Project A title",
      backlogSuggestionDescription: "Operator Project A requirements",
      backlogSuggestionPriority: "urgent",
    }));

    const acceptedTask = internals.state.projectBacklogCollections["project-a"].tasks
      .find((task) => task.title === "Operator Project A title");
    expect(acceptedTask).toMatchObject({
      projectId: "project-a",
      description: "Operator Project A requirements",
      priority: "urgent",
      status: "backlog",
    });
    expect(acceptedTask?.developmentRequestId).toBeUndefined();
    expect(acceptedTask?.executionRunId).toBeUndefined();
    expect(internals.state.externalProjectAdosRunStatuses["project-a"].stage).toBe("Started");

    provider.generateSuggestions = vi.fn(() => [
      { title: "Add Project B labels", description: "Summarize labels for Project B.", priority: "normal" },
    ]);
    openBacklog(controller, internals, "project-b");
    controller.updateInput(createInput({ generateBacklogSuggestionsPressed: true }));
    await flushPromises();
    controller.updateInput(createInput({ rejectBacklogSuggestionPressed: true }));

    const projectBPrompt = vi.mocked(provider.generateSuggestions).mock.calls[0][0];
    expect(projectBPrompt.projectId).toBe("project-b");
    expect(JSON.stringify(projectBPrompt)).toContain("Existing Project B task");
    expect(JSON.stringify(projectBPrompt)).not.toContain("Existing Project A task");
    expect(internals.state.projectBacklogSuggestionCollections["project-b"].candidates[0].status).toBe("rejected");
    expect(internals.state.projectBacklogCollections["project-b"].tasks.map((task) => task.id)).toEqual(["b-existing"]);
  });

  it("persists project-scoped accepted and rejected suggestion state across reload", async () => {
    const storage = createMemoryStorage();
    const provider = providerWith([{ title: "Add A audit", description: "Audit accepted Project A suggestions." }]);
    const controller = createController(storage, provider);
    const internals = getControllerInternals(controller);
    seedTwoProjects(internals);

    controller.open();
    controller.updateInput(createInput({}));
    openBacklog(controller, internals, "project-a");
    await internals.generateProjectBacklogSuggestions();
    internals.acceptSelectedBacklogSuggestion({ title: "Accepted A", description: "Accepted A details" });

    provider.generateSuggestions = vi.fn(() => [{ title: "Add B audit", description: "Audit rejected Project B suggestions." }]);
    openBacklog(controller, internals, "project-b");
    await internals.generateProjectBacklogSuggestions();
    internals.rejectSelectedBacklogSuggestion();

    const reloaded = createController(storage, provider);
    const reloadedInternals = getControllerInternals(reloaded);
    seedTwoProjects(reloadedInternals);
    reloaded.open();
    reloaded.updateInput(createInput({}));

    expect(provider.generateSuggestions).toHaveBeenCalledTimes(1);
    expect(reloadedInternals.state.projectBacklogSuggestionCollections["project-a"].candidates[0].status).toBe("accepted");
    expect(reloadedInternals.state.projectBacklogSuggestionCollections["project-b"].candidates[0].status).toBe("rejected");
    expect(reloadedInternals.state.projectBacklogCollections["project-a"].tasks.some((task) => task.title === "Accepted A")).toBe(true);
    expect(reloadedInternals.state.projectBacklogCollections["project-b"]?.tasks ?? []).toHaveLength(0);
  });
});

function createController(storage: BrowserOfficeSessionStorage, provider: ProjectBacklogSuggestionProvider) {
  return new OfficeProjectPortalController(createSceneStub(), {
    browserOfficeSessionService: new BrowserOfficeSessionService({ storage, now: () => "2026-08-31T00:00:00.000Z" }),
    projectBacklogSuggestionProvider: provider,
  });
}

function providerWith(candidates: unknown[]): ProjectBacklogSuggestionProvider {
  return {
    generateSuggestions: vi.fn(() => candidates),
  };
}

function openBacklog(controller: OfficeProjectPortalController, internals: ReturnType<typeof getControllerInternals>, projectId: string) {
  internals.state.selectedBacklogProjectId = projectId;
  internals.state.viewMode = "project-backlog";
  controller.updateInput(createInput({}));
}

function seedTwoProjects(internals: ReturnType<typeof getControllerInternals>) {
  internals.state.projects = [
    {
      id: "project-a",
      name: "Project A",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "Project A",
      linkedServices: [],
      nextAction: { label: "Open", enabled: true, placeholder: true },
      repositoryIdentity: { provider: "local", connectionState: "Configured", localPath: "C:/repos/project-a" },
    },
    {
      id: "project-b",
      name: "Project B",
      status: "Active",
      type: "Company",
      enabled: true,
      description: "Project B",
      linkedServices: [],
      nextAction: { label: "Open", enabled: true, placeholder: true },
      repositoryIdentity: { provider: "local", connectionState: "Configured", localPath: "C:/repos/project-b" },
    },
  ];
  internals.state.projectRegistryEntries = [
    project("project-a", "Project A", "Company A"),
    project("project-b", "Project B", "Company B"),
  ];
  internals.state.projectCompanyBindings = [
    { bindingId: "project-a", buildingId: "building-a", projectId: "project-a", companyName: "Company A", status: "bound" },
    { bindingId: "project-b", buildingId: "building-b", projectId: "project-b", companyName: "Company B", status: "bound" },
  ];
}

function project(id: string, displayName: string, companyName: string) {
  return {
    id,
    displayName,
    shortDescription: displayName,
    lifecycleStatus: "Active" as const,
    projectType: "Company",
    localRepository: { connected: true, label: "Bound" },
    localRepositoryBinding: {
      projectId: id,
      repositoryPath: `C:/repos/${id}`,
      worktreePath: `C:/repos/${id}`,
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured" as const,
      localPath: `C:/repos/${id}`,
    },
    owner: { companyName },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

function adosStatus(projectId: string, stage: "Started" | "Blocked") {
  return {
    id: `${projectId}:status`,
    projectId,
    stage,
    status: stage,
    source: "execution" as const,
    reasonCodes: stage === "Blocked" ? ["PROVIDER_UNAVAILABLE"] : [],
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

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}
