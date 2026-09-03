import { describe, expect, it, vi } from "vitest";

import { ProjectBacklogReadinessPromotionPolicyService } from "./ProjectBacklogReadinessPromotionPolicyService";
import { ProjectBacklogService, type ProjectBacklogProjectContext } from "./ProjectBacklogService";
import type { ProjectBacklogCollections, ProjectBacklogPriority, ProjectBacklogTask } from "./ProjectBacklogTypes";
import type { ProjectBacklogReadinessPromotionPolicies } from "./ProjectBacklogReadinessPromotionPolicyTypes";
import type { ProjectPortalProject } from "../OfficeProjectPortalTypes";

const NOW = "2026-09-02T00:00:00.000Z";

describe("ProjectBacklogReadinessPromotionPolicyService", () => {
  it("defaults disabled and fails closed for malformed policy state", () => {
    const service = new ProjectBacklogReadinessPromotionPolicyService({ now: () => NOW });

    expect(service.getPolicy(undefined, "project-a")).toMatchObject({
      projectId: "project-a",
      enabled: false,
      allowedPriorities: ["high"],
      allowedOrigins: ["operator-created", "ai-suggestion-manual", "ai-suggestion-automatic"],
      maxPromotionsPerEvaluation: 1,
      requireNoActiveExecution: true,
      updatedByOperator: false,
    });

    const malformed = { "project-a": { projectId: "project-a", enabled: true } } as never;
    expect(service.getPolicy(malformed, "project-a").enabled).toBe(false);
  });

  it("enables, disables, and persists per project without global fallback", () => {
    const service = new ProjectBacklogReadinessPromotionPolicyService({ now: () => NOW });
    const policies: ProjectBacklogReadinessPromotionPolicies = {};

    expect(service.updatePolicy(policies, context("project-a"), {
      enabled: true,
      allowedPriorities: ["urgent", "high"],
      allowedOrigins: ["operator-created"],
      maxPromotionsPerEvaluation: 9,
    })).toMatchObject({ ok: true });

    expect(policies["project-a"]).toMatchObject({
      enabled: true,
      allowedPriorities: ["high", "urgent"],
      allowedOrigins: ["operator-created"],
      maxPromotionsPerEvaluation: 5,
      updatedByOperator: true,
    });
    expect(service.getPolicy(policies, "project-b").enabled).toBe(false);

    service.updatePolicy(policies, context("project-a"), { enabled: false });
    expect(policies["project-a"].enabled).toBe(false);
  });

  it("promotes exactly one same-project backlog task deterministically and only once", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [
        task("project-a", "a-low", "A2 low", "low", { createdAt: "2026-09-01T00:00:00.000Z" }),
        task("project-a", "a-high", "A1 high", "high", { createdAt: "2026-09-01T02:00:00.000Z" }),
      ]),
      "project-b": collection("project-b", [
        task("project-b", "b-urgent", "B1 urgent", "urgent"),
      ]),
    });
    harness.enable("project-a", ["high"]);

    const first = harness.evaluate("project-a");

    expect(first.promoted.map((item) => item.task.id)).toEqual(["a-high"]);
    expect(first.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["a-low", "PriorityNotAllowed"]);
    expect(harness.backlog["project-a"].tasks.find((item) => item.id === "a-high")).toMatchObject({
      projectId: "project-a",
      status: "ready",
    });
    expect(harness.backlog["project-b"].tasks[0]).toMatchObject({ status: "backlog" });

    const second = harness.evaluate("project-a");
    expect(second.promoted).toEqual([]);
    expect(second.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["a-high", "AlreadyPromoted"]);
    expect(harness.backlog["project-a"].tasks.filter((item) => item.id === "a-high")).toHaveLength(1);
  });

  it("only considers backlog tasks and fails closed for malformed and cross-project tasks", () => {
    const harness = createHarness({
      "project-a": {
        projectId: "project-a",
        tasks: [
          task("project-a", "ready", "Ready", "high", { status: "ready" }),
          task("project-a", "progress", "Progress", "high", { status: "in_progress" }),
          task("project-a", "done", "Done", "high", { status: "completed" }),
          task("project-b", "cross", "Cross", "high"),
          { ...task("project-a", "bad", "", "high"), title: "" },
        ] as ProjectBacklogTask[],
      },
    });
    harness.enable("project-a", ["high"]);

    const result = harness.evaluate("project-a");

    expect(result.promoted).toEqual([]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toEqual([
      ["ready", "AlreadyPromoted"],
      ["progress", "TaskNotBacklog"],
      ["done", "TaskNotBacklog"],
      ["cross", "ProjectMismatch"],
      ["bad", "TaskInvalid"],
    ]);
  });

  it("filters allowed origins including Spec 145 automatic acceptance provenance", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [
        task("project-a", "operator", "Operator task", "high"),
        task("project-a", "manual-ai", "Manual suggestion task", "high", {
          sourceSuggestionId: "suggestion-1",
          suggestionAcceptanceMode: "manual",
        }),
        task("project-a", "auto-ai", "Automatic suggestion task", "high", {
          sourceSuggestionId: "suggestion-2",
          suggestionAcceptanceMode: "automatic",
        }),
      ]),
    });
    harness.enable("project-a", ["high"], ["ai-suggestion-automatic"]);

    const result = harness.evaluate("project-a");

    expect(result.promoted.map((item) => item.task.id)).toEqual(["auto-ai"]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["operator", "OriginNotAllowed"]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["manual-ai", "OriginNotAllowed"]);
  });

  it("orders by configured priority, oldest created timestamp, then stable id and enforces max promotions", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [
        task("project-a", "b", "Normal later", "normal", { createdAt: "2026-09-01T03:00:00.000Z" }),
        task("project-a", "a", "Normal earlier", "normal", { createdAt: "2026-09-01T01:00:00.000Z" }),
        task("project-a", "c", "High item", "high", { createdAt: "2026-09-01T00:00:00.000Z" }),
      ]),
    });
    harness.enable("project-a", ["normal", "high"], undefined, 2);

    const result = harness.evaluate("project-a");

    expect(result.promoted.map((item) => item.task.id)).toEqual(["a", "b"]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["c", "BoundedLimitReached"]);
  });

  it("prevents duplicate ready or active work without invoking execution systems", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [
        task("project-a", "candidate", "Same Work", "high"),
        task("project-a", "ready", "Same Work", "high", { status: "ready" }),
        task("project-a", "active", "Active Work", "high", { developmentRequestId: "draft-1" }),
      ]),
    });
    harness.enable("project-a", ["high"]);
    const startExecution = vi.fn();

    const result = harness.evaluate("project-a");

    expect(result.promoted).toEqual([]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["candidate", "DuplicateReadyOrActiveWork"]);
    expect(result.skipped.map((item) => [item.taskId, item.reason])).toContainEqual(["active", "DuplicateReadyOrActiveWork"]);
    expect(startExecution).not.toHaveBeenCalled();
  });

  it("skips while active execution exists when policy requires no active execution", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [task("project-a", "a-high", "A1 high", "high")]),
    });
    harness.enable("project-a", ["high"]);

    const result = harness.evaluate("project-a", {
      activeRunStatus: {
        id: "run-status-1",
        projectId: "project-a",
        stage: "Started",
        status: "Started",
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
        rulesVersion: "external-project-ados-run-status-v1",
      },
    });

    expect(result.promoted).toEqual([]);
    expect(result.latestResultText).toBe("Skipped: active execution exists");
    expect(harness.backlog["project-a"].tasks[0].status).toBe("backlog");
  });

  it("fails closed for disconnected project and preserves manual Ready transition", () => {
    const harness = createHarness({
      "project-a": collection("project-a", [task("project-a", "a-high", "A1 high", "high")]),
    });
    harness.enable("project-a", ["high"]);

    const disconnected = harness.evaluate("project-a", { project: project("project-a", false) });
    expect(disconnected.promoted).toEqual([]);
    expect(disconnected.latestResultText).toBe("Skipped: project disconnected");

    const manual = harness.backlogService.updateTask(
      harness.backlog,
      context("project-a"),
      "a-high",
      { status: "ready" },
    );
    expect(manual.ok && manual.task.status).toBe("ready");
  });
});

