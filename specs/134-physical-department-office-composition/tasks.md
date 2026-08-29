# Tasks: Physical Department Office Composition

**Input**: Design documents from `specs/134-physical-department-office-composition/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature adds new layout metadata and read-only accessors.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Verify existing office layout service and type surfaces in src/features/city-view/scene/office/layout/

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Add physical department area types in src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts
- [X] T003 Add department-area composition and defensive cloning in src/features/city-view/scene/office/layout/OfficeLayoutService.ts
- [X] T004 [P] Add focused department composition tests in src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts

## Phase 3: User Story 1 - Read Future Department Areas (Priority: P1)

- [X] T005 [US1] Define growing-company frontend, backend, design, and QA department areas in src/features/city-view/scene/office/layout/OfficeLayoutService.ts
- [X] T006 [US1] Assert stable department kinds, labels, floor ids, zone ids, position hints, and slot ids in src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts

## Phase 4: User Story 2 - Preserve Current Office Behavior (Priority: P2)

- [X] T007 [US2] Keep active Level 1 layout department areas empty in src/features/city-view/scene/office/layout/OfficeLayoutService.ts
- [X] T008 [US2] Assert active layout existing counts and empty department areas in src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts

## Phase 5: User Story 3 - Protect Layout Definitions (Priority: P3)

- [X] T009 [US3] Ensure department area nested arrays and position hints are cloned in src/features/city-view/scene/office/layout/OfficeLayoutService.ts
- [X] T010 [US3] Assert department area defensive reads in src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T011 Run focused validation command from specs/134-physical-department-office-composition/quickstart.md
- [X] T012 Run git diff --check
- [X] T013 Confirm full ADOS validation is deferred to ADOS per handoff policy in specs/134-physical-department-office-composition/plan.md

## Dependencies & Execution Order

- Phase 1 before all implementation work.
- Phase 2 before story assertions.
- User Story 1 enables future department composition.
- User Story 2 and User Story 3 depend on the same metadata and accessors.
- Polish depends on all user stories.
