# Tasks: Project Company Office Visual Environment

**Input**: Design documents from `specs/133-project-company-office-visual-environment/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature adds new office layout metadata and rendering behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing office visual and configuration surfaces can host static visual environment data.

- [X] T001 Verify existing office definition, visual layer, and tests in src/features/city-view/scene/office/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add typed environment metadata before rendering consumes it.

- [X] T002 Add office visual environment types in src/features/city-view/scene/office/officeTypes.ts
- [X] T003 Add defensive visual environment helpers in src/features/city-view/scene/office/OfficeVisualEnvironment.ts
- [X] T004 [P] Add focused visual environment tests in src/features/city-view/scene/office/OfficeVisualEnvironment.test.ts

**Checkpoint**: Office visual environment data can be defined and read safely.

---

## Phase 3: User Story 1 - Read Office Atmosphere (Priority: P1) MVP

**Goal**: Operators see environmental details when entering Daily Proof.

**Independent Test**: Render the visual layer and verify it creates environment markers from office metadata.

### Implementation for User Story 1

- [X] T005 [US1] Define Daily Proof visual environment details in src/features/city-view/scene/office/officeConfig.ts
- [X] T006 [US1] Render visual environment detail markers in src/features/city-view/scene/office/OfficeVisualLayer.ts
- [X] T007 [US1] Update visual layer tests for environment markers in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

**Checkpoint**: User Story 1 is functional and independently testable.

---

## Phase 4: User Story 2 - Distinguish Environment Detail Purpose (Priority: P2)

**Goal**: Operators can distinguish brand, plant, lighting, collaboration, and storage details.

**Independent Test**: Verify enabled Daily Proof detail kinds and labels are exposed in a stable order.

### Implementation for User Story 2

- [X] T008 [US2] Ensure Daily Proof environment exposes brand-sign, plant, lighting, collaboration-board, and storage kinds in src/features/city-view/scene/office/officeConfig.ts
- [X] T009 [US2] Add kind and label assertions in src/features/city-view/scene/office/OfficeVisualEnvironment.test.ts

**Checkpoint**: User Story 2 is functional and independently testable.

---

## Phase 5: User Story 3 - Preserve Office Workflows (Priority: P3)

**Goal**: Environment visuals do not interfere with existing interactive object marker refresh or lifecycle.

**Independent Test**: Refresh interactive objects and verify environment markers remain while interactive markers are replaced.

### Implementation for User Story 3

- [X] T010 [US3] Keep environment markers separate from interactive object refresh in src/features/city-view/scene/office/OfficeVisualLayer.ts
- [X] T011 [US3] Add visual lifecycle assertions in src/features/city-view/scene/office/OfficeVisualLayer.test.ts

**Checkpoint**: User Story 3 is functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and traceability.

- [X] T012 Run focused validation command from specs/133-project-company-office-visual-environment/quickstart.md
- [X] T013 Run git diff --check
- [X] T014 Confirm full ADOS validation is deferred to ADOS per handoff policy in specs/133-project-company-office-visual-environment/plan.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Blocks all rendering stories.
- **User Story 1 (Phase 3)**: Depends on visual environment metadata.
- **User Story 2 (Phase 4)**: Depends on Daily Proof environment details.
- **User Story 3 (Phase 5)**: Depends on visual rendering from US1.
- **Polish (Phase 6)**: Depends on all user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Requires typed environment metadata.
- **User Story 2 (P2)**: Builds on the same Daily Proof metadata.
- **User Story 3 (P3)**: Builds on the visual layer lifecycle.

### Parallel Opportunities

- T004 can run in parallel after T002-T003.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Add typed visual environment metadata and safe readers.
2. Define Daily Proof details.
3. Render the details in the office visual layer.

### Incremental Delivery

1. Deliver readable office atmosphere.
2. Assert detail kinds and labels.
3. Verify visual lifecycle isolation.
