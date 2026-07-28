import { describe, expect, it, vi } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import type { CandidateAssignmentRecommendationCollection } from "./candidate-assignments/CandidateAssignmentTypes";
import type { CandidateTaskCollection } from "./candidate-tasks/CandidateTaskTypes";
import type { Employee } from "./employees/EmployeeTypes";
import type { IssueSnapshotCollection } from "./issue-sync/IssueSyncTypes";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";

describe("OfficeProjectPortalController issue sync concurrency and isolation", () => {
  it("keeps a newer Succeeded result even when an older request resolves Failed afterward", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferredResults = [createDeferred<IssueSnapshotCollection>(), createDeferred<IssueSnapshotCollection>()];
    let callIndex = 0;
    internals.issueSyncService = {
      readIssueSnapshots: () => deferredResults[callIndex++]!.promise,
    };

    controller.open();
    controller.updateInput(createInput({})); // consume the justOpened guard
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const firstCall = internals.syncIssueSnapshots("daily-proof"); // older, slower
    const secondCall = internals.syncIssueSnapshots("daily-proof"); // newer, faster

    deferredResults[1]!.resolve(succeededCollection());
    await secondCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");

    deferredResults[0]!.resolve(failedCollection("stale, should be discarded"));
    await firstCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
  });

  it("keeps a newer Failed result even when an older request resolves Succeeded afterward", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferredResults = [createDeferred<IssueSnapshotCollection>(), createDeferred<IssueSnapshotCollection>()];
    let callIndex = 0;
    internals.issueSyncService = {
      readIssueSnapshots: () => deferredResults[callIndex++]!.promise,
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const firstCall = internals.syncIssueSnapshots("daily-proof"); // older, slower
    const secondCall = internals.syncIssueSnapshots("daily-proof"); // newer, faster

    deferredResults[1]!.resolve(failedCollection("newer failure"));
    await secondCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Failed");

    deferredResults[0]!.resolve(succeededCollection());
    await firstCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Failed");
  });

  it("does not apply an in-flight issue sync result after the player navigates away from the project dashboard", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferred = createDeferred<IssueSnapshotCollection>();
    internals.issueSyncService = { readIssueSnapshots: () => deferred.promise };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const syncCall = internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Syncing");

    controller.updateInput(createInput({ escapePressed: true }));
    expect(internals.state.viewMode).toBe("list");

    deferred.resolve(succeededCollection());
    await syncCall;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).not.toBe("Succeeded");
  });

  it("never shows project A's issue collection when project B's dashboard is opened before B's sync resolves", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    const projectB = internals.state.projects.find((project) => project.id === "portfolio");
    if (projectB) {
      projectB.repositoryIdentity = { provider: "github", owner: "ai-verse", name: "portfolio", connectionState: "Configured" };
    }

    const deferredB = createDeferred<IssueSnapshotCollection>();
    internals.issueSyncService = {
      readIssueSnapshots: (identity: { name?: string }) =>
        identity.name === "daily-proof" ? Promise.resolve(succeededCollection()) : deferredB.promise,
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");

    internals.state.selectedProjectDashboardProjectId = "portfolio";
    const syncCallB = internals.syncIssueSnapshots("portfolio");

    expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Syncing");

    deferredB.resolve(failedCollection("B resolved"));
    await syncCallB;

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateTaskCollections["portfolio"]?.syncStatus).toBe("Failed");
  });

  it("resolves the repository summary refresh, repository sync, and issue sync together from openProjectDashboard, without one invalidating another", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);
      setDailyProofIdentity(internals);

      controller.open();
      controller.updateInput(createInput({})); // consume the justOpened guard
      controller.updateInput(createInput({ enterPressed: true })); // list -> project-dashboard
      await flushPromises();

      expect(internals.state.repositorySummaries["daily-proof"]?.connectionStatus).toBe("connected");
      expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).toBe("Succeeded");
      expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
      expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("maps candidate tasks from issue sync without creating executable project tasks", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];
    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return {
          provider: "github",
          owner: "ai-verse",
          name: "daily-proof",
          syncStatus: "Succeeded",
          issues: [
            createIssue("ai-verse/daily-proof#1", 1, "An issue that must not become a task", ["bug"]),
          ],
          openCount: 1,
          closedCount: 0,
          isTruncated: false,
          lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
        };
      },
    };
    const before = structuredClone(internals.state.taskCollections);
    const employeesBefore = structuredClone(internals.state.employees);
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.issueSyncCollections["daily-proof"]?.syncStatus).toBe("Succeeded");
    expect(internals.state.issueSyncCollections["daily-proof"]?.issues).toHaveLength(1);
    expect(issueSyncReadCount).toBe(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks).toHaveLength(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]).toMatchObject({
      originatingIssueId: "ai-verse/daily-proof#1",
      issueNumber: 1,
      estimatedPriority: "High",
      estimatedTaskType: "Bug",
    });
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toHaveLength(1);
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations[0]).toMatchObject({
      candidateTaskId: internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]?.id,
      recommendedEmployeeId: "gpt-engineer",
      assignmentStatus: "Recommended",
      taskType: "Bug",
    });
    expect(internals.state.employees).toEqual(employeesBefore);
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
    expect(internals.state.taskCollections).toEqual(before);
  });

  it("clears stale assignment recommendations when candidate task sync becomes unavailable", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [employee({ id: "gpt-engineer", capabilities: ["Coding"] })];

    let issueSyncReadCount = 0;
    internals.issueSyncService = {
      readIssueSnapshots: async () => {
        issueSyncReadCount += 1;
        return issueSyncReadCount === 1
          ? succeededIssueCollectionWithBug()
          : failedCollection("Issue sync failed.");
      },
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toHaveLength(1);

    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateTaskCollections["daily-proof"]?.syncStatus).toBe("Failed");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendationStatus).toBe("Failed");
    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations).toEqual([]);
  });

  it("reports no employee pool without mutating candidate tasks or creating work", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.state.employees = [];
    internals.issueSyncService = {
      readIssueSnapshots: async () => succeededIssueCollectionWithBug(),
    };
    const workSessionsBefore = structuredClone(internals.state.workSessions);

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateAssignmentCollections["daily-proof"]?.recommendations[0]).toMatchObject({
      assignmentStatus: "Unavailable",
      unavailableReason: "No employees are available for assignment recommendations.",
    });
    expect(internals.state.taskCollections).toEqual({});
    expect(internals.state.workSessions).toEqual(workSessionsBefore);
  });

  it("does not create duplicate candidate tasks for duplicate issue snapshots", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);
    internals.issueSyncService = {
      readIssueSnapshots: async () => ({
        provider: "github",
        syncStatus: "Succeeded",
        issues: [
          createIssue("ai-verse/daily-proof#9", 9, "First copy", ["enhancement"]),
          createIssue("ai-verse/daily-proof#9", 9, "Duplicate copy", ["bug"]),
        ],
        openCount: 2,
        closedCount: 0,
        isTruncated: false,
        lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
      }),
    };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";
    await internals.syncIssueSnapshots("daily-proof");

    expect(internals.state.candidateTaskCollections["daily-proof"]?.taskCount).toBe(1);
    expect(internals.state.candidateTaskCollections["daily-proof"]?.tasks[0]?.title).toBe("First copy");
  });

  it("reaches Portfolio's project dashboard from the list and reports an honest Unavailable issue sync, never a fabricated Succeeded, using the real wired providers", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);

      controller.open();
      controller.updateInput(createInput({})); // consume the justOpened guard
      controller.updateInput(createInput({ downPressed: true })); // daily-proof -> portfolio
      controller.updateInput(createInput({ enterPressed: true })); // list -> project-dashboard
      await flushPromises();

      expect(internals.state.selectedProjectDashboardProjectId).toBe("portfolio");
      expect(internals.state.issueSyncCollections["portfolio"]?.syncStatus).toBe("Unavailable");
      expect(internals.state.candidateTaskCollections["portfolio"]?.syncStatus).toBe("Unavailable");
      expect(internals.state.candidateTaskCollections["portfolio"]?.tasks).toEqual([]);
      expect(internals.state.issueSyncCollections["portfolio"]?.errorSummary).toBeTruthy();
      expect(internals.state.issueSyncCollections["portfolio"]?.issues).toEqual([]);
      expect(fetchStub).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

