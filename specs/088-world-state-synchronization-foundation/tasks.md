# Tasks: Spec 088

**Input**: Design documents from `/specs/088-world-state-synchronization-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 088 artifact state.
- [X] T002 Create Spec 088 Spec Kit artifacts for world state synchronization foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Inspect Synchronized World State (Priority: P1)

**Goal**: Operators and future features can inspect copied, read-only world state derived from the active city scene.

**Independent Test**: Create, repeat, and update world-state synchronizations and verify copied snapshots, changed flags, and timestamps.

- [X] T004 [US1] Add world state snapshot types in `src/features/city-view/scene/world-state/WorldStateTypes.ts`.
- [X] T005 [US1] Add snapshot creation and semantic synchronization helpers in `src/features/city-view/scene/world-state/WorldStateSynchronizer.ts`.
- [X] T006 [US1] Wire city scene creation and Founder movement updates into `src/features/city-view/scene/CityWorldScene.ts`.
- [X] T007 [US1] Add focused regression coverage in `src/features/city-view/scene/world-state/WorldStateSynchronizer.test.ts`.

## Phase 4: Validation and Handoff

- [ ] T008 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T009 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T010 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005.
- T005 before T006.
- T007 after T004-T006.
- T008-T010 remain intentionally unchecked in this runtime.

## Implementation Strategy

Complete the single P1 foundation first: create snapshot types, implement synchronization semantics, wire city scene updates, and cover the behavior without running validation in this runtime.
