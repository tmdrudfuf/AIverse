import { describe, expect, it } from "vitest";

import { createProjectPortalState } from "../OfficeProjectPortalRegistry";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import { BrowserOfficeSessionService } from "./BrowserOfficeSessionService";
import {
  BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
  BROWSER_OFFICE_SESSION_STORAGE_KEY,
  type BrowserOfficeSessionStorage,
} from "./BrowserOfficeSessionTypes";

describe("BrowserOfficeSessionService", () => {
  it("saves and restores restorable office session state", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({
      storage,
      now: () => "2026-08-17T00:00:00.000Z",
    });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectRegistryEntries.push(createExternalProjectEntry());
    source.projects.push({
      id: "external-crm",
      name: "External CRM",
      status: "Active",
      type: "CRM",
      enabled: true,
      description: "Customer workflow system.",
      linkedServices: [],
      nextAction: {
        label: "Review project workspace",
        enabled: true,
        placeholder: true,
      },
      ownerCompany: "External Co.",
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "github",
        owner: "external",
        name: "crm",
        url: "https://github.com/external/crm",
        defaultBranch: "main",
        localPath: "C:/worktrees/external-crm",
        connectionState: "Configured",
      },
    });
    source.selectedProjectId = "external-crm";
    source.selectedProjectDashboardProjectId = "daily-proof";
    source.selectedProjectDashboardActiveWorkIndex = 1;
    source.selectedWorkSessionId = "session-1";
    source.employees = [{
      id: "gpt-engineer",
      name: "GPT Engineer",
      role: "Engineer",
      status: "Working",
      avatarColor: "#2563eb",
      capabilities: ["Coding"],
      description: "Restored employee",
      assignedTaskId: "task-1",
      currentProjectId: "daily-proof",
    }];
    source.taskCollections["daily-proof"] = {
      projectId: "daily-proof",
      tasks: [{
        id: "task-1",
        title: "Restore active work",
        description: "Task",
        status: "In Progress",
        priority: "High",
        projectId: "daily-proof",
        assignee: "GPT Engineer",
        assigneeId: "gpt-engineer",
        createdAt: "2026-08-16T00:00:00.000Z",
        updatedAt: "2026-08-17T00:00:00.000Z",
      }],
    };
    source.workSessions["task-1"] = [{
      id: "session-1",
      taskId: "task-1",
      projectId: "daily-proof",
      employeeId: "gpt-engineer",
      employeeName: "GPT Engineer",
      provider: "placeholder",
      status: "running",
      startedAt: "2026-08-17T00:00:00.000Z",
    }];
    source.externalProjectAdosRunPreparations["external-crm"] = {
      id: "external-crm:external-ados-run-preparation",
      projectId: "external-crm",
      developmentRequestDraftId: "external-crm:external-development-request-draft",
      status: "Prepared",
      featureBranch: "codex/128-external-project-ados-run-preparation",
      authoritativeBaseSha: "3193608fd10aaa08cc0709f2be3a579b87f1d03c",
      specPath: "specs/128-external-project-ados-run-preparation/spec.md",
      validationCommands: ["npm test", "npx tsc --noEmit"],
      reviewerCommand: "claude -p",
      executionPolicyVersion: 1,
      createdAt: "2026-08-24T00:00:00.000Z",
      updatedAt: "2026-08-24T00:00:00.000Z",
      sideEffectBoundary: "Local preparation only.",
    };

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.selectedProjectId).toBe("external-crm");
    expect(restored.selectedProjectIndex).toBe(3);
    expect(restored.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(restored.selectedProjectDashboardActiveWorkIndex).toBe(1);
    expect(restored.selectedWorkSessionId).toBe("session-1");
    expect(restored.projectRegistryEntries.some((entry) => entry.id === "external-crm")).toBe(true);
    expect(restored.projects.some((project) => project.id === "external-crm")).toBe(true);
    expect(restored.repositoryMappings).toContainEqual({
      projectId: "external-crm",
      sourceId: "github:external/crm",
      repository: {
        owner: "external",
        name: "crm",
        url: "https://github.com/external/crm",
        visibility: "public",
      },
      enabled: true,
      createdAt: "2026-08-24T00:00:00.000Z",
    });
    expect(restored.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(restored.employees[0]).toMatchObject({ id: "gpt-engineer", status: "Working" });
    expect(restored.externalProjectAdosRunPreparations["external-crm"]).toMatchObject({
      projectId: "external-crm",
      status: "Prepared",
      featureBranch: "codex/128-external-project-ados-run-preparation",
      reviewerCommand: "claude -p",
    });
    expect(restored.workSessions["task-1"]?.[0]?.id).toBe("session-1");
  });

  it("ignores missing, malformed, and wrong-version saved state", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({ storage });

    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, "{not json");
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: "old-version",
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: { "task-1": [] },
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: { "task-1": { id: "not-an-array" } },
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).workSessions).toEqual({});

    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: { "daily-proof": { projectId: "daily-proof", tasks: "not-an-array" } },
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));
    expect(service.restoreState(createProjectPortalState({ browserOfficeSessionService: false })).taskCollections).toEqual({});
  });

  it("fails open when browser storage throws", () => {
    const service = new BrowserOfficeSessionService({
      storage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("blocked");
        },
      },
    });

    const state = createProjectPortalState({ browserOfficeSessionService: false });

    expect(() => service.restoreState(state)).not.toThrow();
    expect(service.saveState(state)).toBe(false);
  });

  it("ignores malformed persisted project registry entries while restoring defaults", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-24T00:00:00.000Z",
      selectedProjectId: "external-crm",
      selectedProjectDashboardActiveWorkIndex: 0,
      projectRegistryEntries: [
        { id: "missing-required-fields" },
        {
          ...createExternalProjectEntry(),
          id: "",
        },
      ],
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));

    const restored = new BrowserOfficeSessionService({ storage }).restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.projectRegistryEntries.map((entry) => entry.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(restored.projects.map((project) => project.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(restored.selectedProjectIndex).toBe(0);
  });

  it("restores project registry entries as independent copies", () => {
    const storage = createMemoryStorage();
    const service = new BrowserOfficeSessionService({ storage, now: () => "2026-08-24T00:00:00.000Z" });
    const source = createProjectPortalState({ browserOfficeSessionService: false });
    source.projectRegistryEntries.push(createExternalProjectEntry());

    expect(service.saveState(source)).toBe(true);

    const firstRestore = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));
    const restoredEntry = firstRestore.projectRegistryEntries.find((entry) => entry.id === "external-crm");
    const restoredProject = firstRestore.projects.find((project) => project.id === "external-crm");
    if (!restoredEntry || !restoredProject?.repositoryIdentity) throw new Error("expected restored external project");

    restoredEntry.displayName = "Mutated";
    restoredEntry.owner.companyName = "Mutated Co.";
    restoredProject.repositoryIdentity.owner = "mutated";

    const secondRestore = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));
    const secondEntry = secondRestore.projectRegistryEntries.find((entry) => entry.id === "external-crm");
    const secondProject = secondRestore.projects.find((project) => project.id === "external-crm");

    expect(secondEntry?.displayName).toBe("External CRM");
    expect(secondEntry?.owner.companyName).toBe("External Co.");
    expect(secondProject?.repositoryIdentity?.owner).toBe("external");
  });

  it("fails open when default browser storage access throws", () => {
    const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: Object.defineProperty({}, "localStorage", {
        get: () => {
          throw new Error("blocked");
        },
      }),
    });

    try {
      const service = new BrowserOfficeSessionService();
      const state = createProjectPortalState({ browserOfficeSessionService: false });

      expect(() => service.restoreState(state)).not.toThrow();
      expect(service.saveState(state)).toBe(false);
    } finally {
      if (previousWindow) {
        Object.defineProperty(globalThis, "window", previousWindow);
      } else {
        Reflect.deleteProperty(globalThis, "window");
      }
    }
  });

  it("loads only current-version snapshots", () => {
    const storage = createMemoryStorage();
    storage.setItem(BROWSER_OFFICE_SESSION_STORAGE_KEY, JSON.stringify({
      version: BROWSER_OFFICE_SESSION_SCHEMA_VERSION,
      savedAt: "2026-08-17T00:00:00.000Z",
      candidateTaskCollections: {},
      candidateAssignmentCollections: {},
      candidatePromotionReviewCollections: {},
      candidatePromotionDecisionRecords: {},
      candidateProjectTaskPromotionResultCollections: {},
      taskCollections: {},
      employees: [],
      confirmedEmployeeAssignmentRecords: {},
      confirmedEmployeeAssignmentResultCollections: {},
      preparedWorkSessionRecords: {},
      preparedWorkSessionResultCollections: {},
      activeWorkSessionStartResultCollections: {},
      workSessions: {},
    }));

    expect(new BrowserOfficeSessionService({ storage }).loadSnapshot()?.version).toBe(BROWSER_OFFICE_SESSION_SCHEMA_VERSION);
  });
});

