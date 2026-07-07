# Data Model: GitHub Public Read Cache

No new domain types are added to `GitHubRepositoryTypes.ts`. This feature adds one new internal type and one new class, scoped to the new file:

```ts
type CacheEntry = {
  summary: GitHubRepositorySummary; // stored as an independent clone
  expiresAt: number;                // now() + ttlMs at the time of the successful read
};

type CachedGitHubRepositoryProviderOptions = {
  ttlMs?: number;   // defaults to DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS
  now?: () => number; // defaults to () => Date.now()
};
```

`CachedGitHubRepositoryProvider` holds a single `Map<string, CacheEntry>` in memory, keyed by `projectId`. Nothing is persisted; the map is discarded when the instance is garbage collected (i.e., for the lifetime of one `OfficeProjectPortalController`/application session).
