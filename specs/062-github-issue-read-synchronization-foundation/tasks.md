---
description: "Task list for Spec 062 — GitHub Issue Read Synchronization Foundation"
---

# Tasks: GitHub Issue Read Synchronization Foundation

**Input**: Design documents from `specs/062-github-issue-read-synchronization-foundation/` (spec.md, plan.md)

**Tests**: Included — the Spec explicitly requires coverage for domain normalization, provider behavior, immutability, concurrency, controller behavior, and view behavior.

**Organization**: Grouped by user story per `plan.md`'s Project Structure. One new domain module (`issue-sync/`) plus targeted modifications to existing Spec 059-061 controller/view/registry files. No changes to the GitHub repository-summary pipeline or the `repository-sync/` module (beyond one type import).

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The snapshot/collection model, reused lifecycle alias, and provider contract must exist before any provider, service, controller, or view work can proceed.

- [X] T001 Create `src/features/city-view/scene/office/issue-sync/IssueSyncTypes.ts`: `IssueSyncStatus` (alias of `RepositorySyncStatus` from `../repository-sync/RepositorySyncTypes`), `IssueState`, `IssueAuthor`, `IssueSnapshot`, `IssueSnapshotCollection`, and factory functions `createNotStartedIssueSnapshotCollection(identity)`, `createSyncingIssueSnapshotCollection(identity, previous?)`, `createUnavailableIssueSnapshotCollection(identity, errorSummary)`, `createFailedIssueSnapshotCollection(identity, errorSummary)` (per spec.md's Key Entities / plan.md's field table).
- [X] T002 Create `src/features/city-view/scene/office/issue-sync/IssueSyncProvider.ts`: the read-only `IssueSyncProvider` contract (`providerId`, `readIssueSnapshots(identity)`), no mutation method.
- [X] T003 [P] Add `src/features/city-view/scene/office/issue-sync/IssueSyncTypes.test.ts`: each factory function produces the expected shape, `previous.lastSuccessfulSyncAt` carry-forward in the Syncing factory, and that factory-produced `issues`/`assignees`/`labels` arrays are fresh (not shared references) across calls.

**Checkpoint**: Types compile; no other file has been touched yet.

---

## Phase 2: User Story 1 - See Daily Proof's real, filtered issue list (P1) 🎯 MVP

**Goal**: Opening Daily Proof's project dashboard shows a real, pull-request-free GitHub issue collection with correct counts and deterministic ordering.

**Independent Test**: Open Daily Proof's project dashboard with a fresh `createProjectPortalState()`, let a mocked GitHub issues fetch resolve with a mix of issues and pull requests, and confirm the lower panel shows `[ISSUES] Succeeded · <n> open, <n> closed` with pull requests excluded.

### Implementation for User Story 1

