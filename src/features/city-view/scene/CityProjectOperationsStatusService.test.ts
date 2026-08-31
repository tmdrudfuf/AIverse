import { describe, expect, it } from "vitest";

import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import {
  createCityProjectOperationStatusesFromBrowserSession,
  deriveCityProjectOperationStatuses,
} from "./CityProjectOperationsStatusService";
import { createProjectPortalState } from "./office/OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./office/OfficeProjectPortalTypes";
import { BrowserOfficeSessionService } from "./office/browser-session/BrowserOfficeSessionService";
import type { BrowserOfficeSessionStorage } from "./office/browser-session/BrowserOfficeSessionTypes";
import type { ExternalProjectAdosRunStatus } from "./office/external-ados-run-status/ExternalProjectAdosRunStatusTypes";
import type { ProjectRegistryEntry } from "./office/project-registry/ProjectRegistryTypes";

describe("deriveCityProjectOperationStatuses", () => {
  it("represents Project A implementation and Project B review independently", () => {
    const result = deriveCityProjectOperationStatuses({
      buildings: createBuildings(),
      state: createState({
        "project-a": status({ projectId: "project-a", stage: "Started", status: "Started", updatedAt: "2026-08-31T01:00:00.000Z" }),
        "project-b": status({ projectId: "project-b", stage: "Started", status: "Reviewer Started", updatedAt: "2026-08-31T00:30:00.000Z" }),
      }),
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      stage: "implementation",
      label: "IMPLEMENTATION",
      tone: "active",
      mutationDisabled: false,
    });
    expect(result["company-b"]).toMatchObject({
      projectId: "project-b",
      stage: "review",
      label: "REVIEW",
      tone: "active",
      mutationDisabled: false,
    });
  });

  it("does not let the latest global run override a bound project's own missing run", () => {
    const result = deriveCityProjectOperationStatuses({
      buildings: createBuildings(),
      state: createState({
        "project-a": status({ projectId: "project-a", stage: "Started", status: "Started", updatedAt: "2026-08-31T02:00:00.000Z" }),
      }),
    });

    expect(result["company-b"]).toMatchObject({
      projectId: "project-b",
      stage: "idle",
      label: "IDLE",
    });
  });

  it("scopes blocked and complete states to the correct project only", () => {
    const result = deriveCityProjectOperationStatuses({
      buildings: createBuildings(),
      state: createState({
        "project-a": status({
          projectId: "project-a",
          stage: "Failed",
          status: "Validation Failed",
          reasonCodes: ["EXTERNAL_ADOS_EXECUTION_SPAWN_FAILED"],
        }),
        "project-b": status({ projectId: "project-b", stage: "Completed", status: "Completed" }),
      }),
    });

    expect(result["company-a"]).toMatchObject({
      stage: "blocked",
      label: "BLOCKED",
      tone: "warning",
      reasonText: "EXTERNAL ADOS EXECUTION SPAWN FAILED",
    });
    expect(result["company-b"]).toMatchObject({
      stage: "complete",
      label: "COMPLETE",
      tone: "complete",
    });
  });

  it("marks removed or unavailable registry projects as disconnected with mutation disabled", () => {
    const [companyA] = createBuildings();
    const result = deriveCityProjectOperationStatuses({
      buildings: [companyA],
      state: {
        projectRegistryEntries: [],
        externalProjectAdosRunStatuses: {
          "project-a": status({ projectId: "project-a", stage: "Started", status: "Started" }),
        },
      },
    });

    expect(result["company-a"]).toMatchObject({
      projectId: "project-a",
      stage: "disconnected",
      label: "DISCONNECTED",
      tone: "disconnected",
      mutationDisabled: true,
      reasonText: "Missing Project",
    });
  });

  it("preserves project-run association when statuses are restored from browser session", () => {
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
        "project-b": status({ projectId: "project-b", stage: "Started", status: "Reviewer Started" }),
      };

      expect(new BrowserOfficeSessionService({ storage }).saveState(source)).toBe(true);

      const restored = createCityProjectOperationStatusesFromBrowserSession(createBuildings());

      expect(restored["company-a"].stage).toBe("implementation");
      expect(restored["company-b"].stage).toBe("review");
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, "window", previousWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });
});

function createState(statuses: ProjectPortalState["externalProjectAdosRunStatuses"]) {
  return {
    projectRegistryEntries: createProjectEntries(),
    externalProjectAdosRunStatuses: statuses,
  };
}

function createBuildings(): CityBuildingDefinition[] {
  return [
    building("company-a", "Company A", "project-a"),
    building("company-b", "Company B", "project-b"),
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
