# Implementation Plan: GitHub Refresh Concurrency Guard

**Branch**: `041-github-refresh-concurrency-guard` | **Date**: 2026-07-08 | **Spec**: `specs/041-github-refresh-concurrency-guard/spec.md`

**Input**: Feature specification from `specs/041-github-refresh-concurrency-guard/spec.md`

## Summary

Add a per-project in-flight request map to `CachedGitHubRepositoryProvider`'s shared `fetchAndUpdateCache` helper (introduced in spec 040), so any two overlapping calls that would otherwise reach the underlying provider for the same project id — whether both are manual refreshes, both are normal cache-miss reads, or a mix — coalesce into a single underlying call. Joining callers each receive an independently-cloned result. The entry is removed in a `finally` block regardless of success or failure. No other file changes.

## Technical Context

**Language/Version**: TypeScript, existing Next.js application code

**Primary Dependencies**: `CachedGitHubRepositoryProvider` (specs 039-040) only

**Storage**: One additional in-memory `Map<string, Promise<GitHubRepositorySummary>>`, instance-scoped, no persistence

**Testing**: Vitest with deferred promises (manually resolved/rejected controllable promises) to simulate real overlap deterministically, no real timers

**Target Platform**: Same Next.js application

**Project Type**: Single-file production edit plus its test file

**Performance Goals**: Zero additional overhead for non-overlapping calls; overlapping calls save the redundant network round trip entirely

**Constraints**: No `GitHubRepositoryProvider` interface change; no controller/service/view change; instance-scoped state only

**Scale/Scope**: One file edited (`CachedGitHubRepositoryProvider.ts`), one test file extended

## Constitution Check

- **Spec First**: PASS. `spec.md` defines user stories, requirements, non-goals, success criteria.
- **Plan Before Code**: PASS. This plan documents the exact seam and sharing/cloning semantics before implementation.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before code changes.
- **Preserve Application Stability**: PASS. No controller, service, or view file changes at all; the existing `repositoryRequestVersion` UI guard is untouched and continues to handle its own, separate concern.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check` required.

No constitution violations are expected.

## Existing System Review

- `CachedGitHubRepositoryProvider.getRepositorySummary` (cache-miss path) and `refreshRepositorySummary` (always) both already delegate to one shared private helper, `fetchAndUpdateCache`, introduced in spec 040 specifically so the two methods can never disagree about cache-update behavior. This is exactly the single choke point a concurrency guard needs.
- `OfficeProjectPortalController.refreshRepositoryDetail` already increments `repositoryRequestVersion` on every refresh attempt and only applies a response to `state.repositorySummaries` if that version still matches when the response arrives (`shouldApplyRepositorySummary`). This already prevents an older refresh's UI write from overwriting a newer one — a complementary, already-solved problem at the UI-state layer. This feature does not touch it.
- Because the controller's existing guard operates purely on request *ordering* (which response wins), not on request *deduplication* (how many real network calls occur), it does not by itself prevent duplicate underlying GitHub reads when the same project is refreshed twice in quick succession — that gap is what this feature closes, entirely inside `CachedGitHubRepositoryProvider`.
- No test currently exercises overlapping concurrent calls to the same project id; all existing specs 037-040 tests call sequentially (`await` each call before the next).

## Architecture Approach

1. Add a private, instance-scoped field: `private readonly inFlightRequests = new Map<string, Promise<GitHubRepositorySummary>>();`
2. Change `fetchAndUpdateCache(projectId)` to:
   - If `this.inFlightRequests` already has an entry for `projectId`, return `existing.then(cloneSummary)` (join: await the same underlying call, but return an independently-cloned result to this caller).
   - Otherwise, start the actual work (renamed to a new private method, e.g. `performFetchAndUpdateCache`), store that promise in `this.inFlightRequests`, and in a `try/finally` await it while always deleting the map entry in `finally` regardless of outcome.
3. `performFetchAndUpdateCache(projectId)` contains exactly the logic `fetchAndUpdateCache` had before this feature (call the wrapped provider, cache-on-success/delete-on-failure, clone, return) — unchanged behavior, just relocated and renamed so the new coalescing wrapper can sit in front of it.
4. `getRepositorySummary` and `refreshRepositorySummary` themselves are unchanged; they already call `fetchAndUpdateCache`, which now transparently coalesces.

## Decision: join, not queue or no-op

A second overlapping request joins the exact same in-flight promise (awaiting the identical underlying network result) rather than being silently dropped (no-op, which would leave the caller without a result) or queued behind the first (which would add unnecessary latency and complexity for no benefit, since both calls are for the identical data). Joining is the simplest option that still gives every caller a real, correct result while guaranteeing only one underlying call.

## Decision: clone independently for every caller, including joiners

Returning the exact same object reference to multiple callers would let one caller's mutation corrupt what another caller (or a future cache read) sees. Every return path — the original caller and every joiner — passes through `cloneSummary`, consistent with the mutation-isolation discipline already established in specs 039-040.

## Data Boundaries

- No new `GitHubRepositorySummary` field; no interface change.
- The in-flight map holds only `Promise<GitHubRepositorySummary>` values already produced by the existing wrapped-provider call; nothing new is read or computed.
- No mapping, project, task, employee, or advisory state is touched by this feature at all.

## File Touchpoints

- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.ts` (edit)
- `src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts` (edit: add concurrency tests, update the prototype-shape test for the renamed/added private method)

No other file changes.

## Risk Assessment

- **Deadlock/stuck-guard risk**: mitigated by the `finally` block, which always removes the in-flight entry regardless of success or failure — tested directly.
- **Cross-project blocking risk**: mitigated by keying the map by `projectId`; tested directly with two concurrent different-project calls.
- **Mutation-leak risk between joined callers**: mitigated by cloning on every return path, including joiners; tested directly by mutating one caller's result and checking the other's is unaffected.
- **Test flakiness from real timing**: mitigated by using manually-controlled deferred promises (a `{ promise, resolve, reject }` triple built with `new Promise(...)`) instead of real timers or `setTimeout`, so overlap is deterministic and instant.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Manual verification:

1. `npx next dev`, open the office computer/project portal, open "Daily Proof"'s Repository Detail screen.
2. Press Enter/Action twice in rapid succession before the first refresh's loading state clears.
3. Confirm the network tab shows only one set of `api.github.com` requests (repo/commits/pulls), not two.

## Post-Design Constitution Check

The design remains spec-first, read-only, and confined to a single existing file's private helper. No new field, no interface change, no controller/service/view change, no persistence, and no global/shared state is introduced.
