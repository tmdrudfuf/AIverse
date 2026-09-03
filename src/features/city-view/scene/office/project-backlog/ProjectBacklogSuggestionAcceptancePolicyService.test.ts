import { describe, expect, it } from "vitest";

import { ProjectBacklogService } from "./ProjectBacklogService";
import { ProjectBacklogSuggestionAcceptancePolicyService } from "./ProjectBacklogSuggestionAcceptancePolicyService";
import { ProjectBacklogSuggestionService } from "./ProjectBacklogSuggestionService";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";
import type { ProjectBacklogCollections, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogSuggestionCandidate, ProjectBacklogSuggestionCollections } from "./ProjectBacklogSuggestionTypes";

describe("ProjectBacklogSuggestionAcceptancePolicyService", () => {
  it("defaults disabled and persists enablement per project without cross-project leakage", () => {
    const service = createService();
    const policies = {};

    expect(service.getPolicy(policies, "project-a")).toMatchObject({
      projectId: "project-a",
      enabled: false,
      allowedPriorities: ["high"],
      maxAutoAcceptPerEvaluation: 1,
      createdTaskInitialStatus: "backlog",
    });

    service.updatePolicy(policies, context("project-a"), { enabled: true, allowedPriorities: ["high"] });

    expect(service.getPolicy(policies, "project-a").enabled).toBe(true);
    expect(service.getPolicy(policies, "project-b").enabled).toBe(false);
  });

  it("auto-accepts only valid same-project proposed suggestions into backlog with automatic provenance", () => {
    const harness = createHarness();
    harness.service.updatePolicy(harness.policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["high"],
    });
    harness.suggestions["project-a"] = {
      projectId: "project-a",
      candidates: [
        suggestion("project-a", "a1", "Add audit", "high", { generatedAt: "2026-08-31T00:00:00.000Z" }),
        suggestion("project-a", "a2", "Add docs", "low"),
        suggestion("project-a", "a3", "Rejected", "high", { status: "rejected" }),
        suggestion("project-a", "a4", "Accepted", "high", { status: "accepted", acceptedBacklogTaskId: "task-a4" }),
        suggestion("project-a", "a5", "Stale", "high", { status: "stale" }),
      ],
    };

    const result = harness.evaluate("project-a");

    expect(result.accepted.map((item) => item.suggestion.id)).toEqual(["a1"]);
    expect(result.skipped.map((item) => [item.suggestionId, item.reason])).toEqual([
      ["a2", "PriorityNotAllowed"],
      ["a3", "SuggestionNotProposed"],
      ["a4", "AlreadyAccepted"],
      ["a5", "SuggestionNotProposed"],
    ]);
    const task = harness.backlog["project-a"].tasks[0];
    expect(task).toMatchObject({
      projectId: "project-a",
      title: "Add audit",
      priority: "high",
      status: "backlog",
      sourceSuggestionId: "a1",
      suggestionAcceptanceMode: "automatic",
      suggestionAcceptedAt: "2026-09-01T00:00:00.000Z",
    });
    expect(task.status).not.toBe("ready");
    expect(task.developmentRequestId).toBeUndefined();
    expect(task.executionRunId).toBeUndefined();
    expect(harness.suggestions["project-a"].candidates[0]).toMatchObject({
      status: "accepted",
      acceptedBacklogTaskId: task.id,
      acceptanceMode: "automatic",
      acceptedAt: "2026-09-01T00:00:00.000Z",
    });
  });

  it("uses deterministic priority order, oldest timestamp, stable id, and bounded max per evaluation", () => {
    const harness = createHarness();
    harness.service.updatePolicy(harness.policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["normal", "urgent", "high"],
      maxAutoAcceptPerEvaluation: 2,
    });
    harness.suggestions["project-a"] = {
      projectId: "project-a",
      candidates: [
        suggestion("project-a", "z", "Urgent later", "urgent", { generatedAt: "2026-09-01T02:00:00.000Z" }),
        suggestion("project-a", "b", "Normal later", "normal", { generatedAt: "2026-09-01T03:00:00.000Z" }),
        suggestion("project-a", "a", "Normal earlier", "normal", { generatedAt: "2026-09-01T01:00:00.000Z" }),
        suggestion("project-a", "c", "High item", "high", { generatedAt: "2026-09-01T00:00:00.000Z" }),
      ],
    };

    const result = harness.evaluate("project-a");

    expect(result.accepted.map((item) => item.suggestion.id)).toEqual(["a", "b"]);
    expect(result.skipped.some((item) => item.suggestionId === "z" && item.reason === "BoundedLimitReached")).toBe(true);
    expect(harness.backlog["project-a"].tasks.filter((task) => task.projectId === "project-a")).toHaveLength(2);
  });

  it("prevents duplicate titles and repeated evaluation duplicates using existing tasks and associations", () => {
    const harness = createHarness({
      "project-a": {
        projectId: "project-a",
        tasks: [
          task("project-a", "existing", "Existing Work", "ready"),
          task("project-a", "associated", "Converted Work", "backlog", { sourceSuggestionId: "a2" }),
        ],
      },
    });
    harness.service.updatePolicy(harness.policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["high"],
      maxAutoAcceptPerEvaluation: 2,
    });
    harness.suggestions["project-a"] = {
      projectId: "project-a",
      candidates: [
        suggestion("project-a", "a1", "existing work", "high"),
        suggestion("project-a", "a2", "Converted Work", "high"),
        suggestion("project-a", "a3", "New Work", "high"),
      ],
    };

    const first = harness.evaluate("project-a");
    const second = harness.evaluate("project-a");

    expect(first.accepted.map((item) => item.suggestion.id)).toEqual(["a3"]);
    expect(first.skipped.map((item) => [item.suggestionId, item.reason])).toContainEqual(["a1", "DuplicateBacklogItem"]);
    expect(first.skipped.map((item) => [item.suggestionId, item.reason])).toContainEqual(["a2", "AlreadyAccepted"]);
    expect(second.accepted).toEqual([]);
    expect(harness.backlog["project-a"].tasks.filter((item) => item.title === "New Work")).toHaveLength(1);
  });

  it("stops future auto-acceptance after the operator disables the project policy", () => {
    const harness = createHarness();
    harness.service.updatePolicy(harness.policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["high"],
    });
    harness.suggestions["project-a"] = {
      projectId: "project-a",
      candidates: [suggestion("project-a", "a1", "First accepted", "high")],
    };

    expect(harness.evaluate("project-a").accepted.map((item) => item.suggestion.id)).toEqual(["a1"]);

    harness.service.updatePolicy(harness.policies, context("project-a"), { enabled: false });
    harness.suggestions["project-a"].candidates.push(suggestion("project-a", "a2", "Second stays proposed", "high"));

    const disabled = harness.evaluate("project-a");

    expect(disabled.latestResultText).toBe("Skipped: policy disabled");
    expect(disabled.accepted).toEqual([]);
    expect(harness.suggestions["project-a"].candidates.find((candidate) => candidate.id === "a2")?.status).toBe("proposed");
    expect(harness.backlog["project-a"].tasks.map((item) => item.title)).toEqual(["First accepted"]);
  });

  it("fails closed for malformed, cross-project, disabled, and disconnected project inputs", () => {
    const harness = createHarness();
    harness.service.updatePolicy(harness.policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["high"],
    });
    harness.suggestions["project-a"] = {
      projectId: "project-a",
      candidates: [
        suggestion("project-a", "bad", "", "high"),
        suggestion("project-a", "cross", "Mentions project-b", "high"),
        suggestion("project-b", "wrong-project-id", "Wrong project identity", "high"),
      ],
    };

    expect(harness.evaluate("project-a").skipped.map((item) => item.reason)).toEqual([
      "InvalidSuggestion",
      "InvalidSuggestion",
      "ProjectMismatch",
    ]);
    expect(harness.backlog["project-a"]?.tasks ?? []).toHaveLength(0);

    harness.service.updatePolicy(harness.policies, context("project-b"), {
      enabled: false,
      allowedPriorities: ["urgent"],
    });
    harness.suggestions["project-b"] = {
      projectId: "project-b",
      candidates: [suggestion("project-b", "b1", "Project B urgent", "urgent")],
    };
    expect(harness.evaluate("project-b").latestResultText).toBe("Skipped: policy disabled");
    expect(harness.suggestions["project-b"].candidates[0].status).toBe("proposed");

    const disconnected = harness.evaluate("project-a", {
      ...project("project-a"),
      repositoryIdentity: { provider: "local", connectionState: "Unavailable" },
    });
    expect(disconnected.latestResultText).toBe("Skipped: project disconnected");
  });
});

