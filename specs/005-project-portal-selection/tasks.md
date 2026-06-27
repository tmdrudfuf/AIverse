# Tasks: Project Portal Selection

**Input**: Design documents from `/specs/005-project-portal-selection/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Automated validation is required after implementation; no separate test files are required for this phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Extend portal state and static project detail data.

- [x] T001 Extend portal state/model types in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T002 Add project detail content and linked services in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add portal-owned keyboard inputs.

- [x] T003 Extend Up/Down/Enter capture and consume methods in src/features/city-view/scene/office/OfficeActionInputController.ts

---

## Phase 3: User Story 1 - Navigate Project List (Priority: P1) MVP

**Goal**: Move project selection with Up/Down in list view.

**Independent Test**: Open portal and confirm Up/Down changes selected row.

- [x] T004 [US1] Implement selectedProjectIndex navigation in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T005 [US1] Render selected list row in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 4: User Story 2 - Open Project Detail (Priority: P2)

**Goal**: Open selected project detail with Enter or Space.

**Independent Test**: Select each project and open its detail view.

- [x] T006 [US2] Implement list-to-detail transition in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T007 [US2] Render project detail view in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 5: User Story 3 - Back And Placeholder Action (Priority: P3)

**Goal**: Esc returns from detail to list; Enter/Space in detail records placeholder action.

**Independent Test**: Use Esc from detail and Enter/Space placeholder action in detail.

- [x] T008 [US3] Implement detail back/action handling in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T009 [US3] Route Up/Down/Enter/Space/Esc portal input in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate and clean up.

- [x] T010 Run npx tsc --noEmit
- [x] T011 Run npm run build
- [x] T012 Run git diff --check

---

## Dependencies & Execution Order

- Phase 1 before Phase 2.
- Phase 2 before user stories.
- US1 before US2; US2 before US3.
- Validation after implementation.

## Implementation Strategy

1. Extend portal data/state.
2. Extend office input controller.
3. Add controller navigation/detail behavior.
4. Update view to render list/detail state.
5. Route portal input from CompanyOfficeScene.
6. Run automated validation.