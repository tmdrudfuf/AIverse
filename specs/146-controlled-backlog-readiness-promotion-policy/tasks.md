# Tasks: Controlled Backlog Readiness Promotion Policy

**Input**: Design documents from `/specs/146-controlled-backlog-readiness-promotion-policy/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the authoritative requirements.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature artifacts and affected files.

- [X] T001 Verify Spec 146 docs and feature pointer in `.specify/feature.json` and `AGENTS.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared policy types and deterministic service required by all user stories.

- [X] T002 [P] Add readiness promotion policy/result types in `src/features/city-view/scene/office/project-backlog/ProjectBacklogReadinessPromotionPolicyTypes.ts`
- [X] T003 [P] Add deterministic policy service tests in `src/features/city-view/scene/office/project-backlog/ProjectBacklogReadinessPromotionPolicyService.test.ts`
- [X] T004 Implement readiness promotion policy service in `src/features/city-view/scene/office/project-backlog/ProjectBacklogReadinessPromotionPolicyService.ts`

---

## Phase 3: User Story 1 - Enable Auto Ready Per Project (Priority: P1)

**Goal**: Operator can explicitly enable, disable, and persist Auto Ready per project.

**Independent Test**: Enable Project A, reload, and confirm Project B remains disabled.

- [X] T005 [US1] Add project readiness policy state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T006 [US1] Initialize readiness policy state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T007 [US1] Persist readiness policies in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionTypes.ts`
- [X] T008 [US1] Restore and save readiness policies fail-closed in `src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.ts`

---

## Phase 4: User Story 2 - Promote Eligible Backlog Tasks Safely (Priority: P1)

**Goal**: Evaluation promotes only valid same-project backlog tasks through existing transition semantics.

**Independent Test**: Project A promotes one high backlog task, skips low priority and Project B backlog, and repeated evaluation is idempotent.

- [X] T009 [US2] Wire evaluation and policy updates into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T010 [US2] Preserve manual backlog Ready promotion in `src/features/city-view/scene/office/OfficeProjectPortalController.project-backlog.test.ts`

---

## Phase 5: User Story 3 - Preserve Execution Boundary (Priority: P1)

**Goal**: Spec 146 skips active execution when required and never invokes execution/development systems.

**Independent Test**: Active run state prevents promotion and no Spec 142/144/ADOS/Git/GitHub mutation occurs.

- [X] T011 [US3] Pass active execution state to readiness evaluation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US3] Cover active execution and no direct execution side effects in `src/features/city-view/scene/office/project-backlog/ProjectBacklogReadinessPromotionPolicyService.test.ts`

---

## Phase 6: User Story 4 - Audit and Portfolio Awareness (Priority: P2)

**Goal**: Office displays compact controls and portfolio shows read-only project-scoped summary.

**Independent Test**: Office probe/UI exposes Auto Ready controls and portfolio derivation does not mutate policy or backlog state.

- [X] T013 [US4] Add Auto Ready controls to `src/features/city-view/scene/office/CompanyOfficeScene.ts`
- [X] T014 [US4] Include Auto Ready fields in project backlog display/probe data in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T015 [US4] Add read-only portfolio Auto Ready summary in `src/features/city-view/scene/PortfolioOperationsService.ts`
- [X] T016 [US4] Add portfolio and browser-session coverage in `src/features/city-view/scene/PortfolioOperationsService.test.ts` and `src/features/city-view/scene/office/OfficeProjectPortalController.browser-session.test.ts`

---

## Final Phase: Polish & Cross-Cutting Concerns

**Purpose**: Validate targeted behavior and task traceability.

- [X] T017 Run targeted Vitest coverage for Spec 146 service, office project backlog, browser session, and portfolio tests
- [X] T018 Run `git diff --check`

---

## Dependencies & Execution Order

- Phase 1 before all phases.
- Phase 2 blocks user stories.
- User Stories 1, 2, and 3 are P1 and must all complete before User Story 4.
- Final validation depends on all implementation phases.

## Parallel Opportunities

- T002 and T003 can be authored independently before T004.
- UI and portfolio tests can be updated after controller state is available.

## Implementation Strategy

Implement the deterministic service first, then persistence, controller wiring, UI summary, and read-only portfolio summary. Keep every mutation project-scoped and route backlog state changes through `ProjectBacklogService.updateTask`.
