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
              reasonCodes: ["REVIEWER_RUNTIME_DECISION_UNKNOWN"],
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
      blockedReasonSummary: "REVIEWER RUNTIME DECISION UNKNOWN",
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

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}