function createHarness(backlog: ProjectBacklogCollections = {}) {
  const backlogService = new ProjectBacklogService({
    now: () => "2026-09-01T00:00:00.000Z",
    createId: (projectId) => `${projectId}:task:${(backlog[projectId]?.tasks.length ?? 0) + 1}`,
  });
  const suggestionService = new ProjectBacklogSuggestionService({
    now: () => "2026-09-01T00:00:00.000Z",
    backlogService,
  });
  const service = createService();
  const suggestions: ProjectBacklogSuggestionCollections = {};
  const policies = {};
  return {
    backlog,
    suggestions,
    policies,
    service,
    evaluate: (projectId: string, projectOverride?: ProjectPortalProject) => service.evaluateAndAccept({
      policies,
      project: projectOverride ?? project(projectId),
      context: context(projectId),
      suggestionCollections: suggestions,
      backlogCollections: backlog,
      suggestionService,
      backlogService,
    }),
  };
}

function createService() {
  return new ProjectBacklogSuggestionAcceptancePolicyService({
    now: () => "2026-09-01T00:00:00.000Z",
  });
}

function context(projectId: string) {
  return {
    projectId,
    bindingId: projectId,
    buildingId: projectId,
    fallbackCompanyName: projectId,
    projects: [registryProject("project-a"), registryProject("project-b")],
  };
}

