import { describe, expect, it } from "vitest";

import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import {
  createPortfolioOperationsFromBrowserSession,
  derivePortfolioOperations,
  filterPortfolioSummaries,
  orderPortfolioSummariesForAttention,
} from "./PortfolioOperationsService";
import { BrowserOfficeSessionService } from "./office/browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./office/browser-session/BrowserOfficeSessionTypes";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import type { ExternalProjectAdosRunStatus } from "./office/external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectRegistryEntry } from "./office/project-registry/ProjectRegistryTypes";

describe("derivePortfolioOperations", () => {
  it("maps active, attention, idle, completed, and disconnected project states independently", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings(),
      state: createState({
        projectRegistryEntries: createProjectEntries().filter((project) => project.id !== "project-e"),
        externalProjectAdosRunStatuses: {
          "project-a": status({ projectId: "project-a", stage: "Started", status: "Started", executionId: "run-a" }),
          "project-d": status({ projectId: "project-d", stage: "Completed", status: "Completed", executionId: "run-d" }),
        },
        reviewerRuntimeResultCollections: {
          "project-b": {
            projectId: "project-b",
            results: [{
              id: "review-b-result",
              projectId: "project-b",
              status: "Completed",
              decision: "ChangesRequested",
              blockingFindingCount: 1,
              nonBlockingFindingCount: 0,
              reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
              started: true,
              duplicateActiveAttempt: false,
              agentStarted: true,
              implementerStarted: true,
              reviewerStarted: true,
              validationStarted: false,
              repositoryMutationStarted: false,
              githubMutationStarted: false,
              resultAt: "2026-08-31T02:00:00.000Z",
              rulesVersion: "codex-reviewer-v1",
            }],
            resultCount: 1,
            rulesVersion: "codex-reviewer-v1",
          },
        },
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      workflowStage: "implementation",
      attentionState: "active",
      attentionLabel: "ACTIVE",
      activeOrResumableRunId: "run-a",
    });
    expect(result["company-b"]).toMatchObject({
      projectId: "project-b",
      attentionState: "needs-attention",
      attentionLabel: "NEEDS ATTENTION",
      blockedReasonSummary: "CHANGES REQUESTED",
    });
    expect(result["company-c"]).toMatchObject({
      projectId: "project-c",
      workflowStage: "idle",
      attentionState: "idle",
      attentionLabel: "IDLE",
    });
    expect(result["company-d"]).toMatchObject({
      projectId: "project-d",
      workflowStage: "complete",
      attentionState: "recently-completed",
      attentionLabel: "RECENTLY COMPLETED",
      recentCompletedSummary: "Run Completed at 2026-08-31T00:00:00.000Z",
    });
    expect(result["company-e"]).toMatchObject({
      projectId: "project-e",
      attentionState: "disconnected",
      operatorActionAvailable: false,
      blockedReasonSummary: "MISSING PROJECT",
    });
  });

  it("keeps approved review results active even when the persisted reason code contains review", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 1),
      state: createState({
        reviewerRuntimeResultCollections: {
          "project-a": reviewerRuntimeResultCollection({
            projectId: "project-a",
            decision: "Approved",
            reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
          }),
        },
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      workflowStage: "review",
      attentionState: "active",
      attentionLabel: "ACTIVE",
    });
  });

  it("keeps completed validation results active even when the persisted reason code contains validation", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 1),
      state: createState({
        validationRuntimeResultCollections: {
          "project-a": validationRuntimeResultCollection({
            projectId: "project-a",
            status: "Completed",
            reasonCodes: ["VALIDATION_RUNTIME_STARTED"],
          }),
        },
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      workflowStage: "validation",
      attentionState: "active",
      attentionLabel: "ACTIVE",
    });
  });

  it("maps real changes-requested review decisions to needs attention without relying on reason-code text", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 1),
      state: createState({
        reviewerRuntimeResultCollections: {
          "project-a": reviewerRuntimeResultCollection({
            projectId: "project-a",
            decision: "ChangesRequested",
            reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
          }),
        },
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      workflowStage: "review",
      attentionState: "needs-attention",
      attentionLabel: "NEEDS ATTENTION",
      blockedReasonSummary: "CHANGES REQUESTED",
    });
  });

  it("does not let an older negative validation result override a newer approved review fact", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 1),
      state: createState({
        validationRuntimeResultCollections: {
          "project-a": validationRuntimeResultCollection({
            projectId: "project-a",
            status: "Failed",
            reasonCodes: ["VALIDATION_RUNTIME_COMMAND_FAILED"],
            resultAt: "2026-08-31T02:00:00.000Z",
          }),
        },
        reviewerRuntimeResultCollections: {
          "project-a": reviewerRuntimeResultCollection({
            projectId: "project-a",
            decision: "Approved",
            reasonCodes: ["REVIEWER_RUNTIME_STARTED"],
            resultAt: "2026-08-31T03:00:00.000Z",
          }),
        },
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      workflowStage: "review",
      attentionState: "active",
      attentionLabel: "ACTIVE",
    });
  });

  it("does not let a newer global run contaminate another portfolio item", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 2),
      state: createState({
        externalProjectAdosRunStatuses: {
          "project-a": status({
            projectId: "project-a",
            stage: "Started",
            status: "Started",
            updatedAt: "2026-08-31T10:00:00.000Z",
          }),
        },
      }),
    });

    expect(result["company-a"].attentionState).toBe("active");
    expect(result["company-b"]).toMatchObject({
      projectId: "project-b",
      attentionState: "idle",
      activeOrResumableRunId: undefined,
    });
  });

  it("keeps development request indicators project scoped", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 2),
      state: createState({
        externalProjectDevelopmentRequestDrafts: {
          "project-b": {
            id: "draft-b",
            projectId: "project-b",
            projectName: "Project B",
            companyName: "Company B",
            status: "Prepared",
            title: "Fix portfolio blocker",
            summary: "Prepare a safe scoped request for Project B only.",
            adosRunId: "run-b",
            repositoryProvider: "local",
            createdAt: "2026-08-31T01:00:00.000Z",
            updatedAt: "2026-08-31T01:00:00.000Z",
            sideEffectBoundary: "Fixture only.",
          },
        },
      }),
    });

    expect(result["company-a"].developmentRequest).toBeUndefined();
    expect(result["company-b"].developmentRequest).toMatchObject({
      status: "Prepared",
      title: "Fix portfolio blocker",
    });
    expect(result["company-b"].activeOrResumableRunId).toBe("run-b");
  });

  it("adds project-scoped read-only backlog indicators without mutating task data", () => {
    const state = createState({
      projectBacklogCollections: {
        "project-a": {
          projectId: "project-a",
          tasks: [
            backlogTask("project-a", "a-ready", "A ready", "ready"),
            backlogTask("project-a", "a-blocked", "A blocked", "blocked"),
            {
              ...backlogTask("project-a", "a-dev", "A in development", "in_progress"),
              executionRunId: "run-a",
            },
          ],
        },
        "project-b": {
          projectId: "project-b",
          tasks: [
            backlogTask("project-b", "b-backlog", "B backlog", "backlog"),
          ],
        },
      },
    });
    const before = JSON.stringify(state.projectBacklogCollections);

    const result = derivePortfolioOperations({ buildings: createBuildings().slice(0, 2), state });

    expect(result["company-a"].backlogSummary).toMatchObject({
      projectId: "project-a",
      totalTaskCount: 3,
      readyTaskCount: 1,
      inDevelopmentTaskCount: 1,
      blockedTaskCount: 1,
      indicatorText: "1 Blocked task",
    });
    expect(result["company-b"].backlogSummary).toMatchObject({
      projectId: "project-b",
      totalTaskCount: 1,
      indicatorText: "1 Planned",
    });
    expect(JSON.stringify(state.projectBacklogCollections)).toBe(before);
  });

  it("adds subtle project-scoped AI suggestion counts for proposed candidates only", () => {
    const result = derivePortfolioOperations({
      buildings: createBuildings().slice(0, 2),
      state: createState({
        projectBacklogSuggestionCollections: {
          "project-a": {
            projectId: "project-a",
            candidates: [
              suggestion("project-a", "a1", "A one", "proposed"),
              suggestion("project-a", "a2", "A two", "proposed"),
              suggestion("project-a", "a3", "A accepted", "accepted"),
            ],
          },
          "project-b": {
            projectId: "project-b",
            candidates: [
              suggestion("project-b", "b1", "B rejected", "rejected"),
            ],
          },
        },
      }),
    });

    expect(result["company-a"].backlogSuggestionSummary).toBe("2 AI suggestions available");
    expect(result["company-b"].backlogSuggestionSummary).toBeUndefined();
  });

  it("adds read-only project-scoped AI Accept status without mutating policies", () => {
    const state = createState({
      projectBacklogSuggestionAcceptancePolicies: {
        "project-a": {
          projectId: "project-a",
          enabled: true,
          allowedPriorities: ["high"],
          maxAutoAcceptPerEvaluation: 1,
          requireNonDuplicate: true,
          requireValidStructuredSuggestion: true,
          createdTaskInitialStatus: "backlog",
          updatedAt: "2026-09-01T00:00:00.000Z",
          updatedByOperator: true,
        },
      },
      projectBacklogSuggestionCollections: {
        "project-a": {
          projectId: "project-a",
          candidates: [suggestion("project-a", "a1", "A one", "proposed")],
        },
        "project-b": {
          projectId: "project-b",
          candidates: [suggestion("project-b", "b1", "B one", "proposed")],
        },
      },
    });
    const beforePolicies = JSON.stringify(state.projectBacklogSuggestionAcceptancePolicies);
    const buildings = createBuildings().slice(0, 2);

    const result = derivePortfolioOperations({ buildings, state });

    expect(result["company-a"].backlogSuggestionAcceptanceSummary).toEqual({
      state: "On",
      pendingCount: 1,
      text: "AI Accept: On - 1 pending",
    });
    expect(result["company-b"].backlogSuggestionAcceptanceSummary).toEqual({
      state: "Off",
      pendingCount: 1,
      text: "AI Accept: Off - 1 pending",
    });
    expect(JSON.stringify(state.projectBacklogSuggestionAcceptancePolicies)).toBe(beforePolicies);
  });

  it("adds read-only project autonomy summaries without mutating policies", () => {
    const state = createState({
      projectBacklogCollections: {
        "project-a": {
          projectId: "project-a",
          tasks: [backlogTask("project-a", "a-ready", "A ready", "ready")],
        },
        "project-b": {
          projectId: "project-b",
          tasks: [backlogTask("project-b", "b-ready", "B ready", "ready")],
        },
      },
      projectAutonomyPolicies: {
        "project-a": {
          projectId: "project-a",
          enabled: true,
          allowedPriorities: ["normal"],
          maxConcurrentExecutions: 1,
          requireNoActiveRun: true,
          allowedTaskStatuses: ["ready"],
          updatedAt: "2026-09-01T00:00:00.000Z",
          updatedByOperator: true,
        },
      },
      externalProjectAdosRunStatuses: {
        "project-a": {
          id: "project-a:status",
          projectId: "project-a",
          stage: "Started",
          status: "Started",
          source: "execution",
          reasonCodes: [],
          updatedAt: "2026-09-01T00:05:00.000Z",
          validationStarted: false,
          reviewStarted: false,
          repositoryMutationStarted: false,
          githubMutationStarted: false,
          publishStarted: false,
          mergeStarted: false,
          deployStarted: false,
          rulesVersion: "test",
        },
      },
    });
    const before = JSON.stringify(state.projectAutonomyPolicies);

    const result = derivePortfolioOperations({ buildings: createBuildings().slice(0, 2), state });

    expect(result["company-a"].autonomySummary).toEqual({
      state: "Waiting",
      reason: "Active Run",
      text: "Auto: Waiting - Active Run",
    });
    expect(result["company-b"].autonomySummary).toEqual({
      state: "Off",
      text: "Auto: Off",
    });
    expect(JSON.stringify(state.projectAutonomyPolicies)).toBe(before);
  });

  it("adds read-only project-scoped Auto Ready summaries without mutating policies or backlog", () => {
    const state = createState({
      projectBacklogCollections: {
        "project-a": {
          projectId: "project-a",
          tasks: [
            backlogTask("project-a", "a-backlog", "A backlog", "backlog"),
            backlogTask("project-a", "a-ready", "A ready", "ready"),
          ],
        },
        "project-b": {
          projectId: "project-b",
          tasks: [backlogTask("project-b", "b-backlog", "B backlog", "backlog")],
        },
      },
      projectBacklogReadinessPromotionPolicies: {
        "project-a": {
          projectId: "project-a",
          enabled: true,
          allowedPriorities: ["high"],
          allowedOrigins: ["operator-created"],
          maxPromotionsPerEvaluation: 1,
          requireNoActiveExecution: true,
          requireValidTask: true,
          requireNonDuplicate: true,
          updatedAt: "2026-09-02T00:00:00.000Z",
          updatedByOperator: true,
        },
      },
    });
    const beforePolicies = JSON.stringify(state.projectBacklogReadinessPromotionPolicies);
    const beforeBacklog = JSON.stringify(state.projectBacklogCollections);

    const result = derivePortfolioOperations({ buildings: createBuildings().slice(0, 2), state });

    expect(result["company-a"].backlogReadinessPromotionSummary).toEqual({
      state: "On",
      backlogCount: 1,
      readyCount: 1,
      text: "Auto Ready: On - 1 Backlog / 1 Ready",
    });
    expect(result["company-b"].backlogReadinessPromotionSummary).toEqual({
      state: "Off",
      backlogCount: 1,
      readyCount: 0,
      text: "Auto Ready: Off - 1 Backlog / 0 Ready",
    });
    expect(JSON.stringify(state.projectBacklogReadinessPromotionPolicies)).toBe(beforePolicies);
    expect(JSON.stringify(state.projectBacklogCollections)).toBe(beforeBacklog);
  });

  it("filters and attention ordering without mutating source state", () => {
    const state = createState({
      externalProjectAdosRunStatuses: {
        "project-a": status({ projectId: "project-a", stage: "Blocked", status: "Blocked", reasonCodes: ["EXTERNAL_ADOS_EXECUTION_PROVIDER_UNAVAILABLE"] }),
        "project-d": status({ projectId: "project-d", stage: "Completed", status: "Completed" }),
      },
    });
    const before = JSON.stringify(state);
    const summaries = derivePortfolioOperations({ buildings: createBuildings(), state });

    expect(Object.keys(filterPortfolioSummaries(summaries, "attention"))).toEqual(["company-a"]);
    expect(Object.keys(filterPortfolioSummaries(summaries, "idle"))).toEqual(["company-b", "company-c", "company-e"]);
    expect(Object.keys(filterPortfolioSummaries(summaries, "completed"))).toEqual(["company-d"]);
    expect(orderPortfolioSummariesForAttention(Object.values(summaries)).map((summary) => summary.attentionState)[0]).toBe("blocked");
    expect(JSON.stringify(state)).toBe(before);
  });

  it("restores portfolio associations from browser session after reload", () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    const storage = createMemoryStorage();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { localStorage: storage },
    });

    try {
      const source = createProjectPortalState({ browserOfficeSessionService: false });
      source.projectRegistryEntries = createProjectEntries();
      source.externalProjectAdosRunStatuses = {
        "project-a": status({ projectId: "project-a", stage: "Started", status: "Started" }),
        "project-d": status({ projectId: "project-d", stage: "Completed", status: "Completed" }),
      };

      expect(new BrowserOfficeSessionService({ storage }).saveState(source)).toBe(true);

      const restored = createPortfolioOperationsFromBrowserSession(createBuildings());

      expect(restored["company-a"]).toMatchObject({ projectId: "project-a", attentionState: "active" });
      expect(restored["company-d"]).toMatchObject({ projectId: "project-d", attentionState: "recently-completed" });
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, "window", previousWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });
});

