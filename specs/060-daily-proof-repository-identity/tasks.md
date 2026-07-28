---
description: "Task list for Spec 060 — Daily Proof Repository Identity"
---

# Tasks: Daily Proof Repository Identity

**Input**: Design documents from `specs/060-daily-proof-repository-identity/` (spec.md, plan.md)

**Tests**: Included — the Spec explicitly requires coverage for the seed-data shared-constant invariant, clone independence, adapter mapping, and both view rendering cases.

**Organization**: Grouped by user story per `plan.md`'s Project Structure. All changes are modifications to existing Spec 059 files under `src/features/city-view/scene/office/project-registry/` plus `OfficeProjectPortalTypes.ts`/`OfficeProjectPortalView.ts` — no new files, no new directory.

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: The repository identity type must exist before seed data, service, adapter, or view work can proceed.

- [ ] T001 Add `ProjectRegistryRepositoryProvider`, `ProjectRegistryRepositoryConnectionState`, and `ProjectRegistryRepositoryIdentity` to `src/features/city-view/scene/office/project-registry/ProjectRegistryTypes.ts`; add `repositoryIdentity: ProjectRegistryRepositoryIdentity` to `ProjectRegistryEntry` (per spec.md's Key Entities / plan.md's field table).
- [ ] T002 Add optional `repositoryIdentity?: ProjectRegistryRepositoryIdentity` to `ProjectPortalProject` in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`.

**Checkpoint**: Types compile; no other file has been touched yet.

---

## Phase 2: User Story 1 - See Daily Proof's real repository identity (P1) 🎯 MVP

**Goal**: Daily Proof's detail screen shows `Repo: ai-verse/daily-proof (GitHub)` and `Default Branch: main  ·  Status: Configured`.

**Independent Test**: Render Daily Proof's detail screen with a fresh `createProjectPortalState()` and confirm both new lines appear with the correct values.

### Implementation for User Story 1

- [ ] T003 [US1] In `ProjectRegistrySeedData.ts`, add the shared `DAILY_PROOF_REPOSITORY` local constant and populate `daily-proof`'s `repositoryIdentity` (`provider: "github"`, `connectionState: "Configured"`) from it, alongside the existing (unchanged) `remoteRepository` — also built from the same constant (depends on T001).
- [ ] T004 [US1] In `ProjectRegistryService.ts`, extend `cloneEntry()` to deep-clone `repositoryIdentity` (depends on T001).
- [ ] T005 [US1] In `ProjectRegistryAdapters.ts`, extend `toProjectPortalProject()` to map `entry.repositoryIdentity` onto the returned `ProjectPortalProject.repositoryIdentity` (deep clone, not a shared reference) (depends on T001, T002).
- [ ] T006 [US1] In `OfficeProjectPortalView.ts`, add the `Repo:`/`Default Branch: … Status: …` lines to `renderDetail()`, in the existing right column, immediately after the Spec 059 `Repository:`/`Company:` lines (depends on T002, T005).
- [ ] T007 [P] [US1] Update `ProjectRegistryService.test.ts`: mutating a returned entry's `repositoryIdentity` does not affect the registry's internal state.
- [ ] T008 [P] [US1] Update `ProjectRegistryAdapters.test.ts`: `toProjectPortalProject` maps Daily Proof's populated `repositoryIdentity` correctly.
- [ ] T009 [P] [US1] Update `OfficeProjectPortalRegistry.test.ts`: `createProjectPortalState()`'s Daily Proof entry has the exact expected `repositoryIdentity`.
- [ ] T010 [US1] Update `OfficeProjectPortalView.test.ts`: rendering Daily Proof's detail screen produces both new lines with the exact expected text.

**Checkpoint**: User Story 1 fully functional and independently testable.

---

## Phase 3: User Story 2 - Repository identity degrades safely with no known repository (P2)

**Goal**: Portfolio's (and AI Lab's) detail screen shows `Repo: Not yet known (Local)` and `Status: Unknown`, no fabricated data, no `Default Branch:` clause.

### Implementation for User Story 2

- [ ] T011 [US2] In `ProjectRegistrySeedData.ts`, populate `portfolio`'s and `ai-lab`'s `repositoryIdentity` (`provider: "local"`, no owner/name/branch/path, `connectionState: "Unknown"`) (depends on T001).
- [ ] T012 [P] [US2] Update `ProjectRegistryAdapters.test.ts`: `toProjectPortalProject` maps a sparse `repositoryIdentity` (no owner/name/branch) without error.
- [ ] T013 [US2] Update `OfficeProjectPortalView.test.ts`: rendering Portfolio's detail screen produces `Repo: Not yet known (Local)` and `Status: Unknown`, with no `Default Branch:` substring anywhere in the rendered text.

**Checkpoint**: Both populated and sparse states are covered; the model has been proven not to require Daily-Proof-specific handling.

---

## Phase 4: User Story 3 - Repository identity is an extension, not a parallel model (P3)

**Goal**: Prove `repositoryIdentity` and `remoteRepository` cannot silently diverge for Daily Proof.

### Implementation for User Story 3

- [ ] T014 [US3] Add a test (in `ProjectRegistrySeedData`'s coverage, e.g. a small `ProjectRegistrySeedData.test.ts` or a case in `ProjectRegistryAdapters.test.ts`) asserting Daily Proof's `repositoryIdentity.owner`/`.name`/`.url` and `remoteRepository.owner`/`.name`/`.url` are identical — a regression guard for the shared-constant design in T003 (depends on T003).

**Checkpoint**: All three user stories independently verified.

---

## Phase 5: Polish & Spec Kit Housekeeping

- [ ] T015 [P] Update `.specify/feature.json` to point at `specs/060-daily-proof-repository-identity` and update the `<!-- SPECKIT START/END -->` pointer block in `AGENTS.md` to reference this Spec's `plan.md`.
- [ ] T016a Run `npx vitest run` (full suite) and `npx tsc --noEmit` as focused validation during implementation and after each review fix cycle.
- [ ] T016b Run the full validation gate (`npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`, plus `git diff --check` against the merge base) exactly once, after Codex review reaches Approved with 0 open blocking findings on the exact commit intended as the final HEAD.

---

## Dependencies & Execution Order

- **Phase 1 (Foundational)**: No dependencies. Blocks every other phase.
- **Phase 2 (US1, P1 — MVP)**: Depends on Phase 1. Delivers the entire player-visible outcome for Daily Proof.
- **Phase 3 (US2, P2)**: Depends on Phase 1 and T006 (the view lines must already exist to test their sparse-case rendering).
- **Phase 4 (US3, P3)**: Depends on T003 (the shared constant must exist to test against).
- **Phase 5 (Polish)**: Depends on all prior phases being complete.

## Implementation Strategy

Single implementer (Claude CLI), sequential: Phase 1 → Phase 2 (MVP) → Phase 3 → Phase 4 → Phase 5. `[P]` tasks touch disjoint test files and may be done back-to-back without reordering concerns.
