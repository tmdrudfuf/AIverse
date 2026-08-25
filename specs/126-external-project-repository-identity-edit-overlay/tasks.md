# Tasks: External Project Repository Identity Edit Overlay

**Input**: Design documents from `specs/126-external-project-repository-identity-edit-overlay/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes portal state, rendering, and browser persistence behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm current draft creation, dashboard action, registry derivation, and persistence files.

- [x] T001 Inspect existing external draft, dashboard input, registry derivation, view rendering, and browser persistence in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalView.ts`, `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`, and `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared overlay state and bounded identity choices before user-story behavior.

- [x] T002 Add repository identity edit view-mode and selected choice state in `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [x] T003 Add external draft repository identity choice constants and application helper in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Edit draft repository identity (Priority: P1) MVP

**Goal**: A dashboard action opens an edit overlay and applies a selected identity choice to the external project draft.

**Independent Test**: Select the draft, open the dashboard action, apply the local AIverse worktree identity, and inspect registry/portal identity fields.

### Tests for User Story 1

- [x] T004 [US1] Add registry helper coverage for applying local and unknown draft identity choices in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts`
- [x] T005 [US1] Add controller coverage for opening the edit overlay from the draft dashboard and applying a choice in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`
- [x] T006 [US1] Add view coverage for rendering current identity and selectable choices in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

### Implementation for User Story 1

- [x] T007 [US1] Render the repository identity edit overlay in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T008 [US1] Open the overlay from the draft project dashboard action and navigate choices in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T009 [US1] Apply the selected identity choice, re-derive portal state, and return to dashboard in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Cancel without mutation (Priority: P2)

**Goal**: Escape exits the overlay without changing draft identity.

**Independent Test**: Open the overlay, move selection, cancel, and compare draft identity before/after.

### Tests for User Story 2

- [x] T010 [US2] Add controller coverage for cancelling without mutation in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 2

- [x] T011 [US2] Handle overlay escape without registry mutation or persistence in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Persist edited identity (Priority: P3)

**Goal**: Edited draft identity survives browser session restore.

**Independent Test**: Apply an identity choice, save/restore browser session state, and inspect restored draft identity.

### Tests for User Story 3

- [x] T012 [US3] Add browser session restore coverage for edited draft identity in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 3

- [x] T013 [US3] Persist browser office session after applying a draft repository identity choice in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task closeout.

- [x] T014 Review quickstart and contracts for implementation alignment in `specs/126-external-project-repository-identity-edit-overlay/quickstart.md` and `specs/126-external-project-repository-identity-edit-overlay/contracts/repository-identity-edit-overlay.md`
- [x] T015 Review diff readiness without running validation commands in this runtime

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion; implement in P1 -> P2 -> P3 order.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational.
- **User Story 2 (P2)**: Builds on the overlay input path from US1.
- **User Story 3 (P3)**: Builds on the apply path from US1.

## Parallel Opportunities

- T004 and T006 affect different files and can be drafted independently after T003.
- Most implementation tasks touch controller or registry state and should run sequentially.

## Implementation Strategy

1. Complete setup and foundational state/choice helpers.
2. Add US1 tests, then implement overlay rendering, opening, navigation, and application.
3. Add US2 test, then make escape cancellation mutation-free.
4. Add US3 test, then ensure identity application requests browser persistence.
5. Mark completed tasks and stop before validation per ADOS handoff policy.