function createState(overrides: Partial<ProjectPortalState> = {}) {
  return {
    projectRegistryEntries: createProjectEntries(),
    externalProjectAdosRunPreparations: {},
    externalProjectAdosExecutions: {},
    externalProjectAdosExecutionResults: {},
    externalProjectAdosRunStatuses: {},
    externalProjectDevelopmentRequestDrafts: {},
    employees: [],
    implementerRuntimeCollections: {},
    implementerRuntimeResultCollections: {},
    reviewerRuntimeCollections: {},
    reviewerRuntimeResultCollections: {},
    reviewPromotionCollections: {},
    reviewPromotionResultCollections: {},
    reviewFixRuntimeCollections: {},
    reviewFixRuntimeResultCollections: {},
    validationRuntimeCollections: {},
    validationRuntimeResultCollections: {},
    postValidationReviewTargetCollections: {},
    postValidationReviewTargetResultCollections: {},
    ...overrides,
  };
}

function createBuildings(): CityBuildingDefinition[] {
  return [
    building("company-a", "Company A", "project-a"),
    building("company-b", "Company B", "project-b"),
    building("company-c", "Company C", "project-c"),
    building("company-d", "Company D", "project-d"),
    building("company-e", "Company E", "project-e"),
  ];
}

function building(id: string, name: string, projectId: string): CityBuildingDefinition {
  return {
    id,
    name,
    type: "company",
    worldPosition: { x: 0, y: 0 },
    size: { width: 200, height: 120 },
    interactionZone: { x: 0, y: 0, width: 80, height: 80 },
    entrancePoint: { x: 40, y: 80 },
    destination: {
      sceneKey: "office-daily-proof",
      enabled: true,
    },
    projectBinding: {
      bindingId: id,
      projectId,
    },
    active: true,
    visual: {
      wall: 0xffffff,
      roof: 0x000000,
      accent: 0xf4c85d,
    },
  };
}

