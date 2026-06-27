# Tasks: Office Interactive Objects

**Input**: Design documents from `/specs/003-office-interactive-objects/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Automated validation is required after implementation; no separate test files are required for this phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add object model types and tilemap marker source.

- [x] T001 Add OfficeInteractiveObject and interaction result types in src/features/city-view/scene/office/officeTypes.ts
- [x] T002 Add computer_01 marker to Interaction Layer in public/assets/office/daily-proof/daily-proof-office.tmj

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared Space input and object registry/detection primitives.

- [x] T003 Add OfficeActionInputController in src/features/city-view/scene/office/OfficeActionInputController.ts
- [x] T004 Add OfficeInteractiveObjectRegistry in src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.ts
- [x] T005 Add OfficeInteractionController in src/features/city-view/scene/office/OfficeInteractionController.ts
- [x] T006 Add OfficeInteractionPrompt in src/features/city-view/scene/office/OfficeInteractionPrompt.ts

---

## Phase 3: User Story 1 - Use An Office Computer Placeholder (Priority: P1) MVP

**Goal**: Trigger a placeholder computer action from the office.

**Independent Test**: Stand in the computer zone, see the prompt, press Space, and confirm placeholder result logging/storage.

- [x] T007 [US1] Parse interaction markers and fallback computer zone in src/features/city-view/scene/office/OfficeInteractiveObjectRegistry.ts
- [x] T008 [US1] Wire interaction controller and prompt in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 4: User Story 2 - Preserve Exit Priority (Priority: P2)

**Goal**: Keep exit behavior higher priority than object interaction.

**Independent Test**: Press Space in the exit zone and return to city; object action does not run when exit is active.

- [x] T009 [US2] Refactor OfficeExitController to expose exit state and return payload without owning Space in src/features/city-view/scene/office/OfficeExitController.ts
- [x] T010 [US2] Dispatch consumed Space by exit-before-object priority in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 5: User Story 3 - Reserve Future Object Expansion (Priority: P3)

**Goal**: Keep object model extensible without implementing integrations or simulation.

**Independent Test**: Confirm object model includes stable id, type, displayName, interactionZone, enabled, action, and markerId.

- [x] T011 [US3] Ensure interaction result remains placeholder-only in src/features/city-view/scene/office/OfficeInteractionController.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate and clean up.

- [x] T012 Run npx tsc --noEmit
- [x] T013 Run npm run build
- [x] T014 Run git diff --check

---

## Dependencies & Execution Order

- Phase 1 before Phase 2.
- Phase 2 before user stories.
- US1 and US2 both depend on shared Space input.
- Validation after implementation.

## Implementation Strategy

1. Add model types and tilemap marker.
2. Add single Space input controller.
3. Add registry, interaction controller, and prompt.
4. Refactor exit controller away from direct Space ownership.
5. Dispatch Space in CompanyOfficeScene by exit-before-object priority.
6. Run automated validation.