function createMemoryStorage(): BrowserOfficeSessionStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
  };
}

function createExternalProjectEntry(): ProjectRegistryEntry {
  return {
    id: "external-crm",
    displayName: "External CRM",
    shortDescription: "Customer workflow system.",
    lifecycleStatus: "Active",
    projectType: "CRM",
    localRepository: {
      connected: true,
      label: "Bound (local)",
    },
    localRepositoryBinding: {
      projectId: "external-crm",
      repositoryPath: "C:/repos/external-crm",
      worktreePath: "C:/worktrees/external-crm",
      branchName: "codex/external-crm",
      specPath: "specs/999-external-crm/spec.md",
      source: "browser-registration",
      boundAt: "2026-08-24T00:00:00.000Z",
    },
    remoteRepository: {
      owner: "external",
      name: "crm",
      url: "https://github.com/external/crm",
      visibility: "public",
    },
    repositoryIdentity: {
      provider: "github",
      owner: "external",
      name: "crm",
      url: "https://github.com/external/crm",
      defaultBranch: "main",
      localPath: "C:/worktrees/external-crm",
      connectionState: "Configured",
    },
    owner: {
      companyName: "External Co.",
    },
    createdAt: "2026-08-24T00:00:00.000Z",
    lastActivityAt: "2026-08-24T00:00:00.000Z",
  };
}
