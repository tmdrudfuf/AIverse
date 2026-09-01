# Tasks: AI-Assisted Project Backlog Suggestions

**Input**: Design documents from `/specs/143-ai-assisted-project-backlog-suggestions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Deterministic coverage is required by the specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align Spec Kit artifacts and shared types before implementation.

- [X] T001 Create Spec 143 documentation artifacts in specs/143-ai-assisted-project-backlog-suggestions/
- [X] T002 Update Spec Kit active feature pointer and agent plan reference to Spec 143

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core suggestion data model and provider-neutral service.

- [X] T003 [P] Add project backlog suggestion types in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionTypes.ts
- [X] T004 [P] Add ProjectBacklogSuggestionService tests in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionService.test.ts
- [X] T005 Implement ProjectBacklogSuggestionService in src/features/city-view/scene/office/project-backlog/ProjectBacklogSuggestionService.ts

---

## Phase 3: User Story 1 - Request Project Suggestions (Priority: P1) MVP

**Goal**: Operator explicitly requests project-scoped suggestions.

**Independent Test**: Suggestions appear only after the explicit action and prompts contain only target project context.

- [X] T006 [US1] Extend portal state/types with suggestion collections and review state in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [X] T007 [P] [US1] Add controller tests for explicit generation and prompt isolation in src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-suggestions.test.ts
- [X] T008 [US1] Wire explicit suggestion generation in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T009 [US1] Render suggestion generation control and proposed candidates in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 4: User Story 2 - Review Accept Or Reject Suggestions (Priority: P2)

**Goal**: Operator accepts, rejects, or edits suggestions before acceptance.

**Independent Test**: Accepted suggestions become same-project backlog tasks in backlog status; rejected suggestions do not create tasks.

- [X] T010 [P] [US2] Add accept/reject/edit controller tests in src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-suggestions.test.ts
- [X] T011 [US2] Implement accept/reject/edit handlers in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [X] T012 [US2] Add review action UI for accept, reject, and edit-before-accept in src/features/city-view/scene/office/OfficeProjectPortalView.ts

---

## Phase 5: User Story 3 - Preserve Multi-Project Isolation (Priority: P3)

**Goal**: Suggestions persist by canonical project and never cross-contaminate.

**Independent Test**: Two-project generation, acceptance, rejection, switching, and reload keep state separate.

- [X] T013 [P] [US3] Extend browser session persistence tests in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts
- [X] T014 [US3] Persist suggestion collections in src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts and src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts
- [X] T015 [P] [US3] Add portfolio suggestion count tests in src/features/city-view/scene/PortfolioOperationsService.test.ts
- [X] T016 [US3] Surface concise project suggestion counts in src/features/city-view/scene/PortfolioOperationsService.ts

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Compatibility, runtime evidence, and focused validation.

- [X] T017 Add runtime evidence notes in specs/143-ai-assisted-project-backlog-suggestions/runtime-verification.md
- [X] T018 Run targeted tests and diff checks allowed by handoff

## Dependencies & Execution Order

- Phase 1 before all implementation.
- Phase 2 blocks all user stories.
- User Story 1 must precede User Story 2 UI/controller actions.
- User Story 3 can proceed after foundational types exist.
- Polish follows all desired user stories.

## Parallel Opportunities

- T003 and T004 can run in parallel.
- T007 can run before T008.
- T013 and T015 can run in parallel after state/types are known.

## Implementation Strategy

1. Complete Spec Kit artifact alignment.
2. Build and test the provider-neutral suggestion service.
3. Wire explicit generation into the existing portal.
4. Add operator review actions and persistence.
5. Add portfolio counts and runtime evidence.
