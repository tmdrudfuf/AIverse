# Data Model: GitHub Refresh Concurrency Guard

No changes to `GitHubRepositorySummary`, `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`, `GitHubRepositoryProvider`, or `GitHubRepositoryRefresher`. One new private field is added, scoped to `CachedGitHubRepositoryProvider`:

```ts
private readonly inFlightRequests = new Map<string, Promise<GitHubRepositorySummary>>();
```

Keyed by `projectId`, holding at most one pending promise per project at any time. Instance-scoped (a private class field, not module-level), so each `CachedGitHubRepositoryProvider` instance has its own independent map — never shared across instances or across the application.

The existing private helper `fetchAndUpdateCache` is retained as the public-facing shared entry point (used unchanged by `getRepositorySummary` and `refreshRepositorySummary`); its previous body is relocated into a new private method, `performFetchAndUpdateCache`, which `fetchAndUpdateCache` now calls only when no in-flight entry already exists for that project id.
