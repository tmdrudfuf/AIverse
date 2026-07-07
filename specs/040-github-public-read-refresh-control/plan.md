# Implementation Plan: GitHub Public Read Refresh Control

**Branch**: `040-github-public-read-refresh-control` | **Date**: 2026-07-08 | **Spec**: `specs/040-github-public-read-refresh-control/spec.md`

**Input**: Feature specification from `specs/040-github-public-read-refresh-control/spec.md`

## Summary

Add an explicit `refreshRepositorySummary(projectId)` capability to `CachedGitHubRepositoryProvider`, sharing its cache-update logic with the normal read path so both always agree on what gets stored. Extend `GitHubRepositoryService` with a matching, safely-optional passthrough. Wire a manual refresh action into the existing Repository Detail screen's input handler (Action/Enter), guarded by the same mapping-validity check the existing auto-refresh path already uses. No new `GitHubRepositorySummary` field, no `GitHubRepositoryProvider` interface change, no dashboard changes.

## Technical Context

**Language/Version**: TypeScript, existing Next.js/Phaser application code

**Primary Dependencies**: `CachedGitHubRepositoryProvider` (spec 039), `GitHubRepositoryService`, `GitHubPublicRepositoryProvider` (spec 037), `GitHubRepositoryReferenceResolver` (spec 038), `OfficeProjectPortalController`/`OfficeProjectPortalView`

**Storage**: No change; still the same in-memory `Map` from spec 039

