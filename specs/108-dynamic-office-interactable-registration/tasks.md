# Tasks: Dynamic Office Interactable Registration

**Input**: Design documents from `/specs/108-dynamic-office-interactable-registration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes interaction state behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm the feature points at the correct Spec Kit context.

- [X] T001 Point Spec Kit active feature metadata at specs/108-dynamic-office-interactable-registration in .specify/feature.json
- [X] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/108-dynamic-office-interactable-registration/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish registry mutation coverage before user story implementation.

- [X] T003 [P] Add registry mutation coverage in src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.test.ts

---

## Phase 3: User Story 1 - Register Office Interactables Dynamically (Priority: P1) MVP

**Goal**: New interactables registered during an office session participate in active lookup immediately.

**Independent Test**: Register new enabled interactables after construction and verify lookup returns the nearest current object.

### Implementation for User Story 1

- [X] T004 [US1] Add registerObject and replacement behavior in src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.ts

**Checkpoint**: User Story 1 should be independently functional and testable.

---

## Phase 4: User Story 2 - Update And Remove Interactables (Priority: P2)

**Goal**: Disabled, moved, or removed interactables stop producing prompts and actions.

**Independent Test**: Update or remove an active object and verify the next interaction update clears it.

### Tests for User Story 2

- [X] T005 [P] [US2] Add stale active-object coverage in src/features/city-view/scene/office/OfficeInteractionController.test.ts

### Implementation for User Story 2

- [X] T006 [US2] Add updateObject and removeObject behavior in src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.ts
- [X] T007 [US2] Ensure stale active selections clear from current registry state in src/features/city-view/scene/office/OfficeInteractionController.ts

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Keep Visual Markers In Sync (Priority: P3)

**Goal**: Office marker rendering reflects the current enabled interactable set.

**Independent Test**: Refresh marker rendering after object additions/removals and verify stale markers are destroyed.

### Tests for User Story 3

- [X] T008 [P] [US3] Add visual marker refresh coverage in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

### Implementation for User Story 3

- [X] T009 [US3] Add refreshInteractiveObjects marker redraw behavior in src/features/city-view/scene/office/OfficeVisualLayer.ts
- [X] T010 [US3] Retain scene construction compatibility with refreshed registered object lists in src/features/city-view/scene/office/CompanyOfficeScene.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [X] T011 Mark all completed tasks in specs/108-dynamic-office-interactable-registration/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on User Story 1
- **User Story 3 (Phase 5)**: Depends on User Story 2
- **Polish (Phase 6)**: Depends on all user stories

### Parallel Opportunities

- T003, T005, and T008 are in separate test files and can be prepared independently.

## Implementation Strategy

### MVP First

1. Complete setup and registry mutation coverage.
2. Implement dynamic registration and replacement behavior.
3. Stop for focused validation outside this runtime.

### Incremental Delivery

1. Add registration.
2. Add update/removal and stale-selection clearing.
3. Add visual marker refresh.
4. Run focused and full ADOS validation outside this runtime.