function succeededCollection(): IssueSnapshotCollection {
  return { provider: "github", syncStatus: "Succeeded", issues: [], openCount: 0, closedCount: 0, isTruncated: false };
}

function succeededIssueCollectionWithBug(): IssueSnapshotCollection {
  return {
    provider: "github",
    owner: "ai-verse",
    name: "daily-proof",
    syncStatus: "Succeeded",
    issues: [createIssue("ai-verse/daily-proof#1", 1, "Fix crash", ["bug"])],
    openCount: 1,
    closedCount: 0,
    isTruncated: false,
    lastSuccessfulSyncAt: "2026-01-01T00:00:00.000Z",
  };
}

function failedCollection(errorSummary: string): IssueSnapshotCollection {
  return { provider: "github", syncStatus: "Failed", issues: [], openCount: 0, closedCount: 0, isTruncated: false, errorSummary };
}

function createIssue(id: string, number: number, title: string, labels: string[] = []) {
  return {
    id,
    number,
    title,
    state: "Open" as const,
    assignees: [],
    labels,
    provider: "github",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    syncedAt: "2026-01-01T00:00:00.000Z",
  };
}

type ProjectPortalProjectLike = {
  id: string;
  repositoryIdentity?: unknown;
};

type ControllerInternals = {
  state: {
    viewMode: string;
    selectedProjectDashboardProjectId: string | undefined;
    projects: ProjectPortalProjectLike[];
    repositorySummaries: Record<string, { connectionStatus: string }>;
    repositorySyncSnapshots: Record<string, { syncStatus: string }>;
    issueSyncCollections: Record<string, IssueSnapshotCollection>;
    candidateTaskCollections: Record<string, CandidateTaskCollection>;
    candidateAssignmentCollections: Record<string, CandidateAssignmentRecommendationCollection>;
    taskCollections: Record<string, unknown>;
    employees: Employee[];
    workSessions: Record<string, unknown[]>;
  };
  issueSyncService: {
    readIssueSnapshots: (identity: { owner?: string; name?: string; provider: string }) => Promise<IssueSnapshotCollection>;
  };
  syncIssueSnapshots: (projectId: string) => Promise<void>;
};

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
}

