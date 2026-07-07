# Contract: Repository Summary Refresh

## Purpose

Define exactly what "refresh" means, what it may bypass, and what it must never do.

## Interface

```ts
interface GitHubRepositoryRefresher {
  refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>;
}
```

Implemented by `CachedGitHubRepositoryProvider`. Optionally consumed by `GitHubRepositoryService`, which falls back to `getRepositorySummary` when the wrapped provider does not implement it.

## Behavior Rules

| Condition | Behavior |
| --- | --- |
| Refresh called for a project id, regardless of remaining cache TTL | Always calls the wrapped provider; the cache-hit check is skipped entirely. |
| Wrapped provider returns `connectionStatus: "connected"` | Cache entry for that project id is replaced with a new clone and a new `expiresAt = now() + ttlMs`. |
| Wrapped provider returns any other `connectionStatus` | Existing cache entry (if any) for that project id is deleted; nothing is cached. |
| No repository reference resolvable for the project id | Zero network requests; the existing "not configured" fallback is returned, identically to the non-refresh path. |
| Refresh for project A | Never reads, writes, or otherwise affects project B's cache entry. |

## UI Trigger Rules

- Refresh is only reachable from the Repository Detail screen (`viewMode: "repository-detail"`).
- Refresh only triggers on an explicit `actionPressed`/`enterPressed` input while that screen is open — never automatically on open, render, or any other view transition.
- Refresh is only attempted when `hasRepositoryMapping(projectId)` is true (the same check the existing auto-refresh-on-dashboard-open path already uses); otherwise the action is a no-op.

## Hard Prohibitions

- MUST NOT add a new field to `GitHubRepositorySummary` or expand `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.
- MUST NOT change the `GitHubRepositoryProvider` interface.
- MUST NOT introduce polling, a scheduler, or any automatic repeated refresh.
- MUST NOT leak raw URLs, response bodies, headers, status codes, tokens, or low-level exception text into `errorMessage` (unchanged from specs 037-039 — refresh reuses the same underlying provider and error-collapsing service).
- MUST NOT mutate any input (mapping, project, or summary object) — refresh reuses the same clone-in/clone-out discipline the cache already applies.