function createProjectEntries(): ProjectRegistryEntry[] {
  return [
    project("project-a", "Project A", "Company A"),
    project("project-b", "Project B", "Company B"),
    project("project-c", "Project C", "Company C"),
    project("project-d", "Project D", "Company D"),
    project("project-e", "Project E", "Company E"),
  ];
}

function project(id: string, displayName: string, companyName: string): ProjectRegistryEntry {
  return {
    id,
    displayName,
    shortDescription: `${displayName} software project.`,
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: {
      connected: true,
      label: "Bound (local)",
    },
    localRepositoryBinding: {
      projectId: id,
      repositoryPath: `C:/repos/${id}`,
      worktreePath: `C:/worktrees/${id}`,
    },
    repositoryIdentity: {
      provider: "local",
      localPath: `C:/worktrees/${id}`,
      connectionState: "Configured",
    },
    owner: {
      companyName,
    },
    createdAt: "2026-08-31T00:00:00.000Z",
    lastActivityAt: "2026-08-31T00:00:00.000Z",
  };
}

function suggestion(
  projectId: string,
  id: string,
  title: string,
  statusValue: "proposed" | "accepted" | "rejected",
) {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    sourceContextSummary: projectId,
    generatedAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
    status: statusValue,
  };
}

function status(overrides: Partial<ExternalProjectAdosRunStatus> & Pick<ExternalProjectAdosRunStatus, "projectId">): ExternalProjectAdosRunStatus {
  const { projectId, ...rest } = overrides;
  return {
    id: `${projectId}:external-ados-run-status:external-ados-run-status-v1`,
    projectId,
    stage: "Started",
    status: "Started",
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
    rulesVersion: "external-ados-run-status-v1",
    ...rest,
  };
}