**Testing**: Vitest, injected clock (no real timers), Phaser scene stub for the real-controller-action test (matching the pattern from spec 038's `OfficeProjectPortalController.repository-provider.test.ts`)

**Target Platform**: Same Next.js application

**Project Type**: Small edits to four existing files; no new production files

**Performance Goals**: Refresh issues exactly the same network calls a normal cache-miss read would; no additional overhead

**Constraints**: No `GitHubRepositoryProvider` interface change; no new summary field; no dashboard/Company-Dashboard changes; refresh only reachable from the existing Repository Detail screen

**Scale/Scope**: Edits to `CachedGitHubRepositoryProvider.ts`, `GitHubRepositoryService.ts`, `OfficeProjectPortalController.ts`, `OfficeProjectPortalView.ts`, plus their test files

## Constitution Check

- **Spec First**: PASS. `spec.md` defines user stories, requirements, non-goals, success criteria.
- **Plan Before Code**: PASS. This plan documents the seam, sharing strategy, and failure policy before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before code changes.
- **Preserve Application Stability**: PASS. Only the Repository Detail screen's input/render logic changes in the UI layer; Company/Project Dashboard, mock provider, and the `GitHubRepositoryProvider` interface are untouched.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check` required.

No constitution violations are expected.

## Existing System Review

- `CachedGitHubRepositoryProvider.getRepositorySummary` already contains the exact "call the wrapped provider, then cache-on-success/delete-on-failure, then clone and return" logic a refresh needs — it just also checks the cache first. Extracting that shared tail into a private helper lets both methods stay perfectly consistent by construction.
- `GitHubRepositoryService`'s sole existing responsibility is collapsing thrown exceptions into a display-safe shape; adding a second, identically-shaped method for refresh is a natural, in-scope extension, not new responsibility.
- `OfficeProjectPortalController` already has an isolated `updateRepositoryDetailInput` handler that today only reacts to `escapePressed`. Every other `update*Input` method in this class already follows the `if (input.actionPressed || input.enterPressed) { ... }` pattern for its primary action, so adding it here is consistent with the codebase's own conventions, not a new pattern.
- `hasRepositoryMapping(projectId)` and `shouldApplyRepositorySummary(projectId, requestVersion)` already exist and are exactly what a refresh action needs for its validity guard and stale-response guard, respectively — both are reused as-is.
- `GitHubRepositorySummary`'s existing `sourceStatus.lastSuccessfulFetchAt` is set to "now" only by `GitHubPublicRepositoryProvider` on an actual successful network read, and is left untouched by `CachedGitHubRepositoryProvider` on a cache hit (it returns a clone of the originally-stored summary, timestamp included). This already distinguishes a cache hit from a fresh read without any new field.

## Architecture Approach

1. **`CachedGitHubRepositoryProvider.ts`**:
   - Add `export interface GitHubRepositoryRefresher { refreshRepositorySummary(projectId: string): Promise<GitHubRepositorySummary>; }`.
   - `CachedGitHubRepositoryProvider implements GitHubRepositoryProvider, GitHubRepositoryRefresher`.
   - Extract the existing "call wrapped provider, cache-on-success/delete-on-failure, clone, return" block from `getRepositorySummary` into a private `fetchAndUpdateCache(projectId)` method.
   - `getRepositorySummary`: cache-check, else `return this.fetchAndUpdateCache(projectId)`.
   - `refreshRepositorySummary`: always `return this.fetchAndUpdateCache(projectId)` (no cache-check).
2. **`GitHubRepositoryService.ts`**:
   - Widen the constructor parameter type to `GitHubRepositoryProvider & Partial<GitHubRepositoryRefresher>` (backward compatible — the extra method is optional, so `MockGitHubRepositoryProvider` and existing test stubs need no changes).
   - Add `refreshRepositorySummary(projectId)`, mirroring `getRepositorySummary`'s try/catch, calling `this.provider.refreshRepositorySummary?.(projectId) ?? this.provider.getRepositorySummary(projectId)`.
3. **`OfficeProjectPortalController.ts`**:
   - Add a private `refreshRepositoryDetail(projectId)` method mirroring `openRepositoryDetail`'s async flow, but calling `this.repositoryService.refreshRepositorySummary(projectId)` instead of `getRepositorySummary`, and without touching `viewMode`/`selectedRepositoryProjectId` (already on that screen).
   - In `updateRepositoryDetailInput`, add: `if (input.actionPressed || input.enterPressed) { const projectId = this.state.selectedRepositoryProjectId; if (projectId && this.hasRepositoryMapping(projectId)) void this.refreshRepositoryDetail(projectId); }`.
4. **`OfficeProjectPortalView.ts`**:
   - In `renderRepositoryDetail`'s "connected" and "error" branches (where a valid mapping exists and refresh is meaningful), change the instruction text from `"Esc back"` to `"Esc back  Enter refresh"`. The "loading" and "not_connected" branches keep `"Esc back"` only, since refresh is a no-op (or not yet meaningful) there.

## Decision: refresh failure clears the previous cache entry

This is not a new decision — `refreshRepositorySummary` calls the exact same `fetchAndUpdateCache` helper `getRepositorySummary` already uses, which already deletes any existing cache entry on a non-`"connected"` result (established and reviewed in spec 039). Reusing this helper means refresh inherits that policy automatically, rather than requiring a new, separate decision that could drift from the read path's behavior. This satisfies "if stale cache remains available after refresh failure, it must not be labeled as fresh" — there is no stale cache remaining after a failed refresh; it is cleared, so the very next read (cache or refresh) always re-attempts rather than serving anything stale.

## Decision: no new field to mark cache-vs-fresh

Adding a field like `fromCache: boolean` directly to `GitHubRepositorySummary` would expand `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`, which specs 036-039 established as a fixed, tested boundary. Instead, the existing `sourceStatus.lastSuccessfulFetchAt` (and `lastUpdatedAt`) already changes only on a genuine network read and stays fixed across cache hits, which is sufficient signal for anyone (or any future UI) wanting to distinguish "just read" from "served from cache a while ago," with zero contract changes.

## Data Boundaries

- No new `GitHubRepositorySummary` field; no change to `GITHUB_PUBLIC_READ_SUMMARY_FIELDS`.
- Refresh reads and writes only the same in-memory cache `Map` spec 039 already introduced; no new storage.
- No mapping, project, task, employee, or advisory state is read or written by the refresh path beyond the existing `state.repositorySummaries[projectId]` assignment `openRepositoryDetail` already performs.

## File Touchpoints

- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.ts` (edit)
- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts` (edit: add refresh tests)
- `src/features/city-view/scene/office/github/GitHubRepositoryService.ts` (edit)
- `src/features/city-view/scene/office/github/GitHubRepositoryService.test.ts` (edit: add refresh passthrough tests)
- `src/features/city-view/scene/office/OfficeProjectPortalController.ts` (edit)
- `src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts` (edit: add a real-action-path refresh test)
- `src/features/city-view/scene/office/OfficeProjectPortalView.ts` (edit: instruction text only)

No other production file changes; no new production files.

## Risk Assessment

- **Divergence risk between read and refresh caching logic**: mitigated by extracting one shared private helper both methods call, so they cannot silently drift apart.
- **Accidental refresh-on-every-render risk**: mitigated by keeping refresh strictly input-triggered (`actionPressed`/`enterPressed`), never called from `render()` or `open()`.
- **Regression risk to `GitHubRepositoryService` consumers**: mitigated by widening its constructor type with an optional method only — structurally backward compatible, verified by running the full existing suite unchanged.
- **Scope creep risk**: mitigated by confining the new action to the Repository Detail screen only, with no Company/Project Dashboard changes and no new summary fields.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Manual verification:

1. `npx next dev`, open the office computer/project portal, open "Daily Proof"'s workspace, open its Repository section (Repository Detail screen).
2. Note the instruction hint now reads "Esc back  Enter refresh" once data has loaded.
3. Press Enter/Action — the screen shows a loading state, then a fresh read (a new `api.github.com` request in the network tab even if the 5-minute cache TTL has not elapsed).
4. Confirm no request occurs for a project with no repository mapping.

## Post-Design Constitution Check

The design remains spec-first, read-only, provider-neutral at the data-contract level, and confined to the smallest existing screen already dedicated to repository detail. No new field, no interface break, no persistence, polling, or credential flow is introduced.
