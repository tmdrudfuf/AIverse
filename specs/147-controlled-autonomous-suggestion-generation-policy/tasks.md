# Tasks: Controlled Autonomous Suggestion Generation Policy

**Input**: Design documents from `/specs/147-controlled-autonomous-suggestion-generation-policy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create Spec 147 artifacts and update the active feature pointer.

- [X] T001 Verify Spec 147 docs and feature pointer in `.specify/feature.json` and `AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared policy types, deterministic service, and event coordinator required by all user stories.

- [X] T002 [P] Add autonomous suggestion policy/result types in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyTypes.ts`
- [X] T003 [P] Add deterministic Spec 147 policy and coordinator tests in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyService.test.ts`
- [X] T004 Implement autonomous suggestion policy service in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyService.ts`
- [X] T005 Implement autonomous suggestion coordinator that reuses Spec 143 in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionCoordinator.ts`

---

## Phase 3: User Story 1 - Enable Auto Suggestions Per Project (Priority: P1)

**Goal**: Operator can explicitly enable, disable, and persist Auto Suggestions per project.

**Independent Test**: Enable Project A, reload, and confirm Project B remains disabled.

- [X] T006 [US1] Add autonomous suggestion policy state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T007 [US1] Initialize autonomous suggestion policy state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T008 [US1] Persist autonomous suggestion policies in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`
- [X] T009 [US1] Restore and save autonomous suggestion policies fail-closed in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 4: User Story 2 - Generate One Bounded Suggestion Safely (Priority: P1)

**Goal**: Evaluation invokes existing Spec 143 suggestion generation once and creates only proposed same-project suggestions.

**Independent Test**: Project A generates one suggestion, Project B receives none, and manual generation remains valid while Spec 147 is disabled.

- [X] T010 [US2] Wire policy updates and event evaluation into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T011 [US2] Preserve manual backlog suggestion generation coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog-suggestions.test.ts`

---

## Phase 5: User Story 3 - Deterministic Gates and Boundaries (Priority: P1)

**Goal**: Spec 147 skips unsafe states and never invokes downstream automation, execution, ADOS, Git, or GitHub.

**Independent Test**: Disabled, malformed, disconnected, cooldown, duplicate-event, pending suggestion, capacity, active execution, and Ready work states skip generation without provider invocation or downstream calls.

- [X] T012 [US3] Pass active execution, Ready work, pending suggestion, and capacity state to Spec 147 evaluation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T013 [US3] Cover all required deterministic safety cases in `src/features/city-view/scene/office/project-backlog/ProjectAutonomousSuggestionPolicyService.test.ts`

---

## Phase 6: User Story 4 - Audit and Portfolio Awareness (Priority: P2)

**Goal**: Office displays compact controls and portfolio shows read-only project-scoped summary.

**Independent Test**: Four automation controls show and persist independently; portfolio status is read-only.

- [X] T014 [US4] Add Auto Suggestions controls to `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T015 [US4] Include Auto Suggestions fields in project backlog display/probe data in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T016 [US4] Add read-only portfolio Auto Suggestions summary in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T017 [US4] Add portfolio and browser-session coverage in `src/features/city-view/scene/PortfolioOperationsService.test.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.browser-session.test.ts`

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate targeted behavior and task traceability.

- [X] T018 Run targeted Vitest coverage for Spec 147 service, office suggestions, browser session, and portfolio tests
- [X] T019 Run `git diff --check`
- [X] T020 Add two-project runtime verification evidence in `specs/147-controlled-autonomous-suggestion-generation-policy/runtime-verification.md` and `specs/147-controlled-autonomous-suggestion-generation-policy/runtime-evidence.json`

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 blocks user stories.
- User Stories 1, 2, and 3 are P1 and must all complete before User Story 4.
- Final validation depends on all implementation phases.

## Parallel Opportunities

- T002 and T003 can be authored independently before T004/T005.
- UI and portfolio tests can be updated after controller state is available.

## Implementation Strategy

Implement deterministic policy eligibility first, then the bounded coordinator, persistence, controller wiring, UI summary, read-only portfolio summary, and runtime evidence. Keep every mutation project-scoped and route generation through `ProjectBacklogSuggestionService.generateSuggestions`.
