import { describe, expect, it, vi } from "vitest";

import { ProjectBacklogSuggestionService } from "./ProjectBacklogSuggestionService";
import { ProjectBacklogService } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCollections, ProjectBacklogSuggestionProvider } from "./ProjectBacklogSuggestionTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";

describe("ProjectBacklogSuggestionService", () => {
  it("does not invoke a provider until explicit generation is requested", () => {
    const provider = providerWith([]);

    expect(provider.generateSuggestions).not.toHaveBeenCalled();
  });

  it("generates validated suggestions under the canonical project id with isolated prompt context", async () => {
    const service = createSuggestionService();
    const collections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {
      "project-a": { projectId: "project-a", tasks: [task("project-a", "a1", "Add retry feedback")] },
      "project-b": { projectId: "project-b", tasks: [task("project-b", "b1", "Add photo tagging")] },
    };
    const provider = providerWith([
      {
        title: "Add backlog search",
        description: "Let operators search project backlog tasks by title and status.",
        rationale: "Reduces scanning in planning.",
        priority: "high",
      },
    ]);

    const result = await service.generateSuggestions(collections, context("project-a"), {
      backlogCollections,
      activeWork: ["Project A active run"],
      blockedWork: ["Project A blocked validation"],
      repositorySummary: "Project A repository summary",
    }, provider);

    expect(result.ok && result.candidates[0]).toMatchObject({
      id: "project-a:suggestion:1",
      projectId: "project-a",
      title: "Add backlog search",
      status: "proposed",
      suggestedPriority: "high",
    });
    expect(collections["project-a"].candidates).toHaveLength(1);
    expect(collections["project-b"]).toBeUndefined();
    expect(provider.generateSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: "project-a",
        backlog: [expect.objectContaining({ title: "Add retry feedback" })],
        activeWork: ["Project A active run"],
        blockedWork: ["Project A blocked validation"],
        repositorySummary: "Project A repository summary",
      }),
      3,
    );
    const prompt = vi.mocked(provider.generateSuggestions).mock.calls[0][0];
    expect(JSON.stringify(prompt)).not.toContain("photo tagging");
  });

  it("filters duplicate and malformed candidates without corrupting valid candidates", async () => {
    const service = createSuggestionService();
    const collections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {
      "project-a": { projectId: "project-a", tasks: [task("project-a", "a1", "Add retry feedback")] },
    };
    const provider = providerWith([
      { title: "Add retry feedback", description: "Add retry feedback description", priority: "high" },
      { title: "", description: "Missing title" },
      { title: "Add sync diagnostics", description: "Show the last project sync reason.", priority: "urgent" },
      { title: "Add sync diagnostics", description: "Show the last project sync reason.", priority: "urgent" },
    ]);

    const result = await service.generateSuggestions(collections, context("project-a"), { backlogCollections }, provider);

    expect(result.ok && result.candidates.map((candidate) => candidate.title)).toEqual(["Add sync diagnostics"]);
    expect(collections["project-a"].candidates).toHaveLength(1);
  });

  it("fails safely when provider output is invalid or all candidates are malformed", async () => {
    const service = createSuggestionService();
    const collections: ProjectBacklogSuggestionCollections = {};

    const invalid = await service.generateSuggestions(collections, context("project-a"), {
      backlogCollections: {},
    }, { generateSuggestions: () => "not-array" as never });
    const malformed = await service.generateSuggestions(collections, context("project-a"), {
      backlogCollections: {},
    }, providerWith([{ title: "No details" }]));

    expect(invalid).toEqual({ ok: false, reason: "InvalidProviderOutput" });
    expect(malformed).toEqual({ ok: false, reason: "NoCandidates" });
    expect(collections).toEqual({});
  });

  it("accepts edited suggestion text into the same project backlog without marking Ready or starting execution", async () => {
    const backlogService = createBacklogService();
    const service = createSuggestionService(backlogService);
    const suggestionCollections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {};
    const generated = await service.generateSuggestions(suggestionCollections, context("project-a"), {
      backlogCollections,
    }, providerWith([{ title: "Draft title", description: "Draft details", priority: "low" }]));
    if (!generated.ok) throw new Error("expected suggestions");

    const accepted = service.acceptSuggestion(suggestionCollections, backlogCollections, context("project-a"), generated.candidates[0].id, {
      title: "Operator title",
      description: "Operator requirements",
      priority: "urgent",
    });

    expect(accepted.ok && accepted.task).toMatchObject({
      projectId: "project-a",
      title: "Operator title",
      description: "Operator requirements",
      priority: "urgent",
      status: "backlog",
    });
    expect(accepted.ok && accepted.task?.developmentRequestId).toBeUndefined();
    expect(accepted.ok && accepted.task?.executionRunId).toBeUndefined();
    expect(suggestionCollections["project-a"].candidates[0]).toMatchObject({
      status: "accepted",
      acceptedBacklogTaskId: "project-a:task:1",
    });
  });

  it("prevents duplicate acceptance from creating another backlog task", async () => {
    const backlogService = createBacklogService();
    const service = createSuggestionService(backlogService);
    const suggestionCollections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {};
    const generated = await service.generateSuggestions(suggestionCollections, context("project-a"), {
      backlogCollections,
    }, providerWith([{ title: "Add filters", description: "Add filters to the backlog.", priority: "normal" }]));
    if (!generated.ok) throw new Error("expected suggestions");

    const first = service.acceptSuggestion(suggestionCollections, backlogCollections, context("project-a"), generated.candidates[0].id);
    const second = service.acceptSuggestion(suggestionCollections, backlogCollections, context("project-a"), generated.candidates[0].id);

    expect(first.ok && first.task?.id).toBe("project-a:task:1");
    expect(second).toEqual({ ok: false, reason: "AlreadyAccepted" });
    expect(backlogCollections["project-a"].tasks).toHaveLength(1);
  });

  it("rejects suggestions without creating backlog tasks and suppresses immediate rejected duplicates", async () => {
    const service = createSuggestionService();
    const suggestionCollections: ProjectBacklogSuggestionCollections = {};
    const backlogCollections: ProjectBacklogCollections = {};
    const generated = await service.generateSuggestions(suggestionCollections, context("project-a"), {
      backlogCollections,
    }, providerWith([{ title: "Add issue labels", description: "Expose issue label summaries." }]));
    if (!generated.ok) throw new Error("expected suggestions");

    const rejected = service.rejectSuggestion(suggestionCollections, context("project-a"), generated.candidates[0].id);
    const regenerated = await service.generateSuggestions(suggestionCollections, context("project-a"), {
      backlogCollections,
    }, providerWith([
      { title: "Add issue labels", description: "Expose issue label summaries." },
      { title: "Add issue search", description: "Find synced issues by title." },
    ]));

    expect(rejected.ok && rejected.suggestion.status).toBe("rejected");
    expect(backlogCollections["project-a"]).toBeUndefined();
    expect(regenerated.ok && regenerated.candidates.map((candidate) => candidate.title)).toEqual(["Add issue search"]);
  });

  it("fails closed for missing, unavailable, and cross-project suggestion identity", async () => {
    const service = createSuggestionService();
    const collections: ProjectBacklogSuggestionCollections = {
      "project-a": {
        projectId: "project-a",
        candidates: [suggestion("project-a", "a1", "A suggestion")],
      },
    };

    expect(await service.generateSuggestions(collections, context("missing"), { backlogCollections: {} }, providerWith([])))
      .toEqual({ ok: false, reason: "MissingProject" });
    expect(await service.generateSuggestions(collections, context("project-unavailable"), { backlogCollections: {} }, providerWith([])))
      .toEqual({ ok: false, reason: "UnavailableProject" });
    expect(service.rejectSuggestion(collections, context("project-b"), "a1"))
      .toEqual({ ok: false, reason: "ProjectMismatch" });
  });

  it("clones persisted project-scoped collections and drops cross-project contamination", () => {
    const service = createSuggestionService();
    const cloned = service.cloneCollections({
      "project-a": {
        projectId: "project-a",
        candidates: [
          suggestion("project-a", "a1", "A suggestion"),
          suggestion("project-b", "leak", "B leak"),
        ],
      },
      "project-b": {
        projectId: "project-b",
        candidates: [suggestion("project-b", "b1", "B suggestion")],
      },
    });

    expect(cloned["project-a"].candidates.map((candidate) => candidate.id)).toEqual(["a1"]);
    expect(cloned["project-b"].candidates.map((candidate) => candidate.id)).toEqual(["b1"]);
  });
});

function createSuggestionService(backlogService = createBacklogService()) {
  let index = 0;
  return new ProjectBacklogSuggestionService({
    now: () => "2026-08-31T00:00:00.000Z",
    createId: (projectId) => `${projectId}:suggestion:${++index}`,
    backlogService,
  });
}

function createBacklogService() {
  let index = 0;
  return new ProjectBacklogService({
    now: () => "2026-08-31T00:00:00.000Z",
    createId: (projectId) => `${projectId}:task:${++index}`,
  });
}

function providerWith(candidates: unknown[]): ProjectBacklogSuggestionProvider {
  return {
    generateSuggestions: vi.fn(() => candidates),
  };
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

function task(projectId: string, id: string, title: string, overrides: Partial<ProjectBacklogTask> = {}): ProjectBacklogTask {
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

function suggestion(projectId: string, id: string, title: string) {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    sourceContextSummary: projectId,
    generatedAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
    status: "proposed" as const,
  };
}
