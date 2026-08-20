# Tasks: Reception Desk Upgrade Benefits Interaction

**Input**: Design documents from `/specs/110-reception-desk-upgrade-benefits-interaction/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes progression-derived workspace UI.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restore the missing Spec Kit context for feature 110.

- [x] T001 Point Spec Kit active feature metadata at specs/110-reception-desk-upgrade-benefits-interaction in .specify/feature.json
- [x] T002 Update the SPECKIT managed AGENTS.md plan pointer to specs/110-reception-desk-upgrade-benefits-interaction/plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add a small progression-derived benefits model.

- [x] T003 [P] Add reception benefit derivation coverage in src/features/city-view/scene/office/ReceptionDeskUpgradeBenefitsService.test.ts
- [x] T004 Add ReceptionDeskUpgradeBenefitsService in src/features/city-view/scene/office/ReceptionDeskUpgradeBenefitsService.ts
- [x] T005 Add reception benefit state wiring in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts and src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts

---

## Phase 3: User Story 1 - See Reception Desk Upgrade Benefits In Workspace (Priority: P1) MVP

**Goal**: Level 2 players see passive reception benefits in the workspace opened from the desk.

**Independent Test**: Render the workspace with reception benefits and verify the expected benefit rows appear.

### Tests for User Story 1

- [x] T006 [P] [US1] Add workspace benefit rendering coverage in src/features/city-view/scene/office/OfficeProjectPortalView.test.ts

### Implementation for User Story 1

- [x] T007 [US1] Render reception upgrade benefits in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 4: User Story 2 - Keep Benefit Text Tied To Progression State (Priority: P2)

**Goal**: Portal state refreshes benefits from current progression and omits them before reception unlock.

**Independent Test**: Refresh portal progression at level 1 and level 2 and verify benefit state is omitted or present accordingly.

### Implementation for User Story 2

- [x] T008 [US2] Refresh reception benefit state from current progression in src/features/city-view/scene/office/OfficeProjectPortalController.ts

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Final traceability cleanup.

- [x] T009 Mark all completed tasks in specs/110-reception-desk-upgrade-benefits-interaction/tasks.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup completion
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **Polish (Phase 5)**: Depends on all user stories

### Parallel Opportunities

- T003 and T006 are in separate test files and can be prepared independently.

## Implementation Strategy

### MVP First

1. Restore feature 110 Spec Kit artifacts.
2. Add benefit derivation service and coverage.
3. Render benefits from explicit state in the workspace.
4. Stop for focused validation outside this runtime.

### Incremental Delivery

1. Derive benefits from progression.
2. Wire portal state refresh.
3. Render the passive benefit panel.
4. Run focused and full ADOS validation outside this runtime.
