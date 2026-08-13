# Tasks: Spec 092

**Input**: Design documents from `/specs/092-progression-event-feed-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 092 artifact state.
- [X] T002 Create Spec 092 Spec Kit artifacts for progression event feed foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Represent Progression Feed Events (Priority: P1)

**Goal**: Convert company progression rewards into copied event-feed records.

**Independent Test**: Convert one and multiple rewards and confirm ordered copied feed event records.

- [X] T004 [US1] Add feed event types and copy helpers in `src/features/city-view/scene/world-state/WorldStateTypes.ts`.
- [X] T005 [US1] Implement reward-to-feed-event conversion in `src/features/city-view/scene/world-state/CompanyProgressionEventFeedService.ts`.
- [X] T006 [US1] Add focused feed event conversion coverage in `src/features/city-view/scene/world-state/CompanyProgressionEventFeedService.test.ts`.

## Phase 4: User Story 2 - Include Feed Events in City World State (Priority: P2)

**Goal**: Store copied feed events in city world-state snapshots and include them in semantic comparison.

**Independent Test**: Synchronize with feed events, mutate returned snapshots, and confirm changed/unchanged semantics.

- [X] T007 [US2] Add optional feed event input handling in `src/features/city-view/scene/world-state/WorldStateSynchronizer.ts`.
- [X] T008 [US2] Extend world-state synchronizer coverage for feed event copying and change detection in `src/features/city-view/scene/world-state/WorldStateSynchronizer.test.ts`.

## Phase 5: User Story 3 - Carry Office Feed Events Back to City (Priority: P3)

**Goal**: Pass latest progression feed events from office exit payloads into city world-state synchronization.

**Independent Test**: Confirm return payloads copy feed events and city synchronization consumes return payload feed events.

- [X] T009 [US3] Add optional feed events to `CityReturnPayload` and copy them in `src/features/city-view/scene/office/officeTypes.ts`, `src/features/city-view/scene/office/OfficeExitController.ts`, and `src/features/city-view/scene/office/OfficeExitController.test.ts`.
- [X] T010 [US3] Wire office exit feed event conversion in `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
- [X] T011 [US3] Pass return payload feed events into city synchronization in `src/features/city-view/scene/CityWorldScene.ts`.

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

Implement the feed event shape first, then synchronizer behavior, then office-to-city handoff wiring. Do not run validation or review from this runtime.
