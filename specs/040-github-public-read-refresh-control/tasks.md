# Tasks: GitHub Public Read Refresh Control

**Input**: Design documents from `specs/040-github-public-read-refresh-control/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `CachedGitHubRepositoryProvider`, `GitHubRepositoryService`, and `GitHubRepositoryProvider` to confirm the exact shared logic a refresh method needs and the safest way to expose it without an interface break.
- [x] T002 Inspect `OfficeProjectPortalController`'s Repository Detail screen (`openRepositoryDetail`, `updateRepositoryDetailInput`, `hasRepositoryMapping`, `shouldApplyRepositorySummary`) to confirm it is the smallest correct UI seam.
- [x] T003 Inspect `OfficeProjectPortalView.renderRepositoryDetail` to confirm the exact instruction-text lines to update.
- [x] T004 Confirm `GitHubRepositorySummary`'s existing `sourceStatus.lastSuccessfulFetchAt` already distinguishes a cache hit from a fresh read, so no new field is needed.

---

## Phase 2: Cache and Service Refresh Capability

- [x] T005 Add `GitHubRepositoryRefresher` interface and refactor `CachedGitHubRepositoryProvider` to share cache-update logic between `getRepositorySummary` and a new `refreshRepositorySummary` via a private helper.
- [x] T006 Add tests: refresh bypasses cache within TTL; successful refresh replaces the cache for subsequent normal reads; refresh for one project does not affect another's cache; refresh failure does not fabricate success; refresh failure clears (does not preserve) the previous cache entry; unmapped-project refresh performs zero fetch calls.
- [x] T007 Widen `GitHubRepositoryService`'s constructor type and add its `refreshRepositorySummary` passthrough with the same error-collapsing safety net.
- [x] T008 Add tests: passthrough calls the wrapped provider's native refresh when available; falls back to `getRepositorySummary` when not; collapses thrown exceptions the same way `getRepositorySummary` does.

---

## Phase 3: Controller and View Wiring

- [x] T009 Add `refreshRepositoryDetail(projectId)` to `OfficeProjectPortalController` and wire `actionPressed`/`enterPressed` in `updateRepositoryDetailInput`, guarded by `hasRepositoryMapping`.
- [x] T010 Update `OfficeProjectPortalView.renderRepositoryDetail`'s instruction text for the "connected" and "error" branches to include the refresh hint; leave "loading"/"not_connected" unchanged.
- [x] T011 Add a real-controller-action test (constructing `OfficeProjectPortalController` with a Phaser scene stub and stubbed global `fetch`) proving: opening Repository Detail then triggering refresh issues a second real network call even within the cache TTL; triggering the action for an unmapped project issues no network call.

---

## Phase 4: Validation and Review Readiness

- [x] T012 Run `npm test`.
- [x] T013 Run `npx tsc --noEmit`.
- [x] T014 Run `npm run build`.
- [x] T015 Run `git diff --check`.
- [x] T016 Confirm no new `GitHubRepositorySummary` field, no `GitHubRepositoryProvider` interface change, and no Company/Project Dashboard file changes.

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 (cache/service) must exist before Phase 3 (controller/view) uses it.
- Phase 4 runs after Phases 2 and 3.

## Implementation Strategy

1. Confirm the smallest UI seam already exists; don't invent a new one.
2. Share cache-update logic between read and refresh via one private helper so they cannot diverge.
3. Widen the service's accepted type optionally, not the shared provider interface.
4. Wire the controller/view change as one guarded input branch and one instruction-text edit.
5. Prove the real action path with an integration-style test, not just the underlying methods in isolation.
6. Run full validation and confirm no unrelated file or data-contract change.
