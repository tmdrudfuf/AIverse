# Implementation Plan: GitHub Public Read Cache

**Branch**: `039-github-public-read-cache` | **Date**: 2026-07-07 | **Spec**: `specs/039-github-public-read-cache/spec.md`

**Input**: Feature specification from `specs/039-github-public-read-cache/spec.md`

## Summary

Add `CachedGitHubRepositoryProvider`, a decorator implementing `GitHubRepositoryProvider` that wraps any other `GitHubRepositoryProvider` with an in-memory, TTL-based, clock-injectable cache keyed by `projectId`. Compose it around `GitHubPublicRepositoryProvider` in `OfficeProjectPortalController`'s constructor so repeated dashboard opens for the same mapped project reuse a recent successful read instead of re-hitting GitHub. Only successful (`connectionStatus: "connected"`) summaries are cached; every other state always falls through to the underlying provider.

## Technical Context

**Language/Version**: TypeScript, existing Next.js application code

**Primary Dependencies**: `GitHubRepositoryProvider` (interface, unchanged), `GitHubPublicRepositoryProvider` (spec 037), `GitHubRepositoryReferenceResolver` (spec 038), `OfficeProjectPortalController`

**Storage**: In-memory `Map` only, scoped to the lifetime of the `CachedGitHubRepositoryProvider` instance; no persistence

**Testing**: Vitest, with an injected clock function (`now: () => number`) instead of real timers, matching the "avoid real timers" constraint

**Target Platform**: Same Next.js application

**Project Type**: One new decorator class + one small controller edit + tests

**Performance Goals**: Cache lookups/writes are O(1) `Map` operations; no additional network calls beyond what the wrapped provider already makes

**Constraints**: No `GitHubRepositoryProvider` interface change; no persistence; no polling; failures are never cached

**Scale/Scope**: One new file pair (provider + test), one controller edit (constructor composition only)

## Constitution Check

- **Spec First**: PASS. `spec.md` defines user stories, requirements, non-goals, success criteria.
- **Plan Before Code**: PASS. This plan documents the cache seam and TTL/failure decisions before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before code changes.
- **Preserve Application Stability**: PASS. Only the controller's provider composition changes (one more decorator layer); no dashboard, view, or other provider file changes.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check` required.

No constitution violations are expected.

## Existing System Review

- `GitHubRepositoryProvider` is a single-method interface: `getRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>`. Both `MockGitHubRepositoryProvider` and `GitHubPublicRepositoryProvider` implement it directly; `GitHubRepositoryService` wraps whatever provider it's given and adds a defense-in-depth catch-all for unexpected thrown errors.
- `OfficeProjectPortalController`'s constructor already composes providers via decoration for the resolver seam (spec 038): `new GitHubRepositoryService(new GitHubPublicRepositoryProvider(createRepositoryReferenceResolver(...)))`. Adding one more decoration layer at the same call site is the natural, minimal extension of an already-established pattern — no new composition mechanism needs to be invented.
- `GitHubPublicRepositoryProvider.getRepositorySummary` returns exactly one of: a successful summary (`connectionStatus: "connected"`, `sourceStatus.state: "fresh"`) or one of several failure shapes (`connectionStatus: "error"` with `sourceStatus.state` in `rate_limited`/`offline`/`unavailable`, or `connectionStatus: "not_connected"` for unmapped projects). This binary distinction (`connected` vs. everything else) is exactly what the cache needs to decide what to store.
- A single dashboard-open action (`openProjectDashboard` → `refreshProjectDashboardRepositorySummary`) calls `getRepositorySummary` exactly once per action; no existing test calls it multiple times in quick succession for the same project id, so adding caching does not change any existing test's expected call count.

## Architecture Approach

