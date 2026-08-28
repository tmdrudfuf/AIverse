# Tasks: Project Company Office Interior Foundation

**Input**: Design documents from `specs/132-project-company-office-interior-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature adds new office layout metadata and rendering behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing office visual and configuration surfaces can host static interior foundation data.

- [X] T001 Verify existing office definition, visual layer, and tests in src/features/city-view/scene/office/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add typed interior metadata before rendering consumes it.

- [X] T002 Add office interior foundation types in src/features/city-view/scene/office/officeTypes.ts
- [X] T003 Add defensive interior foundation helpers in src/features/city-view/scene/office/OfficeInteriorFoundation.ts
- [X] T004 [P] Add focused interior foundation tests in src/features/city-view/scene/office/OfficeInteriorFoundation.test.ts

**Checkpoint**: Office interior foundation data can be defined and read safely.

---

## Phase 3: User Story 1 - Recognize the Company Office (Priority: P1) MVP

**Goal**: Operators see named company office zones when entering Daily Proof.

**Independent Test**: Render the visual layer and verify it creates foundation zone markers from office metadata.

### Implementation for User Story 1

- [X] T005 [US1] Define Daily Proof interior foundation zones in src/features/city-view/scene/office/officeConfig.ts
- [X] T006 [US1] Render interior foundation zone markers in src/features/city-view/scene/office/OfficeVisualLayer.ts
- [X] T007 [US1] Update visual layer tests for foundation markers in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Understand Work Area Purpose (Priority: P2)

**Goal**: Operators can distinguish reception, founder desk, workspace, and employee desk areas.

**Independent Test**: Verify enabled Daily Proof zone roles and labels are exposed in a stable order.

### Implementation for User Story 2

- [X] T008 [US2] Ensure Daily Proof foundation exposes reception, founder-desk, workspace, and employee-desk roles in src/features/city-view/scene/office/officeConfig.ts
- [X] T009 [US2] Add role and label assertions in src/features/city-view/scene/office/OfficeInteriorFoundation.test.ts

**Checkpoint**: User Story 2 is functional and independently testable.

---

## Phase 5: User Story 3 - Preserve Existing Office Interaction (Priority: P3)

**Goal**: Interior visuals do not interfere with existing interactive object marker refresh or lifecycle.

**Independent Test**: Refresh interactive objects and verify foundation markers remain while interactive markers are replaced.

### Implementation for User Story 3

- [X] T010 [US3] Keep interior foundation markers separate from interactive object refresh in src/features/city-view/scene/office/OfficeVisualLayer.ts
- [X] T011 [US3] Add visual lifecycle assertions in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

**Checkpoint**: User Story 3 is functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and traceability.

- [X] T012 Run focused validation command from specs/132-project-company-office-interior-foundation/quickstart.md
- [X] T013 Run git diff --check
- [X] T014 Confirm full ADOS validation is deferred to ADOS per handoff policy in specs/132-project-company-office-interior-foundation/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Blocks all rendering stories.
- **User Story 1 (Phase 3)**: Depends on interior foundation metadata.
- **User Story 2 (Phase 4)**: Depends on Daily Proof foundation zones.
- **User Story 3 (Phase 5)**: Depends on visual rendering from US1.
- **Polish (Phase 6)**: Depends on all user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Requires typed foundation metadata.
- **User Story 2 (P2)**: Builds on the same Daily Proof metadata.
- **User Story 3 (P3)**: Builds on the visual layer lifecycle.

### Parallel Opportunities

- T004 can run in parallel after T002-T003.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add typed foundation metadata and safe readers.
2. Define Daily Proof zones.
3. Render the zones in the office visual layer.

### Incremental Delivery

1. Deliver readable interior zones.
2. Assert zone roles and labels.
3. Verify visual lifecycle isolation.
