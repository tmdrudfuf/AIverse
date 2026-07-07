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

  it("coalesces two concurrent reads for the same project into a single underlying call", async () => {
    const deferred = createDeferred<GitHubRepositorySummary>();
    const getRepositorySummary = vi.fn(() => deferred.promise);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const first = cache.getRepositorySummary("daily-proof");
    const second = cache.getRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(1);

    deferred.resolve({
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 1,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual(secondResult);
    expect(firstResult).not.toBe(secondResult);
  });

  it("coalesces two concurrent refreshes for the same project into a single underlying call and isolates mutation between callers", async () => {
    const deferred = createDeferred<GitHubRepositorySummary>();
    const getRepositorySummary = vi.fn(() => deferred.promise);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const first = cache.refreshRepositorySummary("daily-proof");
    const second = cache.refreshRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(1);

    deferred.resolve({
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      latestCommit: { sha: "abc1234", message: "Original message", authorName: "Ada", committedAt: "2026-07-01T00:00:00.000Z" },
      openIssueCount: 1,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);

    expect(firstResult).toEqual(secondResult);
    firstResult.latestCommit!.message = "mutated";
    expect(secondResult.latestCommit?.message).toBe("Original message");
  });

  it("starts a new underlying call for a later request once the in-flight one has completed", async () => {
    const secondSummary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 9,
      openPullRequestCount: 3,
      connectionStatus: "connected",
    };
    const getRepositorySummary = vi.fn()
      .mockResolvedValueOnce({
        owner: "ai-verse",
        name: "daily-proof",
        defaultBranch: "main",
        openIssueCount: 1,
        openPullRequestCount: 0,
        connectionStatus: "connected",
      } satisfies GitHubRepositorySummary)
      .mockResolvedValueOnce(secondSummary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    await cache.refreshRepositorySummary("daily-proof");
    const second = await cache.refreshRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
    expect(second).toEqual(secondSummary);
  });

  it("clears the in-flight guard after a failure so the next request retries", async () => {
    const deferred = createDeferred<GitHubRepositorySummary>();
    const recoveredSummary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    };
    const getRepositorySummary = vi.fn()
      .mockImplementationOnce(() => deferred.promise)
      .mockResolvedValueOnce(recoveredSummary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const first = cache.refreshRepositorySummary("daily-proof");
    deferred.reject(new Error("unexpected provider failure"));
    await expect(first).rejects.toThrow("unexpected provider failure");

    const second = await cache.refreshRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
    expect(second).toEqual(recoveredSummary);
  });

  it("propagates a rejection to a joining caller as well as the original caller", async () => {
    const deferred = createDeferred<GitHubRepositorySummary>();
    const getRepositorySummary = vi.fn(() => deferred.promise);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const first = cache.getRepositorySummary("daily-proof");
    const second = cache.getRepositorySummary("daily-proof");
    deferred.reject(new Error("boom"));

    await expect(first).rejects.toThrow("boom");
    await expect(second).rejects.toThrow("boom");
    expect(getRepositorySummary).toHaveBeenCalledTimes(1);
  });

  it("does not block a different project's refresh while one project's refresh is in flight", async () => {
    const deferredA = createDeferred<GitHubRepositorySummary>();
    const summaryB: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "project-b",
      defaultBranch: "main",
      openIssueCount: 2,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    };
    const getRepositorySummary = vi.fn((projectId: string) =>
      projectId === "project-a" ? deferredA.promise : Promise.resolve(summaryB),
    );
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const refreshA = cache.refreshRepositorySummary("project-a");
    const refreshB = await cache.refreshRepositorySummary("project-b");

    expect(refreshB).toEqual(summaryB);
    expect(getRepositorySummary).toHaveBeenCalledTimes(2);

    deferredA.resolve({
      owner: "ai-verse",
      name: "project-a",
      defaultBranch: "main",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "connected",
    });
    await refreshA;
  });

  it("refreshRepositorySummary bypasses the cache even within the TTL", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: clock });

    await cache.getRepositorySummary("daily-proof");
    clock.advance(1); // still well within TTL
    await cache.refreshRepositorySummary("daily-proof");

    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
  });

  it("a successful refresh replaces the cached summary for subsequent normal reads", async () => {
    const summaries: GitHubRepositorySummary[] = [
      {
        owner: "ai-verse",
        name: "daily-proof",
        defaultBranch: "main",
        openIssueCount: 5,
        openPullRequestCount: 2,
        connectionStatus: "connected",
        sourceStatus: { state: "fresh", label: "Fresh", lastSuccessfulFetchAt: "2026-07-01T00:00:00.000Z" },
      },
      {
        owner: "ai-verse",
        name: "daily-proof",
        defaultBranch: "main",
        openIssueCount: 1,
        openPullRequestCount: 0,
        connectionStatus: "connected",
        sourceStatus: { state: "fresh", label: "Fresh", lastSuccessfulFetchAt: "2026-07-01T00:10:00.000Z" },
      },
    ];
    let callIndex = 0;
    const getRepositorySummary = vi.fn(async () => summaries[callIndex++]);
    const clock = createClock();
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: clock });

    await cache.getRepositorySummary("daily-proof"); // primes the cache with summaries[0]
    const refreshed = await cache.refreshRepositorySummary("daily-proof"); // forces summaries[1]
    const afterRefresh = await cache.getRepositorySummary("daily-proof"); // should hit the cache with the refreshed value

    expect(refreshed.openIssueCount).toBe(1);
    expect(afterRefresh).toEqual(refreshed);
    expect(getRepositorySummary).toHaveBeenCalledTimes(2);
  });

  it("refreshing one project does not affect another project's cache", async () => {
    const { provider: underlying, getRepositorySummary } = createUnderlyingStub();
    const cache = new CachedGitHubRepositoryProvider(underlying, { ttlMs: TTL_MS, now: createClock() });

    await cache.getRepositorySummary("daily-proof");
    await cache.getRepositorySummary("other-project");
    await cache.refreshRepositorySummary("daily-proof");
    await cache.getRepositorySummary("other-project"); // should still be a cache hit

    expect(getRepositorySummary).toHaveBeenCalledTimes(3);
    expect(getRepositorySummary).toHaveBeenNthCalledWith(3, "daily-proof");
  });

  it("a failed refresh does not fabricate a connected/fresh result", async () => {
    const failureSummary: GitHubRepositorySummary = {
      owner: "",
      name: "",
      defaultBranch: "",
      openIssueCount: 0,
      openPullRequestCount: 0,
      connectionStatus: "error",
      errorMessage: "GitHub rate limit reached for public reads.",
      sourceStatus: { state: "rate_limited", label: "Rate limited" },
    };
    const getRepositorySummary = vi.fn(async () => failureSummary);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    const result = await cache.refreshRepositorySummary("daily-proof");

    expect(result.connectionStatus).toBe("error");
    expect(result.sourceStatus?.state).toBe("rate_limited");
  });

  it("a failed refresh clears the previous cache entry rather than preserving stale success", async () => {
    const successSummary: GitHubRepositorySummary = {
      owner: "ai-verse",
      name: "daily-proof",
      defaultBranch: "main",
      openIssueCount: 2,
      openPullRequestCount: 1,
      connectionStatus: "connected",
      sourceStatus: { state: "fresh", label: "Fresh" },
    };
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
    const results = [successSummary, failureSummary, failureSummary];
    let callIndex = 0;
    const getRepositorySummary = vi.fn(async () => results[Math.min(callIndex++, results.length - 1)]);
    const cache = new CachedGitHubRepositoryProvider({ getRepositorySummary }, { ttlMs: TTL_MS, now: createClock() });

    await cache.getRepositorySummary("daily-proof"); // primes the cache with a success
    const refreshResult = await cache.refreshRepositorySummary("daily-proof"); // fails
    const nextRead = await cache.getRepositorySummary("daily-proof"); // must NOT replay the stale success

    expect(refreshResult.connectionStatus).toBe("error");
    expect(nextRead.connectionStatus).toBe("error");
    expect(getRepositorySummary).toHaveBeenCalledTimes(3);
  });

  it("refreshing an unmapped project performs zero fetch calls", async () => {
    const fetchStub = vi.fn();
    vi.stubGlobal("fetch", fetchStub);
    try {
      const realProvider = new GitHubPublicRepositoryProvider(() => undefined, fetchStub);
      const cache = new CachedGitHubRepositoryProvider(realProvider, { ttlMs: TTL_MS, now: createClock() });

      const result = await cache.refreshRepositorySummary("unmapped-project");

      expect(fetchStub).not.toHaveBeenCalled();
      expect(result).toEqual({
        owner: "",
        name: "",
        defaultBranch: "",
        openIssueCount: 0,
        openPullRequestCount: 0,
        connectionStatus: "not_connected",
        errorMessage: "Repository data is not configured for this project.",
      });
    } finally {
      vi.unstubAllGlobals();
    }
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
    expect(Object.getOwnPropertyNames(Object.getPrototypeOf(cache)).sort()).toEqual([
      "constructor",
      "fetchAndUpdateCache",
      "getRepositorySummary",
      "performFetchAndUpdateCache",
      "refreshRepositorySummary",
    ]);
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

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}
