# Tasks: Level 2 Reception Desk Runtime Spawn

**Input**: Design documents from `/specs/109-level-2-reception-desk-runtime-spawn/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes interaction state and visual marker behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 109.

- [x] T001 Point Spec Kit active feature metadata at specs/109-level-2-reception-desk-runtime-spawn in .specify/feature.json
- [x] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/109-level-2-reception-desk-runtime-spawn/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish a focused derivation seam for the level-gated reception desk.

- [x] T003 [P] Add reception desk derivation coverage in src/features/city-view/scene/office/ReceptionDeskRuntimeSpawnService.test.ts
- [x] T004 Add ReceptionDeskRuntimeSpawnService in src/features/city-view/scene/office/ReceptionDeskRuntimeSpawnService.ts

---

## Phase 3: User Story 1 - Spawn Reception Runtime Desk At Level 2 (Priority: P1) MVP

**Goal**: Level 2 progression registers one reception desk interactable.

**Independent Test**: Resolve level 1 and level 2 progression snapshots and verify only level 2 produces an enabled reception desk.

### Implementation for User Story 1

- [x] T005 [US1] Register or remove the reception desk during office progression refresh in src/features/city-view/scene/office/CompanyOfficeScene.ts

**Checkpoint**: User Story 1 should be independently functional and testable.

---

## Phase 4: User Story 2 - Open Runtime Workspace From Reception Desk (Priority: P2)

**Goal**: The reception desk opens the existing workspace/runtime surface through the current interaction flow.

**Independent Test**: Consume a reception desk interaction and verify the workspace-opening action is routed like the existing computer action.

### Implementation for User Story 2

- [x] T006 [US2] Route open_workspace interactions to the existing project portal in src/features/city-view/scene/office/CompanyOfficeScene.ts

**Checkpoint**: User Stories 1 and 2 should both work independently.

---

## Phase 5: User Story 3 - Keep Reception Desk Visual State In Sync (Priority: P3)

**Goal**: Enabled reception desk interactables render a marker and stale markers are removed.

**Independent Test**: Refresh markers with and without an enabled desk object and verify marker lifecycle behavior.

### Tests for User Story 3

- [x] T007 [P] [US3] Add desk marker refresh coverage in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

### Implementation for User Story 3

- [x] T008 [US3] Render enabled desk interactables in src/features/city-view/scene/office/OfficeVisualLayer.ts

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [x] T009 Mark all completed tasks in specs/109-level-2-reception-desk-runtime-spawn/tasks.md

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

- T003 and T007 are in separate test files and can be prepared independently.

## Implementation Strategy

### MVP First

1. Restore feature 109 Spec Kit artifacts.
2. Add reception desk derivation service and coverage.
3. Register the desk from current progression state.
4. Stop for focused validation outside this runtime.

### Incremental Delivery

1. Add level-gated desk derivation.
2. Wire office scene registration/removal and workspace routing.
3. Add visual marker rendering for desk interactables.
4. Run focused and full ADOS validation outside this runtime.
