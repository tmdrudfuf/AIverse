# Tasks: GitHub Refresh Concurrency Guard

**Input**: Design documents from `specs/041-github-refresh-concurrency-guard/`
**Prerequisites**: `plan.md`, `spec.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `CachedGitHubRepositoryProvider`'s shared `fetchAndUpdateCache` helper to confirm it is the single choke point both `getRepositorySummary` and `refreshRepositorySummary` already use.
- [x] T002 Inspect `OfficeProjectPortalController`'s `repositoryRequestVersion`/`shouldApplyRepositorySummary` to confirm the UI-write-ordering problem is already solved and out of scope for this feature.
- [x] T003 Confirm no existing test exercises genuine overlapping/concurrent calls to the same project id.

---

## Phase 2: Concurrency Guard Implementation

- [x] T004 Add a private, instance-scoped `inFlightRequests` map to `CachedGitHubRepositoryProvider`.
- [x] T005 Rename the existing `fetchAndUpdateCache` body into a new private `performFetchAndUpdateCache`; reimplement `fetchAndUpdateCache` to check/join the in-flight map, storing and clearing entries in a `try/finally`.
- [x] T006 Ensure every return path (original caller and joiners) clones the summary independently.

---

## Phase 3: Tests

- [x] T007 Add a deferred-promise test helper (no real timers) for deterministic overlap.
- [x] T008 Add tests: two concurrent same-project calls result in exactly one underlying call; both callers receive equivalent (deep-equal) but independently-cloned results; a later call after settlement starts a new underlying call; a failed in-flight call still clears the guard and allows an immediate retry; two different project ids refresh independently without blocking each other; mutating one caller's result does not affect the other's.
- [x] T009 Update the existing "satisfies the interface" prototype-shape test to include the new private method.
- [x] T010 Confirm unchanged behavior: normal cache-hit-within-TTL read, unmapped-project zero-fetch, and display-safe rate-limit/offline/malformed paths all still pass through this new coalescing layer correctly.

---

## Phase 4: Validation and Review Readiness

- [x] T011 Run `npm test`.
- [x] T012 Run `npx tsc --noEmit`.
- [x] T013 Run `npm run build`.
- [x] T014 Run `git diff --check`.
- [x] T015 Confirm no other production file changed (`GitHubRepositoryProvider.ts`, `GitHubRepositoryService.ts`, `OfficeProjectPortalController.ts`, `OfficeProjectPortalView.ts`, `GitHubPublicRepositoryProvider.ts`, `MockGitHubRepositoryProvider.ts` all untouched).

## Dependencies

- Phase 1 must complete before implementation.
- Phase 2 must complete before Phase 3's tests can pass.
- Phase 4 runs after Phases 2 and 3.

## Implementation Strategy

1. Confirm the shared helper is the correct, smallest choke point; no controller/service change needed.
2. Add the in-flight map and join/settle logic with a `finally`-guaranteed cleanup.
3. Prove overlap deterministically with manually-controlled deferred promises, not real timers.
4. Confirm every existing spec 037-040 test still passes unchanged.
5. Run full validation and confirm no unrelated file changed.
