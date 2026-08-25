# Tasks: Project Portal Add External Project Draft Action

**Input**: Design documents from `specs/125-project-portal-add-external-project-draft/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes portal state and browser persistence behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing Project Portal list action and registry derivation files.

- [x] T001 Inspect portal list input/rendering and project registry derivation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, `src/features/city-view/scene/office/OfficeProjectPortalView.ts`, and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared draft identity and derivation helpers before user-story behavior.

- [x] T002 Add external project draft constants and creation helper in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [x] T003 Add draft selection state support in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Add an external project draft from the portal (Priority: P1) MVP

**Goal**: A portal list action adds and selects one external project draft.

**Independent Test**: Select Add External Project, activate it, and inspect project rows and registry entries.

### Tests for User Story 1

- [x] T004 [US1] Add portal add-draft action coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 1

- [x] T005 [US1] Render Add External Project as a selectable list action in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T006 [US1] Handle Add External Project activation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T007 [US1] Append the draft to `projectRegistryEntries` and derived `projects` in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Keep draft creation idempotent within a session (Priority: P2)

**Goal**: Repeated action activation reselects the existing draft instead of duplicating it.

**Independent Test**: Activate Add External Project twice and confirm exactly one draft exists.

### Tests for User Story 2

- [x] T008 [US2] Add repeated add-draft activation coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 2

- [x] T009 [US2] Reuse and select the existing draft when present in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Persist the draft through browser session state (Priority: P3)

**Goal**: Added drafts use the existing browser session registry persistence path.

**Independent Test**: Add a draft, save/restore browser state, and inspect restored registry entries and repository mappings.

### Tests for User Story 3

- [x] T010 [US3] Add browser-persisted draft restore coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts`

### Implementation for User Story 3

- [x] T011 [US3] Persist browser office session after draft creation or reselection in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task closeout.

- [x] T012 Update `specs/125-project-portal-add-external-project-draft/quickstart.md` if implementation details change
- [x] T013 Review diff readiness without running validation commands in this runtime

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion; implement in P1 -> P2 -> P3 order.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational.
- **User Story 2 (P2)**: Builds on the same activation path as US1.
- **User Story 3 (P3)**: Builds on the browser persistence path from US1.

## Parallel Opportunities

- T005 and T006 affect different files but should follow T004 for TDD ordering.
- No additional parallel work is recommended because most implementation tasks touch portal controller state.

## Implementation Strategy

1. Complete setup and foundational helpers.
2. Add US1 test, then implement list rendering and activation.
3. Add US2 test, then make activation idempotent.
4. Add US3 test, then ensure activation requests browser persistence.
5. Mark completed tasks and stop before validation per ADOS handoff policy.