function createHarness(backlog: ProjectBacklogCollections) {
  const service = new ProjectBacklogReadinessPromotionPolicyService({ now: () => NOW });
  const backlogService = new ProjectBacklogService({ now: () => NOW });
  const policies: ProjectBacklogReadinessPromotionPolicies = {};
  return {
    service,
    backlogService,
    backlog,
    policies,
    enable: (
      projectId: string,
      allowedPriorities: ProjectBacklogPriority[],
      allowedOrigins?: Parameters<ProjectBacklogReadinessPromotionPolicyService["updatePolicy"]>[2]["allowedOrigins"],
      maxPromotionsPerEvaluation?: number,
    ) => service.updatePolicy(policies, context(projectId), {
      enabled: true,
      allowedPriorities,
      ...(allowedOrigins ? { allowedOrigins } : {}),
      ...(maxPromotionsPerEvaluation ? { maxPromotionsPerEvaluation } : {}),
    }),
    evaluate: (
      projectId: string,
      overrides: Partial<Parameters<ProjectBacklogReadinessPromotionPolicyService["evaluateAndPromote"]>[0]> = {},
    ) => service.evaluateAndPromote({
      policies,
      project: project(projectId),
      context: context(projectId),
      backlogCollections: backlog,
      backlogService,
      ...overrides,
    }),
  };
}

function collection(projectId: string, tasks: ProjectBacklogTask[]) {
  return { projectId, tasks };
}

function context(id: string): ProjectBacklogProjectContext {
  return {
    projectId: id,
    bindingId: id,
    buildingId: id,
    fallbackCompanyName: id,
    projects: [registryEntry("project-a"), registryEntry("project-b")],
  };
}

function project(id: string, connected = true): ProjectPortalProject {
  const entry = registryEntry(id, connected);
  return {
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
  };
}

function registryEntry(id: string, connected = true) {
  return {
    id,
    displayName: id,
    shortDescription: `${id} project`,
    lifecycleStatus: "Active" as const,
    projectType: "Company",
    localRepository: { connected, label: connected ? "Bound (local)" : "Not connected" },
    ...(connected ? {
      localRepositoryBinding: {
        projectId: id,
        repositoryPath: `C:/repos/${id}`,
        worktreePath: `C:/worktrees/${id}`,
      },
    } : {}),
    repositoryIdentity: {
      provider: "local",
      connectionState: connected ? "Configured" as const : "Unavailable" as const,
      ...(connected ? { localPath: `C:/worktrees/${id}` } : {}),
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
  priority: ProjectBacklogPriority,
  overrides: Partial<ProjectBacklogTask> = {},
): ProjectBacklogTask {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    status: "backlog",
    priority,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}