1. **New file** `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.ts`:
   - Exports `DEFAULT_GITHUB_REPOSITORY_SUMMARY_CACHE_TTL_MS = 5 * 60 * 1000` (5 minutes) as an explicit, documented, overridable default.
   - Exports `CachedGitHubRepositoryProvider implements GitHubRepositoryProvider`, constructed with the wrapped provider plus `{ ttlMs?, now? }` options (both optional, defaulting to the constant above and `() => Date.now()` respectively).
   - `getRepositorySummary(projectId)`:
     - If a cache entry exists for `projectId` and `entry.expiresAt > now()`, return an independent clone of the cached summary without calling the wrapped provider.
     - Otherwise call the wrapped provider. If the result's `connectionStatus === "connected"`, store an independent clone with `expiresAt = now() + ttlMs`. Otherwise, delete any existing entry for that key (so a later success is never masked by a previously-cached success that has since gone stale/invalid, and so a failure is never itself cached).
     - Always return an independent clone of whatever summary is returned, whether from cache or freshly fetched, so no caller can mutate cache-internal state.
2. **Controller edit** (`OfficeProjectPortalController.ts`): wrap the existing `GitHubPublicRepositoryProvider` construction with `CachedGitHubRepositoryProvider`:
   ```ts
   this.repositoryService = new GitHubRepositoryService(
     new CachedGitHubRepositoryProvider(
       new GitHubPublicRepositoryProvider(createRepositoryReferenceResolver(() => this.state.repositoryMappings)),
     ),
   );
   ```
3. **No other production file changes.** `GitHubRepositoryProvider.ts`, `GitHubRepositoryService.ts`, `GitHubPublicRepositoryProvider.ts`, `GitHubRepositoryReferenceResolver.ts`, `MockGitHubRepositoryProvider.ts`, and every dashboard/view file are untouched.

## Decision: failures are not cached, even briefly

Considered caching failures for a short duration (e.g., a few seconds) to avoid hammering a genuinely down/rate-limited endpoint on rapid repeated reads. Decided against it for this slice:

- Caching a `rate_limited` result would force the user to wait out the cache TTL even after GitHub's rate limit window resets, which is worse than simply re-attempting (a retry costs the same "one more failed call" either way — there is no rate-limit-budget benefit to caching a failure, since the budget is only saved by avoiding *repeated successful* reads).
- The explicit instruction to prefer safety over cleverness applies directly here: never hiding a possibly-already-recovered read behind a stale failure is the safer default.
- This keeps the implementation simple: exactly one condition (`connectionStatus === "connected"`) decides cacheability.

This decision is tested directly (see `tasks.md`/test list): a failure must never be served from cache, and the read immediately following a failure must call the underlying provider again.

## Data Boundaries

- The cache only ever stores what the wrapped provider already returned; it derives nothing new and reads nothing beyond `projectId` and the wrapped provider's output.
- No mapping, project, or advisory state is read or written by this class.
- Dashboard consumers are unaffected; they still read `state.repositorySummaries`/`state.projectDashboardSnapshot`, unaware that a cache now sits between the controller and the network.

## File Touchpoints

- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.ts` (new)
- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts` (new)
- `src/features/city-view/scene/office/OfficeProjectPortalController.ts` (edit: constructor composition only)

## Risk Assessment

- **Stale-data risk**: a successful read stays cached for up to 5 minutes even if the real repository changes in that window. Mitigation: TTL is short relative to typical demo/dev session pacing and is an explicit, overridable constructor option, not a hidden constant.
- **Masking-failure risk**: mitigated by the explicit decision above — failures are never cached, so a transient rate-limit/offline state resolves itself on the very next read attempt rather than being "stuck" for a TTL window.
- **Existing-test regression risk**: mitigated by confirming no existing test calls `getRepositorySummary` more than once per project id in quick succession; the new controller-level test explicitly exercises repeated calls to prove the cache's presence doesn't change single-call behavior.
- **Scope creep risk**: mitigated by keeping this to exactly one new decorator class and one controller composition edit; no persistence, polling, or router logic is introduced.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Manual verification:

1. `npx next dev`, open the mapped project's ("Daily Proof") Project Dashboard, close it, and reopen it within a few seconds — the browser network tab should show no new `api.github.com` requests on the second open.
2. Wait past the 5-minute TTL and reopen — new requests should appear.

## Post-Design Constitution Check

The design remains spec-first, read-only, provider-neutral, and scoped to exactly one new decorator composed at the same seam spec 038 already established. No persistence, polling, credential flow, or router/dispatch layer is introduced.
