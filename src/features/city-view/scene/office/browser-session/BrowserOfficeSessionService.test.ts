import { describe, expect, it } from "vitest";

import { createProjectPortalState } from "../OfficeProjectPortalRegistry";
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
    source.selectedProjectId = "daily-proof";
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

    expect(service.saveState(source)).toBe(true);

    const restored = service.restoreState(createProjectPortalState({ browserOfficeSessionService: false }));

    expect(restored.selectedProjectId).toBe("daily-proof");
    expect(restored.selectedProjectDashboardProjectId).toBe("daily-proof");
    expect(restored.selectedProjectDashboardActiveWorkIndex).toBe(1);
    expect(restored.selectedWorkSessionId).toBe("session-1");
    expect(restored.taskCollections["daily-proof"]?.tasks[0]?.status).toBe("In Progress");
    expect(restored.employees[0]).toMatchObject({ id: "gpt-engineer", status: "Working" });
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
