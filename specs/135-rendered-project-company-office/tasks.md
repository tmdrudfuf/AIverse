# Tasks: Rendered Project Company Office

**Input**: Design documents from `/specs/135-rendered-project-company-office/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused tests are required by the specification. Tests should verify semantic/rendering contracts without brittle exact-pixel snapshots.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup

**Purpose**: Restore Spec Kit traceability and active feature pointer.

- [X] T001 Update `.specify/feature.json` to point at `specs/135-rendered-project-company-office`
- [X] T002 Update `AGENTS.md` Spec Kit managed pointer to `specs/135-rendered-project-company-office/plan.md`

---

## Phase 2: Foundational

**Purpose**: Define the stable rendered composition contract used by rendering and tests.

- [X] T003 [P] Add rendered office composition model/helper in `src/features/city-view/scene/office/RenderedOfficeComposition.ts`
- [X] T004 [P] Add composition contract tests in `src/features/city-view/scene/office/RenderedOfficeComposition.test.ts`

---

## Phase 3: User Story 1 - Enter a Rendered Software Company Office (Priority: P1)

**Goal**: Replace the old visible office presentation with a dense top-down software-company office.

**Independent Test**: Instantiate the visual layer with a scene stub and verify it renders the new composition primitives and no longer depends on legacy interior-zone marker counts.

- [X] T005 [US1] Replace legacy zone/label-first presentation in `src/features/city-view/scene/office/OfficeVisualLayer.ts`
- [X] T006 [US1] Update visual layer tests in `src/features/city-view/scene/office/OfficeVisualLayer.test.ts`

---

## Phase 4: User Story 2 - See Physical Departments and Workplaces (Priority: P2)

**Goal**: Render all required physical departments and map employee destinations to meaningful visible workplaces.

**Independent Test**: Verify composition and NPC position tests cover Engineering, Review, Validation/QA, Operations, and shared anchors.

- [X] T007 [US2] Extend department layout metadata for Spec 135 functional areas in `src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts`
- [X] T008 [US2] Update active layout department/workstation semantics in `src/features/city-view/scene/office/layout/OfficeLayoutService.ts`
- [X] T009 [US2] Update layout tests in `src/features/city-view/scene/office/layout/OfficeLayoutService.test.ts`
- [X] T010 [US2] Remap NPC logical positions to visible physical workplaces in `src/features/city-view/scene/office/npc/EmployeeNpcPositionResolver.ts`
- [X] T011 [US2] Update NPC renderer/position tests in `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts`

---

## Phase 5: User Story 3 - Preserve Existing Office Behaviors (Priority: P3)

**Goal**: Preserve project portal, click interactions, operator navigation assumptions, dynamic identity, and non-proximity workspace interaction.

**Independent Test**: Existing controller tests pass, including clicked interactions without Founder proximity.

- [X] T012 [US3] Verify dynamic project identity rendering in `src/features/city-view/scene/office/RenderedOfficeComposition.test.ts`
- [X] T013 [US3] Preserve and run focused interaction tests in `src/features/city-view/scene/office/OfficeInteractionController.test.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate focused implementation and capture visual evidence where tooling permits.

- [X] T014 Run focused Vitest validation for Spec 135 office rendering files
- [X] T015 Run `git diff --check`
- [X] T016 Perform runtime project-office visual verification and retain screenshot evidence if tooling permits

## Dependencies & Execution Order

- Phase 1 must complete before implementation.
- Phase 2 defines the composition contract and blocks visual rendering changes.
- User Story 1 is the MVP and must replace the visible office presentation.
- User Story 2 builds on the rendered composition with department semantics and NPC mapping.
- User Story 3 verifies behavior preservation.
- Polish validation runs after implementation tasks.

## Parallel Opportunities

- T003 and T004 can be drafted together but tests must validate the final helper.
- Story tests touching different files can be updated in parallel after the composition helper exists.

## Implementation Strategy

1. Restore Spec Kit artifacts and pointers.
2. Add a testable rendered composition helper.
3. Replace `OfficeVisualLayer` rendering with physical departments/furniture.
4. Update NPC and layout semantics to match visible workstations.
5. Run focused validation and runtime visual verification.
