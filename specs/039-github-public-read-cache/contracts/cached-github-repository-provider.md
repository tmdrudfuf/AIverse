# Contract: Cached GitHub Repository Provider

## Purpose

Define exactly what `CachedGitHubRepositoryProvider` may cache, for how long, and under what conditions it falls through to the wrapped provider.

## Interface

```ts
new CachedGitHubRepositoryProvider(provider: GitHubRepositoryProvider, options?: { ttlMs?: number; now?: () => number })
getRepositorySummary(projectId: string) -> Promise<GitHubRepositorySummary>
```

Implements `GitHubRepositoryProvider` unchanged; fully interchangeable with any other implementation at that interface.

## Caching Rules

| Condition | Behavior |
| --- | --- |
| No cache entry for `projectId`, or entry has expired (`expiresAt <= now()`) | Call the wrapped provider. |
| Wrapped provider returns `connectionStatus: "connected"` | Store an independent clone with `expiresAt = now() + ttlMs`. Return an independent clone to the caller. |
| Wrapped provider returns any other `connectionStatus` (`error`, `not_connected`) | Do not store anything; delete any existing entry for that key. Return an independent clone to the caller. |
| Cache entry exists and has not expired | Return an independent clone of the cached summary. The wrapped provider is not called. |

## Hard Prohibitions

- MUST NOT cache by anything other than the exact `projectId` string argument (no display names, titles, or repository URLs).
- MUST NOT cache a non-`"connected"` result under any circumstance.
- MUST NOT return the same object reference stored internally, on either a cache hit or a fresh fetch — every returned value is an independent clone.
- MUST NOT introduce any network call, timer, persistence, or side effect beyond delegating to the wrapped provider and reading an injected clock function.
- MUST NOT change the `GitHubRepositoryProvider` interface or require any change to `GitHubRepositoryService`, dashboard providers, or view code.

## Consumer Contract

`OfficeProjectPortalController` constructs exactly one `CachedGitHubRepositoryProvider`, wrapping its one `GitHubPublicRepositoryProvider` instance, and passes the result to `GitHubRepositoryService` — the only production composition change this feature makes.
