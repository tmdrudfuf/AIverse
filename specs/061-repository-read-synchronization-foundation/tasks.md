---
description: "Task list for Spec 061 — Repository Read Synchronization Foundation"
---

# Tasks: Repository Read Synchronization Foundation

**Input**: Design documents from `specs/061-repository-read-synchronization-foundation/` (spec.md, plan.md)

**Tests**: Included — the Spec explicitly requires coverage for the concurrency guard (stale/out-of-order protection), error normalization, provider mapping, and both view rendering cases.

**Organization**: Grouped by user story per `plan.md`'s Project Structure. One new domain module (`repository-sync/`) plus targeted modifications to existing Spec 059/060 controller/view/registry files. No changes to the GitHub read pipeline or the GitHub-dashboard-signal pipeline.

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The snapshot model, lifecycle, and provider contract must exist before any provider, service, controller, or view work can proceed.

- [X] T001 Create `src/features/city-view/scene/office/repository-sync/RepositorySyncTypes.ts`: `RepositorySyncStatus`, `RepositorySyncSnapshot`, and factory functions `createNotStartedRepositorySyncSnapshot(identity)`, `createSyncingRepositorySyncSnapshot(identity, previous?)`, `createUnavailableRepositorySyncSnapshot(identity, errorSummary)` (per spec.md's Key Entities / plan.md's field table).
- [X] T002 Create `src/features/city-view/scene/office/repository-sync/RepositorySyncProvider.ts`: the read-only `RepositorySyncProvider` contract (`providerId`, `readRepositorySnapshot(identity, context)`), no mutation method.
- [X] T003 [P] Add `src/features/city-view/scene/office/repository-sync/RepositorySyncTypes.test.ts`: each factory function produces the expected shape, including carry-forward of `previous.lastSuccessfulSyncAt` in `createSyncingRepositorySyncSnapshot`.

**Checkpoint**: Types compile; no other file has been touched yet.

---

## Phase 2: User Story 1 - See Daily Proof's verified repository state (P1) 🎯 MVP

**Goal**: Opening Daily Proof's project dashboard shows a `[REPO-SYNC]` row that reflects a real, verified GitHub read.

**Independent Test**: Open Daily Proof's project dashboard with a fresh `createProjectPortalState()`, let the (mocked) GitHub read resolve, and confirm the lower panel transitions from `Syncing...` to `Succeeded · ...`.

### Implementation for User Story 1

