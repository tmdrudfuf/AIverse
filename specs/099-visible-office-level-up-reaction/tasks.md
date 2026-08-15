# Tasks: Visible Office Level-Up Reaction

**Input**: Design documents from `/specs/099-visible-office-level-up-reaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest tests are included because the feature is a user-visible HUD projection with formatting and immutability requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature is represented by Spec Kit artifacts and existing office rendering surfaces.

- [X] T001 Verify Spec Kit artifacts and source targets in `specs/099-visible-office-level-up-reaction/plan.md`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add pure reaction formatting before scene wiring.

- [X] T002 [P] Add focused reaction view-model tests in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.test.ts`.
- [X] T003 Implement `OfficeLevelUpReactionLayer` and pure view-model helper in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.ts`.

**Checkpoint**: Reaction formatting is independently testable without Phaser scene setup.

---

## Phase 3: User Story 1 - See A Level-Up Reaction In The Office (Priority: P1) MVP

**Goal**: Show a visible office reaction when current progression triggers exist.

**Independent Test**: Create a level-up trigger and confirm the reaction view model is visible with reached level, stage, capacity, floor, and unlocked-zone labels.

- [X] T004 [US1] Wire `OfficeLevelUpReactionLayer` into `src/features/city-view/scene/office/CompanyOfficeScene.ts`.
- [X] T005 [US1] Update the office scene refresh path in `src/features/city-view/scene/office/CompanyOfficeScene.ts` to pass `OfficeProjectPortalController.getCompanyProgressionTriggers()` into the reaction layer.

**Checkpoint**: User Story 1 is functional and independently demonstrable.

---

## Phase 4: User Story 2 - Hide Empty Reaction State (Priority: P2)

**Goal**: Hide the reaction and clear labels when no current trigger exists.

**Independent Test**: Build the reaction view model with no triggers and confirm hidden state with empty labels.

- [X] T006 [US2] Cover hidden and cleared reaction state in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.test.ts`.
- [X] T007 [US2] Ensure `OfficeLevelUpReactionLayer.update()` clears all labels and hides display objects for empty triggers in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.ts`.

**Checkpoint**: Empty trigger state leaves no stale reaction visible.

---

## Phase 5: User Story 3 - Keep Reaction Read-Only And Bounded (Priority: P3)

**Goal**: Keep the reaction compact and independent from source trigger data.

**Independent Test**: Mutate a returned view model, regenerate from the same trigger, and confirm source trigger data and regenerated labels are unchanged.

- [X] T008 [US3] Cover newest-trigger selection and view-model immutability in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.test.ts`.
- [X] T009 [US3] Keep reaction label formatting bounded and source-read-only in `src/features/city-view/scene/office/OfficeLevelUpReactionLayer.ts`.

**Checkpoint**: Reaction display remains compact and does not mutate progression triggers.

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and final review readiness.

- [X] T010 Update `AGENTS.md` Spec Kit pointer to `specs/099-visible-office-level-up-reaction/plan.md`.
- [X] T011 Review the implementation against `specs/099-visible-office-level-up-reaction/spec.md` and `specs/099-visible-office-level-up-reaction/plan.md`.

---

## Dependencies & Execution Order

- **Phase 1**: No dependencies.
- **Phase 2**: Depends on Phase 1 and blocks scene wiring.
- **User Story 1**: Depends on Phase 2.
- **User Story 2**: Depends on Phase 2.
- **User Story 3**: Depends on Phase 2.
- **Polish**: Depends on selected user stories.

## Parallel Opportunities

- T002 can be prepared independently from scene wiring.
- User Story 2 and User Story 3 tests can be extended after the foundational helper exists.

## Implementation Strategy

1. Complete setup and foundational reaction view-model work.
2. Deliver MVP by wiring the layer into the office scene.
3. Confirm hidden, bounded, and read-only behavior through focused tests.
4. Leave full ADOS validation for the external validation runtime per handoff policy.
