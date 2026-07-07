# Contract: Refresh Concurrency Guard

## Purpose

Define exactly when a call reaches the underlying provider versus joins an existing in-flight call.

## Behavior Rules

| Condition | Behavior |
| --- | --- |
| No in-flight entry exists for `projectId` | A new underlying call starts; its promise is stored in the in-flight map for the duration of the call. |
| An in-flight entry already exists for `projectId` (from either `getRepositorySummary`'s cache-miss path or `refreshRepositorySummary`) | The caller joins that promise; no new underlying call is made. The caller still receives an independently-cloned result once it settles. |
| The in-flight call settles (resolves or rejects) | The in-flight entry for that `projectId` is removed unconditionally (`finally`), regardless of outcome. |
| Two different `projectId`s are both in flight simultaneously | Each has its own independent entry; neither call waits on or is affected by the other. |
| A cache hit occurs (non-expired cached summary) | The in-flight map is never consulted or touched; this path is unchanged from spec 039. |

## Hard Prohibitions

- MUST NOT allow more than one underlying-provider call in flight per `projectId` at a time.
- MUST NOT return the same object reference to two different callers; every return path clones independently.
- MUST NOT leave a permanent in-flight entry after a call settles, regardless of success or failure.
- MUST NOT introduce module-level, static, or otherwise cross-instance shared state.
- MUST NOT change `GitHubRepositoryProvider`, `GitHubRepositoryRefresher`, `GitHubRepositoryService`, or any controller/view file.

## Consumer Contract

No consumer-visible change. `OfficeProjectPortalController` continues to call `this.repositoryService.getRepositorySummary`/`refreshRepositorySummary` exactly as before; the coalescing is entirely transparent to every existing caller.
