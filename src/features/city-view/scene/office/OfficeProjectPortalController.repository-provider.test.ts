import { describe, expect, it, vi } from "vitest";

import type { PhaserScene } from "../shared/phaserTypes";
import { OfficeProjectPortalController, type OfficeProjectPortalInput } from "./OfficeProjectPortalController";

describe("OfficeProjectPortalController real repository provider wiring", () => {
  it("issues a real unauthenticated GET request to api.github.com for a validly mapped project", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());

      controller.open();
      controller.updateInput(createInput({})); // consume the justOpened guard
      controller.updateInput(createInput({ enterPressed: true }));
      await flushPromises();

      expect(fetchStub).toHaveBeenCalled();
      const calledUrls = fetchStub.mock.calls.map((call) => String(call[0]));
      expect(calledUrls.some((url) => url.startsWith("https://api.github.com/repos/ai-verse/daily-proof"))).toBe(true);
      calledUrls.forEach((url) => expect(url.startsWith("https://api.github.com/")).toBe(true));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("issues no network request and returns the safe fallback for an unmapped project", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);

      const summary = await internals.repositoryService.getRepositorySummary("unmapped-project");

      expect(summary).toEqual({
        owner: "",
        name: "",
        defaultBranch: "",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "not_connected",
        errorMessage: "Repository data is not configured for this project.",
      });
      expect(fetchStub).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("degrades safely through the real wired path when GitHub responds with a rate limit", async () => {
    const fetchStub = vi.fn(async () => rateLimitedResponse());
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());

      controller.open();
      controller.updateInput(createInput({}));
      controller.updateInput(createInput({ enterPressed: true }));
      await flushPromises();

      const internals = getControllerInternals(controller);
      expect(internals.state.repositorySummaries["daily-proof"]?.connectionStatus).toBe("error");
      expect(internals.state.repositorySummaries["daily-proof"]?.sourceStatus?.state).toBe("rate_limited");
      expect(internals.state.repositorySummaries["daily-proof"]?.errorMessage).not.toContain("api.github.com");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("does not mutate projects, repository mappings, or advisory suggestions while using the real provider", async () => {
    const fetchStub = createFetchStub();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const controller = new OfficeProjectPortalController(createSceneStub());
      const internals = getControllerInternals(controller);
      const beforeProjects = structuredClone(internals.state.projects);
      const beforeMappings = structuredClone(internals.state.repositoryMappings);
      const beforeSuggestions = structuredClone(internals.state.projectManagementSuggestions);

      controller.open();
      controller.updateInput(createInput({}));
      controller.updateInput(createInput({ enterPressed: true }));
      await flushPromises();

      expect(internals.state.projects).toEqual(beforeProjects);
      expect(internals.state.repositoryMappings).toEqual(beforeMappings);
      expect(internals.state.projectManagementSuggestions).toEqual(beforeSuggestions);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

type ControllerInternals = {
  state: {
    projects: unknown;
    repositoryMappings: unknown;
    projectManagementSuggestions: unknown;
    repositorySummaries: Record<string, {
      connectionStatus: string;
      errorMessage?: string;
      sourceStatus?: { state: string };
    }>;
  };
  repositoryService: {
    getRepositorySummary: (projectId: string) => Promise<unknown>;
  };
};

function getControllerInternals(controller: OfficeProjectPortalController): ControllerInternals {
  return controller as unknown as ControllerInternals;
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

function rateLimitedResponse(): Response {
  return {
    ok: false,
    status: 403,
    headers: new Headers({ "x-ratelimit-remaining": "0" }),
    json: async () => ({}),
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
