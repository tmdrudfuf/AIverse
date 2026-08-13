# Tasks: Spec 091

**Input**: Design documents from `/specs/091-company-progression-reward-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 091 artifact state.
- [X] T002 Create Spec 091 Spec Kit artifacts for company progression reward foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Represent Progression Rewards (Priority: P1)

**Goal**: Convert company progression world effects into copied reward records.

**Independent Test**: Convert one and multiple world effects and confirm ordered copied reward records.

- [X] T004 [US1] Add reward types and copy helpers in `src/features/city-view/scene/world-state/WorldStateTypes.ts`.
- [X] T005 [US1] Implement progression-to-reward conversion in `src/features/city-view/scene/world-state/CompanyProgressionRewardService.ts`.
- [X] T006 [US1] Add focused reward conversion coverage in `src/features/city-view/scene/world-state/CompanyProgressionRewardService.test.ts`.

## Phase 4: User Story 2 - Include Rewards in City World State (Priority: P2)

**Goal**: Store copied rewards in city world-state snapshots and include them in semantic comparison.

**Independent Test**: Synchronize with rewards, mutate returned snapshots, and confirm changed/unchanged semantics.

- [X] T007 [US2] Add optional reward input handling in `src/features/city-view/scene/world-state/WorldStateSynchronizer.ts`.
- [X] T008 [US2] Extend world-state synchronizer coverage for reward copying and change detection in `src/features/city-view/scene/world-state/WorldStateSynchronizer.test.ts`.

## Phase 5: User Story 3 - Carry Office Rewards Back to City (Priority: P3)

**Goal**: Pass latest company progression rewards from office exit payloads into city world-state synchronization.

**Independent Test**: Confirm return payloads copy rewards and city synchronization consumes return payload rewards.

- [X] T009 [US3] Add optional rewards to `CityReturnPayload` and copy them in `src/features/city-view/scene/office/officeTypes.ts`, `src/features/city-view/scene/office/OfficeExitController.ts`, and `src/features/city-view/scene/office/OfficeExitController.test.ts`.
- [X] T010 [US3] Wire office exit reward conversion in `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
- [X] T011 [US3] Pass return payload rewards into city synchronization in `src/features/city-view/scene/CityWorldScene.ts`.

## Phase 6: Validation and Handoff

- [ ] T012 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T013 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T014 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005.
- T006 after T004-T005.
- T007 before T008.
- T009 before T010.
- T010 before T011.
- T012-T014 remain intentionally unchecked in this runtime.

## Implementation Strategy

Implement the reward shape first, then synchronizer behavior, then office-to-city handoff wiring. Do not run validation or review from this runtime.
