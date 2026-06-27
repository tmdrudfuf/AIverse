# Tasks: Computer Project Portal

**Input**: Design documents from `/specs/004-computer-project-portal/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Automated validation is required after implementation; no separate test files are required for this phase.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add portal model and static placeholder data.

- [x] T001 Add project portal model types in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T002 Add static project portal data in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add portal rendering and input ownership primitives.

- [x] T003 Extend Space/Escape handling in src/features/city-view/scene/office/OfficeActionInputController.ts
- [x] T004 Add Phaser overlay view in src/features/city-view/scene/office/OfficeProjectPortalView.ts
- [x] T005 Add open/close portal controller in src/features/city-view/scene/office/OfficeProjectPortalController.ts

---

## Phase 3: User Story 1 - Open Project Portal From Office Computer (Priority: P1) MVP

**Goal**: Open a static portal overlay from the office computer interaction.

**Independent Test**: Stand in the computer zone, press Space, and confirm portal opens with project/service placeholder content.

- [x] T006 [US1] Return semantic computer interaction result from src/features/city-view/scene/office/OfficeInteractionController.ts
- [x] T007 [US1] Wire computer interaction to portal open in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 4: User Story 2 - Close Portal Without Breaking Office Controls (Priority: P2)

**Goal**: Close portal with Esc or Space while preventing same-frame open-close.

**Independent Test**: Open portal; close with Esc; reopen and close with Space.

- [x] T008 [US2] Implement portal close input handling in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T009 [US2] Consume portal close input in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 5: User Story 3 - Block Office Controls While Portal Is Open (Priority: P3)

**Goal**: Disable movement, zoom, exit, and object interactions while portal is open.

**Independent Test**: Open portal and confirm movement/zoom/exit/object interaction are ignored until it closes.

- [x] T010 [US3] Short-circuit office update while portal is open in src/features/city-view/scene/office/CompanyOfficeScene.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validate and clean up.

- [x] T011 Run npx tsc --noEmit
- [x] T012 Run npm run build
- [x] T013 Run git diff --check

---

## Dependencies & Execution Order

- Phase 1 before Phase 2.
- Phase 2 before user stories.
- US1 before US2/US3 validation.
- Validation after implementation.

## Implementation Strategy

1. Add portal data and types.
2. Add input support for Escape.
3. Add Phaser overlay view and controller.
4. Open portal from `use_computer` interaction.
5. Short-circuit office updates while portal is open.
6. Run automated validation.