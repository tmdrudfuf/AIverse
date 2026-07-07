# Contract: Repository Reference Resolver

## Purpose

Define exactly how a `projectId` resolves to a `{ owner, name }` reference for `GitHubPublicRepositoryProvider`, without that provider ever needing to discover or guess repositories itself.

## Function Signature

```ts
createRepositoryReferenceResolver(
  getMappings: () => ReadonlyArray<AIverseProjectRepositoryMapping>,
) -> (projectId: string) => { owner: string; name: string } | undefined
```

## Resolution Rules

1. Look up the mapping whose `projectId` matches the requested id, from `getMappings()` called fresh on every invocation.
2. If no mapping exists for that `projectId`, return `undefined`.
3. If a mapping exists, run it through the existing `validateAIverseProjectRepositoryMapping`. If `isValid` is `false` (disabled, malformed owner/name, or private), return `undefined`.
4. Otherwise, return `{ owner: mapping.repository.owner, name: mapping.repository.name }` — taken only from the mapping's own `repository` field, never from a project's `name`/display label or any other string.

## Hard Prohibitions

- MUST NOT derive `owner`/`name` from a project's display name, title, description, or any string other than `mapping.repository.owner`/`mapping.repository.name`.
- MUST NOT cache or snapshot the mapping array at resolver-construction time; each call reads `getMappings()` fresh.
- MUST NOT mutate the mapping array or any mapping object it reads.
- MUST NOT perform network I/O, duplicate `validateAIverseProjectRepositoryMapping`'s validity rules, or introduce a second, divergent notion of "valid mapping."

## Consumer Contract

`OfficeProjectPortalController` constructs exactly one resolver instance, bound to `() => this.state.repositoryMappings`, and passes it to exactly one `GitHubPublicRepositoryProvider` instance, which becomes the controller's sole `GitHubRepositoryProvider`. No router or per-project provider selection is introduced; the real provider's own existing "not configured" fallback (from spec 037) is what callers observe for anything the resolver cannot resolve.
