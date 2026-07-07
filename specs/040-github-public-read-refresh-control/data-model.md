# Data Model: GitHub Public Read Refresh Control

No changes to `GitHubRepositorySummary`, `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`, or any other existing domain type. One new interface is added, scoped to `CachedGitHubRepositoryProvider.ts`:

```ts
export interface GitHubRepositoryRefresher {
  refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>;
}
```

`CachedGitHubRepositoryProvider` implements both `GitHubRepositoryProvider` (unchanged) and this new interface. `GitHubRepositoryService`'s constructor parameter type is widened to `GitHubRepositoryProvider & Partial<GitHubRepositoryRefresher>` — a backward-compatible widening, not a breaking change, since the added method is optional.

No new controller-level or view-level types are introduced; `OfficeProjectPortalController`'s existing `OfficeProjectPortalInput` type (`actionPressed`/`enterPressed`/etc.) already carries everything the new refresh action needs.