function reviewerRuntimeResultCollection(input: {
  projectId: string;
  decision: "Approved" | "ChangesRequested" | "Unknown";
  reasonCodes: ProjectPortalState["reviewerRuntimeResultCollections"][string]["results"][number]["reasonCodes"];
  status?: ProjectPortalState["reviewerRuntimeResultCollections"][string]["results"][number]["status"];
  resultAt?: string;
}): ProjectPortalState["reviewerRuntimeResultCollections"][string] {
  return {
    projectId: input.projectId,
    results: [{
      id: `${input.projectId}:review-result`,
      projectId: input.projectId,
      status: input.status ?? "Completed",
      decision: input.decision,
      blockingFindingCount: input.decision === "ChangesRequested" ? 1 : 0,
      nonBlockingFindingCount: 0,
      reasonCodes: input.reasonCodes,
      started: true,
      duplicateActiveAttempt: false,
      agentStarted: true,
      implementerStarted: true,
      reviewerStarted: true,
      validationStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      resultAt: input.resultAt ?? "2026-08-31T02:00:00.000Z",
      rulesVersion: "codex-reviewer-v1",
    }],
    resultCount: 1,
    rulesVersion: "codex-reviewer-v1",
  };
}

function validationRuntimeResultCollection(input: {
  projectId: string;
  status: ProjectPortalState["validationRuntimeResultCollections"][string]["results"][number]["status"];
  reasonCodes: ProjectPortalState["validationRuntimeResultCollections"][string]["results"][number]["reasonCodes"];
  resultAt?: string;
}): ProjectPortalState["validationRuntimeResultCollections"][string] {
  return {
    projectId: input.projectId,
    results: [{
      id: `${input.projectId}:validation-result`,
      projectId: input.projectId,
      status: input.status,
      reasonCodes: input.reasonCodes,
      started: true,
      alreadyCompleted: false,
      commandCount: 1,
      completedCommandCount: input.status === "Completed" ? 1 : 0,
      failedCommandCount: input.status === "Failed" ? 1 : 0,
      timedOutCommandCount: input.status === "TimedOut" ? 1 : 0,
      validationRuntimeStarted: true,
      validationStarted: true,
      commandExecutionStarted: true,
      reviewerStarted: false,
      reviewTargetCreated: false,
      promotionStarted: false,
      repositoryMutationStarted: false,
      githubMutationStarted: false,
      pushStarted: false,
      prStarted: false,
      readyForReviewStarted: false,
      mergeStarted: false,
      deployStarted: false,
      branchDeletionStarted: false,
      resultAt: input.resultAt ?? "2026-08-31T02:00:00.000Z",
      rulesVersion: "validation-runtime-v1",
    }],
    resultCount: 1,
    rulesVersion: "validation-runtime-v1",
  };
}

function backlogTask(
  projectId: string,
  id: string,
  title: string,
  status: "backlog" | "ready" | "blocked" | "in_progress",
) {
  return {
    id,
    projectId,
    title,
    description: `${title} description`,
    status,
    priority: "normal" as const,
    createdAt: "2026-08-31T00:00:00.000Z",
    updatedAt: "2026-08-31T00:00:00.000Z",
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
