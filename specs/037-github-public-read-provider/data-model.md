# Data Model: GitHub Public Read Provider

No new domain types are introduced. This feature reuses existing types from `GitHubRepositoryTypes.ts`:

- `GitHubRepositorySummary` — the only return shape the new provider produces.
- `GitHubExternalSourceStatus` / `GitHubExternalSourceStatusState` — used for `fresh`, `rate_limited`, `offline`, `unavailable` mapping.
- `GitHubLatestCommit` — used for the latest-commit field.
- `GitHubRepositoryProvider` — the interface the new class implements.

One new local type is added, scoped to the new provider file:

```ts
export type GitHubRepositoryReferenceResolver = (
  projectId: string,
) => { owner: string; name: string } | undefined;
```

This resolver is supplied by the caller (not implemented by this feature) and lets the provider resolve a project id to a repository owner/name without changing the existing `GitHubRepositoryProvider` interface or requiring this feature to touch `OfficeProjectPortalController.ts`.