- [X] T004 [US1] Create `src/features/city-view/scene/office/issue-sync/GitHubIssueSyncProvider.ts`: fetches `GET /repos/{owner}/{repo}/issues?state=all&sort=updated&direction=desc&per_page=51` (optional injectable `fetchImpl`, matching `GitHubPublicRepositoryProvider`'s convention); computes `isTruncated` from the raw (pre-exclusion) item count; excludes any raw item carrying a `pull_request` field; normalizes remaining items into `IssueSnapshot`s per plan.md's field-mapping table (defensive array copies for `assignees`/`labels`, both GitHub label shapes handled); applies deterministic ordering (open before closed, updated-desc, number-asc tie-break); maps HTTP/network failures to `Failed`, a 404 to `Unavailable`, using the same rate-limit/error-reason conventions as `GitHubPublicRepositoryProvider.ts` (depends on T001, T002).
- [X] T005 [US1] Create `src/features/city-view/scene/office/issue-sync/LocalIssueSyncProvider.ts`: always returns an honest `Unavailable` collection via `createUnavailableIssueSnapshotCollection`, reason: local repository reads need server-side support (same reason text Spec 061 established) (depends on T001, T002).
- [X] T006 [US1] Create `src/features/city-view/scene/office/issue-sync/IssueSyncService.ts`: constructed with a `providerId -> IssueSyncProvider` map; `readIssueSnapshots(identity, previous?)` dispatches on `identity.provider`, falls back to an `Unavailable` "no provider registered" collection for an unrecognized provider string, catches any thrown error into a generic `Unavailable` collection, and stamps `lastSuccessfulSyncAt` with `new Date().toISOString()` only when the result's `syncStatus === "Succeeded"` (otherwise carries `previous?.lastSuccessfulSyncAt` forward) (depends on T001, T002, T004, T005).
- [X] T007 [US1] Create `src/features/city-view/scene/office/issue-sync/IssueSyncView.ts`: pure function `createIssueSyncDisplayRows(identity, collection)` returning up to three display-row strings (`[ISSUES]` status/count summary with `· partial` suffix when truncated; `[ISSUE LIST]` with exactly one visible issue title bounded to 34 characters plus a `+N more` suffix; `[ISSUE DETAIL]` with bounded labels/assignees, omitted when both are empty), returning `["No repository identity"]`-equivalent when `identity` is absent, per plan.md's row-budget table (depends on T001).
- [X] T008 [US1] In `OfficeProjectPortalTypes.ts`, add `issueSyncCollections: Record<string, IssueSnapshotCollection>` to `ProjectPortalState` (depends on T001).
- [X] T009 [US1] In `OfficeProjectPortalRegistry.ts`, initialize `issueSyncCollections: {}` in `createProjectPortalState()` (depends on T008).
- [X] T010 [US1] In `OfficeProjectPortalController.ts`: add `issueSyncService: IssueSyncService` field (constructed with `{ github: new GitHubIssueSyncProvider(), local: new LocalIssueSyncProvider() }`), a private `issueSyncRequestVersion` counter, `private async syncIssueSnapshots(projectId)`, and `private shouldApplyIssueSyncCollection(projectId, requestVersion)` (mirroring `shouldApplyRepositorySyncSnapshot`'s structure but checking the new counter) (depends on T006, T008).
- [X] T011 [US1] In `OfficeProjectPortalController.ts`'s `openProjectDashboard`, add `void this.syncIssueSnapshots(projectId);` alongside the existing repository-summary/repository-sync calls (depends on T010).
- [X] T012 [US1] In `OfficeProjectPortalView.ts`'s `renderProjectDashboard`, resolve the dashboard project's `repositoryIdentity` and `issueSyncCollections` entry, call `createIssueSyncDisplayRows`, and splice up to three rows into `createProjectDashboardLowerRows`'s returned array when non-empty (depends on T007, T008).
- [X] T013 [P] [US1] Add `GitHubIssueSyncProvider.test.ts`: normalization of a mixed issues/pull-requests fixture (PRs excluded from output, counts, and ordering); both GitHub label shapes (string and `{name}`) normalize correctly; missing optional body/labels/assignees/closed-timestamp handled safely; open/closed state normalization; deterministic ordering (open-before-closed, updated-desc, number tie-break); truncation flag true at 51 raw items and false at exactly 50; 404/network/rate-limit error mapping; no mutation endpoint or method is invoked.
- [X] T014 [P] [US1] Add `IssueSyncService.test.ts`: dispatch to the correct provider, unrecognized-provider fallback, thrown-error catch-all, `lastSuccessfulSyncAt` stamped on Succeeded and carried forward otherwise.
- [X] T015 [P] [US1] Add `IssueSyncView.test.ts`: one row set per `syncStatus` (`NotStarted`/`Syncing`/`Succeeded` with issues/`Succeeded` with zero issues/`Failed`/`Unavailable`), `No repository identity` when identity is absent, `+N more` and `· partial` suffixes present and never truncated off by the row-budget computation, labels/assignees row omitted when both are empty.
- [X] T016 [US1] Update `OfficeProjectPortalView.test.ts`: opening Daily Proof's project dashboard with a resolved `Succeeded` collection (multiple issues) in state renders `[ISSUES]`/`[ISSUE LIST]`/`[ISSUE DETAIL]` rows within the existing dynamically-stacked lower panel (no fixed-Y assertion, no panel overlap).

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 3: User Story 2 - Issue synchronization degrades safely without a usable GitHub repository (P1)

**Goal**: Portfolio's and AI Lab's project dashboards show an honest `Unavailable` issue state, distinguishable from a real zero-issue success.

### Implementation for User Story 2

- [X] T017 [P] [US2] Add `LocalIssueSyncProvider.test.ts`: always resolves `Unavailable` with a non-empty, display-safe `errorSummary`, regardless of the identity passed in; never `Succeeded`.
- [X] T018 [US2] Update `OfficeProjectPortalView.test.ts`: opening Portfolio's project dashboard with an `Unavailable` collection in state renders `[ISSUES] Unavailable: ...`; separately, a `Succeeded` collection with `issues: []` renders `[ISSUES] Succeeded · 0 open, 0 closed` — asserting the two are textually and structurally distinct.
- [X] T019 [US2] Add a real end-to-end controller test (mirroring 061's Portfolio reachability test) proving Portfolio's project dashboard is reachable from the list via the real wired providers and reports `Unavailable` with no network call.

**Checkpoint**: Both populated (GitHub) and unavailable (local) states are covered, plus the real-zero-issues case.

---

## Phase 4: User Story 3 - Stale/out-of-order protection and project-switch isolation (P1)

**Goal**: Prove a slower, older issue sync can never overwrite a newer one, that switching projects never leaks another project's issues, and that the three flows fired from `openProjectDashboard` do not invalidate each other.

### Implementation for User Story 3

- [X] T020 [US3] Create `OfficeProjectPortalController.issue-sync.test.ts`: (a) two overlapping `syncIssueSnapshots` calls for the same project where the first resolves after the second — assert the stored collection remains the second's result regardless of success/failure combination; (b) escaping the project dashboard before a sync resolves — assert the eventual result is never applied; (c) opening project A's dashboard, letting its sync resolve, then opening project B's dashboard before B's sync resolves — assert B never shows A's collection; (d) confirm `syncIssueSnapshots`, `syncRepositorySnapshot`, and `refreshProjectDashboardRepositorySummary` (all fired together from `openProjectDashboard`) do not invalidate each other; (e) assert `state.taskCollections` is unchanged (via `structuredClone` before/after) across a full issue sync — no task is created from an issue (depends on T010, T011).

**Checkpoint**: All three user stories independently verified.

---

## Phase 5: Immutability

**Goal**: Prove mutation of caller-owned input or previously-returned collections cannot corrupt internally stored state.

- [X] T021 [P] Add immutability tests (in `GitHubIssueSyncProvider.test.ts` and/or `IssueSyncTypes.test.ts`): mutating a raw GitHub response's nested `labels`/`assignees` arrays after normalization does not alter the produced `IssueSnapshot`; mutating a previously-returned `IssueSnapshotCollection.issues` array (or a snapshot's `labels`/`assignees`) does not affect a subsequent read from the service/provider.

---

## Phase 6: Polish & Spec Kit Housekeeping

- [X] T022 [P] Update `.specify/feature.json` to point at `specs/062-github-issue-read-synchronization-foundation` and update the `<!-- SPECKIT START/END -->` pointer block in `AGENTS.md` to reference this Spec's `plan.md`.
- [X] T023a Run `npx vitest run` (full suite) and `npx tsc --noEmit` as focused validation during implementation and after each review fix cycle.
- [ ] T023b Run the full validation gate (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`, plus `git diff --check` against the merge base) exactly once, after Codex review reaches Approved with 0 open blocking findings on the exact commit intended as the final HEAD.

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)**: No dependencies. Blocks every other phase.
- **Phase 2 (US1, P1 — MVP)**: Depends on Phase 1. Delivers the entire player-visible outcome plus the controller/view wiring every later phase builds on.
- **Phase 3 (US2, P1)**: Depends on T005 (the local provider must exist) and T012 (the view lines must already exist to test their unavailable-case rendering).
- **Phase 4 (US3, P1)**: Depends on T010, T011 (the counter and wiring must exist to test against).
- **Phase 5 (Immutability)**: Depends on T004 (provider normalization must exist to test against).
- **Phase 6 (Polish)**: Depends on all prior phases being complete.

## Implementation Strategy

Single implementer (Claude CLI), sequential: Phase 1 → Phase 2 (MVP) → Phase 3 → Phase 4 → Phase 5 → Phase 6. `[P]` tasks touch disjoint test files and may be done back-to-back without reordering concerns.
