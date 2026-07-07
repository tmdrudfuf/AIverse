# Research: GitHub Public Read Cache

## Where should the cache live?

Options considered: inside `GitHubRepositoryService` (the existing thin wrapper that already exists for error-collapsing), inside `GitHubPublicRepositoryProvider` itself, or as a new decorator implementing `GitHubRepositoryProvider`.

Decision: a new decorator, `CachedGitHubRepositoryProvider`. `GitHubRepositoryService`'s single responsibility is collapsing thrown exceptions into a display-safe shape — mixing caching into it would blur that responsibility and make it harder to reason about independently. `GitHubPublicRepositoryProvider`'s responsibility is real network reads — mixing caching in would violate "keep the network provider focused on network reads." A decorator that itself implements `GitHubRepositoryProvider` composes cleanly at the exact seam spec 038 already established (constructor injection in `OfficeProjectPortalController`), requires no interface change, and is trivially reusable around `MockGitHubRepositoryProvider` too if ever wanted, without either of those classes knowing caching exists.

## What should the cache key be?

The only input to `getRepositorySummary` is `projectId`, which is already the same deterministic identity `state.repositorySummaries` and `state.repositoryMappings` are keyed by elsewhere in the existing codebase. No richer key (e.g., resolved owner/name) is needed or appropriate — deriving one would require the cache to depend on the resolver, coupling two independent composition layers unnecessarily, and would not add any correctness benefit since `projectId -> mapping` is static for the lifetime of this application (no mapping-editing feature exists). Decision: cache key is exactly the `projectId` string argument.

## Should failures be cached, even briefly?

Considered briefly caching failures (a few seconds) to reduce redundant calls during a burst of rapid retries against a genuinely-down endpoint. Decision: do not cache failures at all.

- Caching a rate-limited/offline/unavailable result provides no rate-limit-budget benefit — the budget is only saved by avoiding repeated *successful* reads; a failed call already didn't consume a "wasted" successful read that caching could have prevented.
- Caching a failure risks the opposite of the desired UX: if GitHub recovers or the rate-limit window resets a few seconds later, a cached failure would force the user to wait out the full TTL instead of simply succeeding on the next natural read.
- The task's explicit guidance is to prefer safety unless there's a strong reason otherwise; not hiding a possibly-recovered read behind a stale failure is the safer choice.

This makes the caching rule simple and easy to verify: only `connectionStatus === "connected"` results are stored; everything else always falls through.

## How to keep tests deterministic without real timers?

`CachedGitHubRepositoryProvider` accepts an optional `now: () => number` in its constructor options, defaulting to `() => Date.now()`. Tests inject a controllable clock (a simple mutable counter or `vi.fn()` returning successive values) instead of using `vi.useFakeTimers()`/real `setTimeout` delays, keeping TTL-expiry tests instant and deterministic.

## Does this change any existing test's expectations?

No. A single dashboard-open action calls `getRepositorySummary` exactly once (`openProjectDashboard` → `refreshProjectDashboardRepositorySummary`, one call each). No existing test in specs 037/038 calls it more than once in quick succession for the same project id, so adding a cache layer that only changes behavior on a *second* call within the TTL does not alter any existing test's observable outcome.