function employee(overrides: Partial<Employee> = {}): Employee {
  return {
    id: "gpt-engineer",
    name: "GPT Engineer",
    role: "Engineer",
    status: "Idle",
    avatarColor: "#2563eb",
    capabilities: [],
    description: "Employee",
    ...overrides,
  };
}

function setDailyProofIdentity(internals: ControllerInternals) {
  const dailyProof = internals.state.projects.find((project) => project.id === "daily-proof");
  if (dailyProof) {
    dailyProof.repositoryIdentity = {
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    };
  }
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function createInput(overrides: Partial<OfficeProjectPortalInput>): OfficeProjectPortalInput {
  return {
    actionPressed: false,
    escapePressed: false,
    upPressed: false,
    downPressed: false,
    enterPressed: false,
    ...overrides,
  };
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

function createFetchStub() {
  return vi.fn(async (input: string | URL | Request) => {
    const url = String(input);
    if (url.includes("/issues")) return jsonResponse(200, []);
    if (url.includes("/pulls")) return jsonResponse(200, [{ id: 1 }]);
    if (url.includes("/commits")) {
      return jsonResponse(200, [
        {
          sha: "abc1234",
          commit: { message: "Real read", author: { name: "Octocat", date: "2026-07-01T00:00:00.000Z" } },
        },
      ]);
    }
    return jsonResponse(200, {
      owner: { login: "ai-verse" },
      name: "daily-proof",
      default_branch: "main",
      open_issues_count: 5,
      pushed_at: "2026-07-01T00:00:00.000Z",
    });
  });
}

function createSceneStub(): PhaserScene {
  const createChainable = () => ({
    setOrigin: () => createChainable(),
    setScrollFactor: () => createChainable(),
    setDepth: () => createChainable(),
    setVisible: () => createChainable(),
    destroy: () => undefined,
  });
  const createGraphics = () => {
    const graphics = {
      fillStyle: () => graphics,
      fillRoundedRect: () => graphics,
      lineStyle: () => graphics,
      strokeRoundedRect: () => graphics,
      lineBetween: () => graphics,
    };
    return graphics;
  };
  const createContainer = () => ({
    add: () => undefined,
    removeAll: () => undefined,
    setScrollFactor: () => createContainer(),
    setDepth: () => createContainer(),
    setVisible: () => createContainer(),
    destroy: () => undefined,
  });

  return {
    scale: {
      width: 1024,
      height: 768,
    },
    add: {
      rectangle: () => createChainable(),
      graphics: () => createGraphics(),
      container: () => createContainer(),
      text: () => createChainable(),
    },
  } as unknown as PhaserScene;
}
