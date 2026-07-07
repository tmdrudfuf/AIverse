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
 * Decorates any GitHubRepositoryProvider with an in-memory, TTL-based cache keyed by
 * projectId. Only successful ("connected") summaries are cached; every other state
 * (rate_limited/offline/unavailable/not_connected) always falls through to the wrapped
 * provider, so a failure is never replayed from cache and never blocks an immediate retry.
 */
export class CachedGitHubRepositoryProvider implements GitHubRepositoryProvider {
  private readonly cache = new Map<string, CacheEntry>();
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
