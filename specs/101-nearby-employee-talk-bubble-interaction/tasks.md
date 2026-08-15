# Tasks: Nearby Employee Talk Bubble Interaction

**Input**: Design documents from `/specs/101-nearby-employee-talk-bubble-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest tests are included because this feature touches action handling and transient UI lifecycle.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature surfaces and documentation are present.

- [X] T001 Verify the active Spec Kit pointer references `specs/101-nearby-employee-talk-bubble-interaction` in `.specify/feature.json`
- [X] T002 Update the managed Spec Kit plan pointer in `AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the reusable speech bubble display surface before wiring gameplay behavior.

- [X] T003 [P] Create `EmployeeConversationBubbleOverlay` in `src/features/city-view/scene/office/conversations/EmployeeConversationBubbleOverlay.ts`
- [X] T004 [P] Add overlay lifecycle tests in `src/features/city-view/scene/office/conversations/EmployeeConversationBubbleOverlay.test.ts`

**Checkpoint**: Bubble display can show, replace, auto-hide, and destroy independently.

---

## Phase 3: User Story 1 - Talk To Nearby Employee (Priority: P1) MVP

**Goal**: Pressing the existing action control near an employee shows a deterministic speech bubble.

**Independent Test**: Move near a visible employee, press Space, and confirm a speech bubble appears while movement remains available.

- [X] T005 [US1] Track the current nearby Employee Insight target in `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T006 [US1] Wire action input to request `getEmployeeConversationViewModel()` for the current nearby employee in `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T007 [US1] Add focused scene/controller integration coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.nearby-talk-bubble.test.ts`

**Checkpoint**: User Story 1 works independently.

---

## Phase 4: User Story 2 - Keep Conversation Display Bounded (Priority: P1)

**Goal**: Speech bubbles replace stale content and hide automatically.

**Independent Test**: Trigger a bubble, trigger another valid employee bubble, and confirm the latest content displays then hides after its duration.

- [X] T008 [US2] Ensure scene update calls the bubble overlay lifecycle in `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T009 [US2] Ensure blocking portal state hides active employee bubbles in `src/features/city-view/scene/office/CompanyOfficeScene.ts`

**Checkpoint**: User Story 2 works independently.

---

## Phase 5: User Story 3 - Respect Existing Office Interactions (Priority: P2)

**Goal**: Exit, computer, portal, insight, knowledge, movement, and NPC rendering behavior remain unchanged.

**Independent Test**: Press Space near exit/computer and confirm existing behavior takes precedence over employee talk.

- [X] T010 [US3] Preserve existing exit and interactive-object action precedence in `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T011 [US3] Hide and destroy bubble overlay during scene shutdown in `src/features/city-view/scene/office/CompanyOfficeScene.ts`

**Checkpoint**: Existing office interactions keep their established priority.

---

## Final Phase: Polish & Cross-Cutting Concerns

- [X] T012 Review implementation against `specs/101-nearby-employee-talk-bubble-interaction/contracts/nearby-employee-talk-bubble.md`
- [X] T013 Document ADOS validation commands as not run from this runtime in final handoff

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion.
- **US1 (Phase 3)**: Depends on Foundational completion.
- **US2 (Phase 4)**: Depends on US1 overlay wiring.
- **US3 (Phase 5)**: Depends on US1 action precedence.
- **Polish**: Depends on desired user stories being complete.

## Parallel Opportunities

- T003 and T004 are different files and can be prepared together, but T004 must be validated against the final overlay behavior.

## Implementation Strategy

1. Complete setup/pointer tasks.
2. Add and test the speech bubble overlay.
3. Wire scene action behavior through the existing controller conversation view model.
4. Add lifecycle hiding for expiry, replacement, blocking overlays, and shutdown.
5. Confirm tasks are marked complete and leave ADOS validation to the required outside runtime.
