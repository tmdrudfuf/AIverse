import { describe, expect, it, vi } from "vitest";

import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import {
  CachedGitHubRepositoryProvider,
  DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS,
} from "./CachedGitHubRepositoryProvider";
import { GitHubPublicRepositoryProvider } from "./GitHubPublicRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

const TTL_MS = 1000;

describe("CachedGitHubRepositoryProvider", () => {
  it("calls the underlying provider on the first read", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: createClock() });

    const summary = await cache.getRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(1);
    expect(summary.connectionStatus).toBe("connected");
  });

  it("does not call the underlying provider again for a second read within the TTL", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: clock });

    const first = await cache.getRepositorySummary("daily-proof");
    clock.advance(TTL_MS - 1);
    const second = await cache.getRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it("calls the underlying provider again after the TTL has expired", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: clock });

    await cache.getRepositorySummary("daily-proof");
    clock.advance(TTL_MS + 1);
    await cache.getRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["Infinity", Infinity],
    ["NaN", NaN],
    ["zero", 0],
    ["a negative number", -1000],
  ])("falls back to the default TTL instead of caching forever or never when ttlMs is %s", async (_label, invalidTtlMs) => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: invalidTtlMs, now: clock });

    await cache.getRepositorySummary("daily-proof");
    clock.advance(DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS - 1);
    await cache.getRepositorySummary("daily-proof"); // still within the default TTL: must be a cache hit
    clock.advance(2);
    await cache.getRepositorySummary("daily-proof"); // past the default TTL: must call through again

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
  });

  it("keeps independent cache entries for different project ids", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: createClock() });

    await cache.getRepositorySummary("daily-proof");
    await cache.getRepositorySummary("other-project");
    await cache.getRepositorySummary("daily-proof");
    await cache.getRepositorySummary("other-project");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
    expect(getRepositorySummary).toHaveBeenNthCalledWith(1, "daily-proof");
    expect(getRepositorySummary).toHaveBeenNthCalledWith(2, "other-project");
  });

  it("returns independent clones so caller mutation cannot poison a later cached read", async () => {
    const { provider: underlying } = createUnderlyingStub();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: createClock() });

    const first = await cache.getRepositorySummary("daily-proof");
    first.latestCommit!.message = "mutated";
    first.checkStatus!.label = "mutated";
    first.sourceStatus!.reason = "mutated";

    const second = await cache.getRepositorySummary("daily-proof");

    expect(second.latestCommit?.message).toBe("Stabilize public read cache fixture");
    expect(second.checkStatus?.label).toBe("CI passing");
    expect(second.sourceStatus?.reason).toBeUndefined();
  });

  it("does not cache a rate-limited failure as a successful result", async () => {
    const failureSummary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "error",
      errorMessage: "GitHub rate limit reached for public reads.",
      sourceStatus: { state: "rate_limited", label: "Rate limited", reason: "GitHub rate limit reached for public reads." },
    };
    const getRepositorySummary = vi.fn(async () => failureSummary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const result = await cache.getRepositorySummary("daily-proof");

    expect(result.connectionStatus).toBe("error");
    expect(result.sourceStatus?.state).toBe("rate_limited");
  });

  it("does not itself cache a failure — the very next read calls the underlying provider again", async () => {
    const failureSummary: GitHubRepositorySummary = {
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "error",
      errorMessage: "Unable to reach GitHub. The network may be unavailable.",
      sourceStatus: { state: "offline", label: "Offline" },
    };
    const getRepositorySummary = vi.fn(async () => failureSummary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    await cache.getRepositorySummary("daily-proof");
    await cache.getRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
  });

  it("never replays a stale success once a later read for the same project fails", async () => {
    const summaries: GitHubRepositorySummary[] = [
      {
        owner: "ai-verse",
        name: "daily-proof",
        defaultBranch: "main",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "connected",
        sourceStatus: { state: "fresh", label: "Fresh" },
      },
      {
        owner: "",
        name: "",
        defaultBranch: "",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "error",
        errorMessage: "Unable to load repository summary.",
        sourceStatus: { state: "unavailable", label: "Unavailable" },
      },
    ];
    let callIndex = 0;
    const getRepositorySummary = vi.fn(async () => summaries[Math.min(callIndex++, summaries.length - 1)]);
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: clock });

    const first = await cache.getRepositorySummary("daily-proof");
    clock.advance(TTL_MS + 1); // force the second call to go through
    const second = await cache.getRepositorySummary("daily-proof");
    const third = await cache.getRepositorySummary("daily-proof");

    expect(first.connectionStatus).toBe("connected");
    expect(second.connectionStatus).toBe("error");
    expect(third.connectionStatus).toBe("error");
    expect(getRepositorySummary).toHaveBeenCalledTimes(3);
  });

  it("performs zero fetch calls for an unmapped project, with or without the cache", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const realProvider = new GitHubPublicRepositoryProvider(() => undefined, fetchStub);
      const cache = new CachedGitHubRepositoryProvider(realProvider, { ttlMs: TTL_MS, now: createClock() });

      const first = await cache.getRepositorySummary("unmapped-project");
      const second = await cache.getRepositorySummary("unmapped-project");

      expect(fetchStub).not.toHaveBeenCalled();
      expect(first).toEqual({
        owner: "",
        name: "",
        defaultBranch: "",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "not_connected",
        errorMessage: "Repository data is not configured for this project.",
      });
      expect(second).toEqual(first);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("preserves display-safe rate-limit behavior when wrapping the real provider", async () => {
    const fetchStub = vi.fn(async () =>
      ({
        ok: false,
        status: 403,
        headers: new Headers({ "x-ratelimit-remaining": "0" }),
        json: async () => ({}),
      }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchStub);
    try {
      const realProvider = new GitHubPublicRepositoryProvider(() => ({ owner: "ai-verse", name: "daily-proof" }), fetchStub);
      const cache = new CachedGitHubRepositoryProvider(realProvider, { ttlMs: TTL_MS, now: createClock() });

      const summary = await cache.getRepositorySummary("daily-proof");

      expect(summary.connectionStatus).toBe("error");
      expect(summary.sourceStatus?.state).toBe("rate_limited");
      expect(summary.errorMessage).not.toContain("api.github.com");
      expect(summary.errorMessage).not.toContain("403");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("satisfies the GitHubRepositoryProvider interface without any shape change", () => {
    const cache: GitHubRepositoryProvider = new CachedGitHubRepositoryProvider(createUnderlyingStub().provider);

    expect(typeof cache.getRepositorySummary).toBe("function");
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(cache))).toEqual(["constructor", "getRepositorySummary"]);
  });

  it("does not mutate the summary returned by the underlying provider", async () => {
    const summary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      latestCommit: { sha: "abc1234", message: "Original message", authorName: "Ada", committedAt: "2026-07-01T00:00:00.000Z" },
      openIssueCount: 1,
      openPullRequestCount: 0,
      connectionStatus: "connected",
      sourceStatus: { state: "fresh", label: "Fresh" },
    };
    const beforeSummary = structuredClone(summary);
    const getRepositorySummary = vi.fn(async () => summary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    await cache.getRepositorySummary("daily-proof");

    expect(summary).toEqual(beforeSummary);
  });
});

function createUnderlyingStub() {
  const summary: GitHubRepositorySummary = {
    owner: "ai-verse",
    name: "daily-proof",
    defaultBranch: "main",
    latestCommit: {
      sha: "abc1234",
      message: "Stabilize public read cache fixture",
      authorName: "AIverse Bot",
      committedAt: "2026-07-01T00:00:00.000Z",
    },
    openIssueCount: 2,
    openPullRequestCount: 1,
    checkStatus: { state: "passing", label: "CI passing" },
    connectionStatus: "connected",
    sourceStatus: { state: "fresh", label: "Fresh" },
  };
  const getRepositorySummary = vi.fn(async () => summary);
  const provider: GitHubRepositoryProvider = { getRepositorySummary };
  return { provider, getRepositorySummary };
}

function createClock() {
  let currentTime = 0;
  const clock = () => currentTime;
  clock.advance = (ms: number) => {
    currentTime += ms;
  };
  return clock;
}