function project(projectId: string): ProjectPortalProject {
  return {
    id: projectId,
    name: projectId,
    status: "Active",
    type: "Company",
    enabled: true,
    description: projectId,
    linkedServices: [],
    nextAction: { label: "Open", enabled: true, placeholder: true },
    localRepositoryBinding: {
      projectId,
      repositoryPath: `C:/repos/${projectId}`,
      worktreePath: `C:/repos/${projectId}`,
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured",
      localPath: `C:/repos/${projectId}`,
    },
  };
}

function registryProject(projectId: string) {
  return {
    id: projectId,
    displayName: projectId,
    shortDescription: projectId,
    lifecycleStatus: "Active" as const,
    projectType: "Company",
    localRepository: { connected: true, label: "Bound" },
    localRepositoryBinding: {
      projectId,
      repositoryPath: `C:/repos/${projectId}`,
      worktreePath: `C:/repos/${projectId}`,
    },
    repositoryIdentity: {
      provider: "local",
      connectionState: "Configured" as const,
      localPath: `C:/repos/${projectId}`,
    },
    owner: { companyName: projectId },
    createdAt: "2026-09-01T00:00:00.000Z",
    lastActivityAt: "2026-09-01T00:00:00.000Z",
  };
}

function suggestion(
  projectId: string,
  id: string,
  title: string,
  priority: "low" | "normal" | "high" | "urgent",
  overrides: Partial<ProjectBacklogSuggestionCandidate> = {},
): ProjectBacklogSuggestionCandidate {
  return {
    id,
    projectId,
    title,
    description: `${title || "Missing"} description`,
    sourceContextSummary: "context",
    generatedAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    status: "proposed",
    suggestedPriority: priority,
    ...overrides,
  };
}

function task(
  projectId: string,
  id: string,
  title: string,
  status: ProjectBacklogTask["status"],
  overrides: Partial<ProjectBacklogTask> = {},
): ProjectBacklogTask {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    status,
    priority: "high",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}
