# Tasks: Operator-Driven Office Navigation Foundation

**Input**: Design documents from `specs/131-operator-driven-office-navigation-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes operator-facing navigation and click behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing navigation and scene structure can host the feature without new dependencies.

- [X] T001 Verify existing navigation, city scene, building interaction, office scene, and office interaction files named in specs/131-operator-driven-office-navigation-foundation/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Extend shared navigation intent before city and office stories consume it.

- [X] T002 Add pointer pan fields and pointer source to navigation intent types in src/features/city-view/scene/navigation/navigationTypes.ts
- [X] T003 Update neutral navigation intent defaults in src/features/city-view/scene/navigation/NavigationState.ts
- [X] T004 Implement pointer drag event collection and enable/disable control in src/features/city-view/scene/navigation/NavigationInputController.ts
- [X] T005 Implement camera pointer pan application and focus clearing in src/features/city-view/scene/navigation/CameraController.ts
- [X] T006 [P] Add focused pointer intent tests in src/features/city-view/scene/navigation/NavigationInputController.test.ts
- [X] T007 [P] Add focused camera pan tests in src/features/city-view/scene/navigation/CameraController.test.ts

**Checkpoint**: Shared pointer navigation foundation is ready for city and office scenes.

---

## Phase 3: User Story 1 - Drag to Navigate the Office and City (Priority: P1) MVP

**Goal**: Operators can pan city and office cameras with pointer drag.

**Independent Test**: Drag in either scene and verify camera pan remains bounded and independent of Founder movement.

### Implementation for User Story 1

- [X] T008 [US1] Integrate pointer pan intent into city scene camera focus behavior in src/features/city-view/scene/CityWorldScene.ts
- [X] T009 [US1] Integrate pointer pan intent into office scene camera focus behavior in src/features/city-view/scene/office/CompanyOfficeScene.ts
- [X] T010 [US1] Update visible control hint text for pointer-driven navigation in src/features/city-view/CityView.tsx

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Click to Enter Buildings and Open Work Areas (Priority: P2)

**Goal**: Operators can directly click active buildings and workspace-capable office objects.

**Independent Test**: Click an active building to enter the office, then click a workspace-capable office object to open the portal.

### Tests for User Story 2

- [X] T011 [P] [US2] Add direct building click tests in src/features/city-view/scene/buildings/BuildingInteractionController.test.ts
- [X] T012 [P] [US2] Add direct office object click tests in src/features/city-view/scene/office/OfficeInteractionController.test.ts

### Implementation for User Story 2

- [X] T013 [US2] Add direct building click queuing in src/features/city-view/scene/buildings/BuildingInteractionController.ts
- [X] T014 [US2] Consume direct building clicks for office entry in src/features/city-view/scene/CityWorldScene.ts
- [X] T015 [US2] Add direct office object click queuing and consumption in src/features/city-view/scene/office/OfficeInteractionController.ts
- [X] T016 [US2] Consume direct workspace-capable office object clicks in src/features/city-view/scene/office/CompanyOfficeScene.ts

**Checkpoint**: User Story 2 is functional and independently testable.

---

## Phase 5: User Story 3 - Avoid Accidental Click Actions During Drag or Overlay Use (Priority: P3)

**Goal**: Drag gestures and blocking overlays do not trigger stale click or pan actions.

**Independent Test**: Drag across clickable targets and interact while the portal is open; verify no queued action is consumed.

### Tests for User Story 3

- [X] T017 [P] [US3] Add drag suppression coverage for building clicks in src/features/city-view/scene/buildings/BuildingInteractionController.test.ts
- [X] T018 [P] [US3] Add drag and disabled-pointer suppression coverage for office clicks in src/features/city-view/scene/office/OfficeInteractionController.test.ts
- [X] T019 [P] [US3] Add disabled pointer navigation coverage in src/features/city-view/scene/navigation/NavigationInputController.test.ts

### Implementation for User Story 3

- [X] T020 [US3] Suppress building direct click queuing for pointer drags in src/features/city-view/scene/buildings/BuildingInteractionController.ts
- [X] T021 [US3] Suppress office direct click queuing for pointer drags and disabled pointer interaction in src/features/city-view/scene/office/OfficeInteractionController.ts
- [X] T022 [US3] Disable pointer navigation and office pointer interaction while the portal overlay is open in src/features/city-view/scene/office/CompanyOfficeScene.ts

**Checkpoint**: User Story 3 is functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and traceability.

- [X] T023 Run focused validation command from specs/131-operator-driven-office-navigation-foundation/quickstart.md
- [X] T024 Run git diff --check
- [X] T025 Confirm full ADOS validation is deferred to ADOS per handoff policy in specs/131-operator-driven-office-navigation-foundation/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on setup completion and blocks all user stories.
- **User Story 1 (Phase 3)**: Depends on foundational pointer navigation.
- **User Story 2 (Phase 4)**: Depends on foundational input lifecycle and can be validated after US1.
- **User Story 3 (Phase 5)**: Depends on direct click paths from US2 and overlay state from the office scene.
- **Polish (Phase 6)**: Depends on all user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Requires shared pointer pan intent.
- **User Story 2 (P2)**: Uses existing scene transition and office portal behavior; no persistence dependency.
- **User Story 3 (P3)**: Builds on the click queuing behavior from US2.

### Parallel Opportunities

- T006 and T007 can run in parallel after T002-T005.
- T011 and T012 can run in parallel.
- T017, T018, and T019 can run in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete shared pointer navigation intent and camera panning.
2. Wire city and office scenes to preserve Founder focus only for keyboard movement.
3. Validate pointer panning independently.

### Incremental Delivery

1. Deliver pointer panning.
2. Add direct building and office object clicks.
3. Add drag and overlay suppression.
4. Run focused validation and leave full ADOS validation to ADOS.
