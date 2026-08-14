# Tasks: Office Progression Visual State

**Input**: Design documents from `/specs/095-office-progression-visual-state/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused unit tests requested by the implementation plan.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish active feature pointer and documentation alignment

- [X] T001 Update `.specify/feature.json` to point at `specs/095-office-progression-visual-state`
- [X] T002 Update `AGENTS.md` SPECKIT managed plan pointer to `specs/095-office-progression-visual-state/plan.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared visual-state view-model contract

- [X] T003 [P] Create office progression visual-state formatting tests in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.test.ts`
- [X] T004 Implement office progression visual-state helper and Phaser layer in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - See Office Progression State In The Office (Priority: P1) MVP

**Goal**: Show current level, stage, capacity, floor count, and active-zone count in the office scene.

**Independent Test**: Create a view model from a level-2 progression snapshot and active layout; verify all summary labels.

### Implementation for User Story 1

- [X] T005 [US1] Add summary view-model fields in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.ts`
- [X] T006 [US1] Wire `OfficeProgressionVisualStateLayer` into `src/features/city-view/scene/office/CompanyOfficeScene.ts`

**Checkpoint**: User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Mark Active Office Zones (Priority: P2)

**Goal**: Show bounded in-office labels for unlocked zones from the active layout.

**Independent Test**: Generate markers from a layout with more than six active zones; verify marker count and labels are bounded.

### Implementation for User Story 2

- [X] T007 [US2] Add bounded active-zone marker derivation in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.ts`
- [X] T008 [US2] Render active-zone marker display objects in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.ts`

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: User Story 3 - Keep Office Visual State Stable And Read-Only (Priority: P3)

**Goal**: Ensure the visual state is a read-only projection that hides cleanly when inputs are missing.

**Independent Test**: Mutate returned view-model data and regenerate from the same inputs; verify source snapshots remain unchanged.

### Implementation for User Story 3

- [X] T009 [US3] Add missing-input hidden-state handling in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.ts`
- [X] T010 [US3] Add immutable projection coverage in `src/features/city-view/scene/office/OfficeProgressionVisualStateLayer.test.ts`

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Traceability and handoff readiness

- [X] T011 Mark completed tasks in `specs/095-office-progression-visual-state/tasks.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Stories (Phase 3+)**: Depend on Foundational phase completion
- **Polish**: Depends on selected user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational
- **User Story 2 (P2)**: Can start after Foundational and uses the same layer from US1
- **User Story 3 (P3)**: Can start after Foundational

### Parallel Opportunities

- T003 can be created before T004.
- Story work touches shared files and should be applied sequentially in this single-agent runtime.

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Complete User Story 1 summary rendering.
3. Add User Story 2 markers.
4. Add User Story 3 stability behavior.
5. Leave validation to the external ADOS validation runtime per handoff constraints.
