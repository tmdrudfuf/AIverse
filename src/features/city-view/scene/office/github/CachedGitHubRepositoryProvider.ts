import type { GitHubRepositoryProvider } from "./GitHubRepositoryProvider";
import type { GitHubRepositorySummary } from "./GitHubRepositoryTypes";

export const DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000;

export type CachedGitHubRepositoryProviderOptions = {
  ttlMs?: number;
  now?: () => number;
};

type CacheEntry = {
  summary: GitHubRepositorySummary;
  expiresAt: number;
};

/**
 * An additional, optional capability a GitHubRepositoryProvider decorator may support:
 * force a fresh read that bypasses any cache-hit check, while still applying the same
 * cache-update rules a normal read would. This does not change GitHubRepositoryProvider.
 */
export interface GitHubRepositoryRefresher {
  refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>;
}

/**
 * Decorates any GitHubRepositoryProvider with an in-memory, TTL-based cache keyed by
 * projectId. Only successful ("connected") summaries are cached; every other state
 * (rate_limited/offline/unavailable/not_connected) always falls through to the wrapped
 * provider, so a failure is never replayed from cache and never blocks an immediate retry.
 *
 * refreshRepositorySummary always bypasses the cache-hit check but shares the exact same
 * cache-update logic as getRepositorySummary, so a manual refresh and a normal cache-miss
 * read can never disagree about what gets stored.
 */
export class CachedGitHubRepositoryProvider implements GitHubRepositoryProvider, GitHubRepositoryRefresher {
  private readonly cache = new Map<string, CacheEntry>();
  private readonly inFlightRequests = new Map<string, Promise<GitHubRepositorySummary>>();
  private readonly ttlMs: number;
  private readonly now: () => number;

  constructor(
    private readonly provider: GitHubRepositoryProvider,
    options: CachedGitHubRepositoryProviderOptions = {},
  ) {
    this.ttlMs = isFinitePositiveNumber(options.ttlMs)
      ? options.ttlMs
      : DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS;
    this.now = options.now ?? (() => Date.now());
  }

  async getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    const cached = this.cache.get(projectId);
    if (cached && cached.expiresAt > this.now()) {
      return cloneSummary(cached.summary);
    }

    return this.fetchAndUpdateCache(projectId);
  }

  async refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary> {
    return this.fetchAndUpdateCache(projectId);
  }

  /**
   * Coalesces concurrent calls for the same projectId into a single underlying request.
   * A second caller while one is already in flight joins the same promise instead of
   * triggering another network read; every caller (original and joiners) still receives
   * an independently-cloned result. The in-flight entry is always removed once the call
   * settles, whether it resolves or rejects, so a later call always starts fresh.
   */
  private async fetchAndUpdateCache(projectId: string): Promise<GitHubRepositorySummary> {
    const existing = this.inFlightRequests.get(projectId);
    if (existing) return existing.then(cloneSummary);

    const request = this.performFetchAndUpdateCache(projectId);
    this.inFlightRequests.set(projectId, request);

    try {
      return await request;
    } finally {
      this.inFlightRequests.delete(projectId);
    }
  }

  private async performFetchAndUpdateCache(projectId: string): Promise<GitHubRepositorySummary> {
    const summary = await this.provider.getRepositorySummary(projectId);

    if (summary.connectionStatus === "connected") {
      this.cache.set(projectId, {
        summary: cloneSummary(summary),
        expiresAt: this.now() + this.ttlMs,
      });
    } else {
      this.cache.delete(projectId);
    }

    return cloneSummary(summary);
  }
}

function isFinitePositiveNumber(value: number | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function cloneSummary(summary: GitHubRepositorySummary): GitHubRepositorySummary {
  return {
    ...summary,
    latestCommit: summary.latestCommit ? { ...summary.latestCommit } : undefined,
    checkStatus: summary.checkStatus ? { ...summary.checkStatus } : undefined,
    sourceStatus: summary.sourceStatus ? { ...summary.sourceStatus } : undefined,
  };
}