- [X] T004 [US1] Create `src/features/city-view/scene/office/repository-sync/GitHubRepositorySyncProvider.ts`: wraps the existing `GitHubRepositoryService` (constructor-injected, reused not duplicated); maps `GitHubRepositorySummary` -> `RepositorySyncSnapshot` per plan.md's mapping table (`connected`->Succeeded, `loading`->Syncing, `not_connected`->Unavailable, `error`->Failed); falls back to `identity.owner`/`.name`/`.defaultBranch` when the summary lacks them (depends on T001, T002).
- [X] T005 [US1] Create `src/features/city-view/scene/office/repository-sync/LocalRepositorySyncProvider.ts`: always returns an honest `Unavailable` snapshot via `createUnavailableRepositorySyncSnapshot`, reason: local repository verification is not available in this client-side runtime (depends on T001, T002).
- [X] T006 [US1] Create `src/features/city-view/scene/office/repository-sync/RepositorySyncService.ts`: constructed with a `providerId -> RepositorySyncProvider` map; `readRepositorySnapshot(identity, context, previous?)` dispatches on `identity.provider`, falls back to an `Unavailable` "no provider registered" snapshot for an unrecognized provider string, catches any thrown error into a generic `Unavailable` snapshot, and stamps `lastSuccessfulSyncAt` with `new Date().toISOString()` only when the result's `syncStatus === "Succeeded"` (otherwise carries `previous?.lastSuccessfulSyncAt` forward) (depends on T001, T002, T004, T005).
- [X] T007 [US1] Create `src/features/city-view/scene/office/repository-sync/RepositorySyncView.ts`: pure function `createRepositorySyncDisplayRows(identity, snapshot)` returning a one-line display string per `syncStatus` (`NotStarted`/`Syncing`/`Succeeded · branch · short-sha`/`Failed: reason`/`Unavailable: reason`), returning `[]` when `identity` is absent (depends on T001).
- [X] T008 [US1] In `OfficeProjectPortalTypes.ts`, add `repositorySyncSnapshots: Record<string, RepositorySyncSnapshot>` to `ProjectPortalState` (depends on T001).
- [X] T009 [US1] In `OfficeProjectPortalRegistry.ts`, initialize `repositorySyncSnapshots: {}` in `createProjectPortalState()` (depends on T008).
- [X] T010 [US1] In `OfficeProjectPortalController.ts`: add `repositorySyncService: RepositorySyncService` field (constructed with `{ github: new GitHubRepositorySyncProvider(this.repositoryService), local: new LocalRepositorySyncProvider() }`), a private `repositorySyncRequestVersion` counter, `private async syncRepositorySnapshot(projectId)`, and `private shouldApplyRepositorySyncSnapshot(projectId, requestVersion)` (mirroring `shouldApplyProjectDashboardRepositorySummary`'s structure but checking the new counter) (depends on T006, T008).
- [X] T011 [US1] In `OfficeProjectPortalController.ts`'s `openProjectDashboard`, add `void this.syncRepositorySnapshot(projectId);` alongside the existing `void this.refreshProjectDashboardRepositorySummary(projectId);` call (depends on T010).
- [X] T012 [US1] In `OfficeProjectPortalView.ts`'s `renderProjectDashboard`, resolve the dashboard project's `repositoryIdentity` and `repositorySyncSnapshots` entry, call `createRepositorySyncDisplayRows`, and splice a `[REPO-SYNC]` row into `createProjectDashboardLowerRows`'s returned array when non-empty (depends on T007, T008).
- [X] T013 [P] [US1] Add `GitHubRepositorySyncProvider.test.ts`: covers all four `connectionStatus` mappings plus identity-fallback for missing owner/name/defaultBranch.
- [X] T014 [P] [US1] Add `RepositorySyncService.test.ts`: dispatch to the correct provider, unrecognized-provider fallback, thrown-error catch-all, `lastSuccessfulSyncAt` stamped on Succeeded and carried forward otherwise.
- [X] T015 [P] [US1] Add `RepositorySyncView.test.ts`: one display line per `syncStatus`, empty array when identity is absent.
- [X] T016 [US1] Update `OfficeProjectPortalView.test.ts`: opening Daily Proof's project dashboard with a resolved `Succeeded` snapshot in state renders the `[REPO-SYNC] Succeeded · ...` row within the existing dynamically-stacked lower panel (no fixed-Y assertion).

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 3: User Story 2 - Repository sync degrades safely when no verified read is possible (P2)

**Goal**: Portfolio's and AI Lab's project dashboards show an honest `Unavailable` state, never fabricated success data.

### Implementation for User Story 2

- [X] T017 [P] [US2] Add `LocalRepositorySyncProvider.test.ts`: always resolves `Unavailable` with a non-empty, display-safe `errorSummary`, regardless of the identity passed in.
- [X] T018 [US2] Update `OfficeProjectPortalView.test.ts`: opening Portfolio's project dashboard with an `Unavailable` snapshot in state renders `[REPO-SYNC] Unavailable: ...`, with no `Succeeded` substring anywhere in the rendered text.

**Checkpoint**: Both populated (GitHub) and unavailable (local) states are covered.

---

## Phase 4: User Story 3 - Stale/out-of-order protection (P1)

**Goal**: Prove a slower, older sync request can never overwrite a newer, already-applied result, and that navigating away discards an in-flight result.

### Implementation for User Story 3

- [X] T019 [US3] Create `OfficeProjectPortalController.repository-sync.test.ts`: (a) two overlapping `syncRepositorySnapshot` calls for the same project where the first resolves after the second — assert the stored snapshot remains the second's result; (b) escaping the project dashboard before a sync resolves — assert the eventual result is never applied to `state.repositorySyncSnapshots`; (c) confirm `syncRepositorySnapshot` and `refreshProjectDashboardRepositorySummary` (fired together from `openProjectDashboard`) do not invalidate each other (depends on T010, T011).

**Checkpoint**: All three user stories independently verified.

---

## Phase 5: Polish & Spec Kit Housekeeping

- [X] T020 [P] Update `.specify/feature.json` to point at `specs/061-repository-read-synchronization-foundation` and update the `<!-- SPECKIT START/END -->` pointer block in `AGENTS.md` to reference this Spec's `plan.md`.
- [X] T021a Run `npx vitest run` (full suite) and `npx tsc --noEmit` as focused validation during implementation and after each review fix cycle.
- [ ] T021b Run the full validation gate (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`, plus `git diff --check` against the merge base) exactly once, after Codex review reaches Approved with 0 open blocking findings on the exact commit intended as the final HEAD.

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)**: No dependencies. Blocks every other phase.
- **Phase 2 (US1, P1 — MVP)**: Depends on Phase 1. Delivers the entire player-visible outcome plus the controller/view wiring every later phase builds on.
- **Phase 3 (US2, P2)**: Depends on T005 (the local provider must exist) and T012 (the view lines must already exist to test their unavailable-case rendering).
- **Phase 4 (US3, P1)**: Depends on T010, T011 (the counter and wiring must exist to test against).
- **Phase 5 (Polish)**: Depends on all prior phases being complete.

## Implementation Strategy

Single implementer (Claude CLI), sequential: Phase 1 → Phase 2 (MVP) → Phase 3 → Phase 4 → Phase 5. `[P]` tasks touch disjoint test files and may be done back-to-back without reordering concerns.
