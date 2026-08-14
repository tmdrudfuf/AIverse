# Tasks: Spec 094 - Progression Reward Presentation

**Input**: Design documents from `/specs/094-progression-reward-presentation/`

## Phase 1: Setup

- [X] T001 Create Spec 094 Spec Kit artifacts for progression reward presentation.

## Phase 2: Foundational

- [X] T002 Confirm existing world-state reward types and city synchronization expose copied rewards in `src/features/city-view/scene/world-state/WorldStateTypes.ts` and `src/features/city-view/scene/CityWorldScene.ts`.

## Phase 3: User Story 1 - See Latest Progression Rewards In City (Priority: P1)

**Goal**: Render copied progression rewards as a compact city HUD presentation.

**Independent Test**: Render one reward and confirm the row displays level, stage, capacity, floor, and unlocked-zone information.

- [X] T003 [US1] Add reward presentation row formatting helpers and Phaser panel in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.ts`.
- [X] T004 [US1] Add focused reward presentation formatting coverage in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.test.ts`.
- [X] T005 [US1] Wire reward presentation creation, update, and destruction in `src/features/city-view/scene/CityWorldScene.ts`.

## Phase 4: User Story 2 - Hide Empty Reward State (Priority: P2)

**Goal**: Hide the reward presentation when snapshots contain no rewards.

**Independent Test**: Render no rewards and confirm no display rows are returned and stale rows are cleared by panel update behavior.

- [X] T006 [US2] Ensure reward presentation update hides and clears empty reward snapshots in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.ts`.
- [X] T007 [US2] Cover empty reward formatting in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.test.ts`.

## Phase 5: User Story 3 - Keep Reward Rows Bounded And Immutable (Priority: P3)

**Goal**: Keep reward presentation rows bounded, ordered, and independent from source reward mutation.

**Independent Test**: Format multiple rewards and confirm latest three rows are returned in order without mutating source rewards.

- [X] T008 [US3] Bound reward presentation rows to the latest three rewards in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.ts`.
- [X] T009 [US3] Cover bounded ordering and source immutability in `src/features/city-view/scene/world-state/ProgressionRewardPresentationPanel.test.ts`.

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T010 Update Spec Kit pointers to reference `specs/094-progression-reward-presentation/plan.md` in `AGENTS.md` and `.specify/feature.json`.
- [X] T011 Review working-tree diff for scope without running validation commands.

## Dependencies

- Phase 1 and Phase 2 complete before user story implementation.
- US1 is the MVP and unlocks visible reward presentation.
- US2 and US3 depend on the reward presentation helper introduced in US1.

## Parallel Execution Examples

- T004 can be drafted after T003 helper shape is known.
- T007 and T009 can extend the same test file after T004 exists.

## Implementation Strategy

Implement the reward presentation helper and panel first, then city scene wiring, then empty/bounded/immutability coverage. Do not run validation or review from this runtime.
