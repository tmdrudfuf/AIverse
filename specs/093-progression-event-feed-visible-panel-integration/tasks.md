# Tasks: Spec 093

**Input**: Design documents from `/specs/093-progression-event-feed-visible-panel-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 093 artifact state.
- [X] T002 Create Spec 093 Spec Kit artifacts for progression event feed visible panel integration.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - See Latest Progression Events In City (Priority: P1)

**Goal**: Display progression feed event summaries in the city scene.

**Independent Test**: Format a snapshot with one event and confirm row text includes reached level, stage, zones, and milestones.

- [X] T004 [US1] Implement feed row formatting and Phaser panel rendering in `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.ts`.
- [X] T005 [US1] Add focused feed panel formatting coverage in `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.test.ts`.
- [X] T006 [US1] Wire progression feed panel creation and update into `src/features/city-view/scene/CityWorldScene.ts`.

## Phase 4: User Story 2 - Hide Empty Feed State (Priority: P2)

**Goal**: Keep the panel hidden when no progression feed events exist.

**Independent Test**: Format an empty feed and confirm no display rows are produced.

- [X] T007 [US2] Add empty-feed hiding behavior to `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.ts`.
- [X] T008 [US2] Cover empty-feed row behavior in `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.test.ts`.

## Phase 5: User Story 3 - Keep Panel Current Without Mutating State (Priority: P3)

**Goal**: Keep visible rows bounded, ordered, and isolated from source feed state.

**Independent Test**: Format more than three events, confirm the latest three remain in feed order, mutate returned rows, and confirm source feed events are unchanged.

- [X] T009 [US3] Bound visible feed rows and summarize long zone lists in `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.ts`.
- [X] T010 [US3] Cover bounded rows and source isolation in `src/features/city-view/scene/world-state/ProgressionEventFeedPanel.test.ts`.

## Phase 6: Validation and Handoff

- [ ] T011 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T012 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T013 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005-T006.
- T007 after T004.
- T009 after T004.
- T011-T013 remain intentionally unchecked in this runtime.

## Implementation Strategy

Implement pure row formatting first, add the Phaser panel shell, wire it into the city scene, then mark implementation tasks complete. Do not run validation or review from this runtime.
