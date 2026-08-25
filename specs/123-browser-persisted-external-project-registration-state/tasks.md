# Tasks: Browser-Persisted External Project Registration State

**Input**: Design documents from `specs/123-browser-persisted-external-project-registration-state/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Focused Vitest coverage is included because the feature changes persistence and restore behavior.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm existing browser session and registry composition files.

- [x] T001 Inspect browser session persistence and project registry composition in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`, `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`, and `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add shared registry validation/rebuild helpers before user-story restore behavior.

- [x] T002 Add project registry entry shape guards and clone helpers in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`
- [x] T003 Add derived state rebuild logic in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Restore externally registered projects after reload (Priority: P1) MVP

**Goal**: Valid saved external projects survive browser session save and restore.

**Independent Test**: Save a state with an external project, restore a fresh state, and inspect registry entries, portal projects, and repository mappings.

### Tests for User Story 1

- [x] T004 [US1] Add save/restore coverage for a persisted external project in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

### Implementation for User Story 1

- [x] T005 [US1] Persist `projectRegistryEntries` in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`
- [x] T006 [US1] Save and restore valid project registry entries in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`
- [x] T007 [US1] Rebuild restored `projects` and `repositoryMappings` from restored registry entries in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

**Checkpoint**: User Story 1 is independently testable.

---

## Phase 4: User Story 2 - Ignore unsafe saved project records (Priority: P2)

**Goal**: Malformed saved registry entries never crash restore or enter portal state.

**Independent Test**: Restore from snapshots with malformed `projectRegistryEntries` and confirm defaults remain intact.

### Tests for User Story 2

- [x] T008 [US2] Add malformed persisted project registry coverage in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

### Implementation for User Story 2

- [x] T009 [US2] Reject malformed registry entry records during snapshot validation in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

**Checkpoint**: User Story 2 is independently testable.

---

## Phase 5: User Story 3 - Preserve copy boundaries for persisted projects (Priority: P3)

**Goal**: Restored registry entries are copied consistently with existing registry behavior.

**Independent Test**: Mutate restored objects and confirm a later restore returns original saved values.

### Tests for User Story 3

- [x] T010 [US3] Add restored registry copy-boundary coverage in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts`

### Implementation for User Story 3

- [x] T011 [US3] Clone saved, loaded, and restored project registry data in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and task closeout.

- [x] T012 Update `specs/123-browser-persisted-external-project-registration-state/quickstart.md` if implementation details change
- [x] T013 Review `git diff --check` readiness without running validation commands in this runtime

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup completion and blocks user stories.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion; implement in P1 -> P2 -> P3 order.
- **Polish (Final Phase)**: Depends on desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational.
- **User Story 2 (P2)**: Builds on the same validation path as US1.
- **User Story 3 (P3)**: Builds on the save/load/restore path from US1.

## Parallel Opportunities

- T005 and T007 touch different files but should follow T004 for TDD ordering.
- No additional parallel work is recommended because most tasks touch the same browser session service file.

## Implementation Strategy

1. Complete setup and foundational helpers.
2. Add US1 test, then implement save/restore and derived collection rebuild.
3. Add malformed-data test and tighten validation.
4. Add copy-boundary test and clone on all persistence boundaries.
5. Mark completed tasks and stop before validation per ADOS handoff policy.
