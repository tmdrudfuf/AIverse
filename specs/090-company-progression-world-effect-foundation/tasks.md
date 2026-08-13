# Tasks: Spec 090

**Input**: Design documents from `/specs/090-company-progression-world-effect-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 090 artifact state.
- [X] T002 Create Spec 090 Spec Kit artifacts for company progression world effect foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Represent Progression as World Effects (Priority: P1)

**Goal**: Convert company progression triggers into copied world effect records.

**Independent Test**: Convert one and multiple triggers and confirm ordered copied effect records.

- [X] T004 [US1] Add world effect types and copy helpers in `src/features/city-view/scene/world-state/WorldStateTypes.ts`.
- [X] T005 [US1] Implement progression-to-world-effect conversion in `src/features/city-view/scene/world-state/CompanyProgressionWorldEffectService.ts`.
- [X] T006 [US1] Add focused effect conversion coverage in `src/features/city-view/scene/world-state/CompanyProgressionWorldEffectService.test.ts`.

## Phase 4: User Story 2 - Include Effects in City World State (Priority: P2)

**Goal**: Store copied world effects in city world-state snapshots and include them in semantic comparison.

**Independent Test**: Synchronize with effects, mutate returned snapshots, and confirm changed/unchanged semantics.

- [X] T007 [US2] Add optional effect input handling in `src/features/city-view/scene/world-state/WorldStateSynchronizer.ts`.
- [X] T008 [US2] Extend world-state synchronizer coverage for effect copying and change detection in `src/features/city-view/scene/world-state/WorldStateSynchronizer.test.ts`.

## Phase 5: User Story 3 - Carry Office Effects Back to City (Priority: P3)

**Goal**: Pass latest company progression world effects from office exit payloads into city world-state synchronization.

**Independent Test**: Confirm return payloads copy effects and city synchronization consumes return payload effects.

- [X] T009 [US3] Expose copied latest progression triggers from `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [X] T010 [US3] Add optional world effects to `CityReturnPayload` and copy them in `src/features/city-view/scene/office/officeTypes.ts`, `src/features/city-view/scene/office/OfficeExitController.ts`, and `src/features/city-view/scene/office/OfficeExitController.test.ts`.
- [X] T011 [US3] Wire office exit effect conversion in `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
- [X] T012 [US3] Pass return payload effects into city synchronization in `src/features/city-view/scene/CityWorldScene.ts`.

## Phase 6: Validation and Handoff

- [ ] T013 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T014 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T015 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005.
- T006 after T004-T005.
- T007 before T008.
- T009 before T011.
- T010 before T011.
- T011 before T012.
- T013-T015 remain intentionally unchecked in this runtime.

## Implementation Strategy

Implement the world effect shape first, then synchronizer behavior, then office-to-city handoff wiring. Do not run validation or review from this runtime.
