# Data Model: GitHub Public Read Provider Wiring

No new domain types are introduced. This feature composes existing types:

- `AIverseProjectRepositoryMapping` (`GitHubRepositoryTypes.ts`, spec 031) — the resolver's only input source.
- `GitHubRepositoryReference` / `GitHubRepositoryReferenceResolver` (`GitHubPublicRepositoryProvider.ts`, spec 037) — the resolver's output/return type, reused as-is.
- `GitHubRepositoryProvider` (`GitHubRepositoryProvider.ts`) — unchanged interface.

One new function is added, scoped to a new file:

```ts
function createRepositoryReferenceResolver(
  getMappings: () => ReadonlyArray<AIverseProjectRepositoryMapping>,
): GitHubRepositoryReferenceResolver
```

`getMappings` is a thunk (not a static array) so the resolver always reads the controller's current `state.repositoryMappings`, never a stale snapshot captured at construction time.
