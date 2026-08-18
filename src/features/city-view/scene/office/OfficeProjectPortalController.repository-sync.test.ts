import { describe, expect, it, vi } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";
import type { RepositorySyncSnapshot } from "./repository-sync/RepositorySyncTypes";

describe("OfficeProjectPortalController repository sync concurrency", () => {
  it("keeps a newer Succeeded result even when an older request resolves Failed afterward", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferredResults = [createDeferred<RepositorySyncSnapshot>(), createDeferred<RepositorySyncSnapshot>()];
    let callIndex = 0;
    internals.repositorySyncService = {
      readRepositorySnapshot: () => deferredResults[callIndex++].promise,
    };

    controller.open();
    controller.updateInput(createInput({})); // consume the justOpened guard
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const firstCall = internals.syncRepositorySnapshot("daily-proof"); // older, slower
    const secondCall = internals.syncRepositorySnapshot("daily-proof"); // newer, faster

    deferredResults[1].resolve({ provider: "github", availability: "available", syncStatus: "Succeeded" });
    await secondCall;

    expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).toBe("Succeeded");

    deferredResults[0].resolve({
      provider: "github",
      availability: "unavailable",
      syncStatus: "Failed",
      errorSummary: "stale, should be discarded",
    });
    await firstCall;

    expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).toBe("Succeeded");
  });

  it("does not apply an in-flight sync result after the player navigates away from the project dashboard", async () => {
    const controller = new OfficeProjectPortalController(createSceneStub());
    const internals = getControllerInternals(controller);
    setDailyProofIdentity(internals);

    const deferred = createDeferred<RepositorySyncSnapshot>();
    internals.repositorySyncService = { readRepositorySnapshot: () => deferred.promise };

    controller.open();
    controller.updateInput(createInput({}));
    internals.state.viewMode = "project-dashboard";
    internals.state.selectedProjectDashboardProjectId = "daily-proof";

    const syncCall = internals.syncRepositorySnapshot("daily-proof");
    expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).toBe("Syncing");

    controller.updateInput(createInput({ escapePressed: true }));
    expect(internals.state.viewMode).toBe("list");

    deferred.resolve({ provider: "github", availability: "available", syncStatus: "Succeeded" });
    await syncCall;

    expect(internals.state.repositorySyncSnapshots["daily-proof"]?.syncStatus).not.toBe("Succeeded");
  });

  it("resolves both the repository summary refresh and the repository sync when opening the dashboard, without one invalidating the other", async () => {
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
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("reaches Portfolio's project dashboard from the list and reports an honest Unavailable sync, never a fabricated Succeeded, using the real wired providers", async () => {
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
      expect(internals.state.repositorySyncSnapshots["portfolio"]?.syncStatus).toBe("Unavailable");
      expect(internals.state.repositorySyncSnapshots["portfolio"]?.errorSummary).toBeTruthy();
      expect(fetchStub).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

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
    repositorySyncSnapshots: Record<string, RepositorySyncSnapshot>;
  };
  repositorySyncService: {
    readRepositorySnapshot: (...args: unknown[]) => Promise<RepositorySyncSnapshot>;
  };
  syncRepositorySnapshot: (projectId: string) => Promise<void>;
};

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
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
    openCandidateDetailPressed: false,
    startImplementerPressed: false,
    startReviewerPressed: false,
    promoteReviewPressed: false,
    requestReviewFixPressed: false,
    planReviewFixPressed: false,
    startReviewFixRuntimePressed: false,
    startValidationRuntimePressed: false,
    preparePostValidationReviewTargetPressed: false,
    startPostValidationReviewPressed: false,
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
