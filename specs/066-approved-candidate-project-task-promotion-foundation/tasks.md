# Tasks: Approved Candidate ProjectTask Promotion Foundation

**Input**: Design documents from `specs/066-approved-candidate-project-task-promotion-foundation/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by the feature request.

## Phase 1: Setup

**Purpose**: Establish feature pointers and documentation.

- [X] T001 Update `.specify/feature.json` to point at `specs/066-approved-candidate-project-task-promotion-foundation`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/066-approved-candidate-project-task-promotion-foundation/plan.md`
- [X] T003 Create Spec Kit docs in `specs/066-approved-candidate-project-task-promotion-foundation/`

---

## Phase 2: Foundational Domain

**Purpose**: Promotion request, result, mapper, idempotency, and immutable data.

- [X] T004 [P] Create promotion result domain types in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionTypes.ts`
- [X] T005 [P] Add promotion type immutability and ID tests in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionTypes.test.ts`
- [X] T006 Implement promotion validation and ProjectTask mapping service in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionService.ts`
- [X] T007 Add promotion eligibility, mapping, idempotency, duplicate, existing-task, and safety tests in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionService.test.ts`

---

## Phase 3: User Story 1 - Promote approved Candidate Tasks (Priority: P1)

**Goal**: Explicitly create one non-started ProjectTask from one approved Candidate Task.

**Independent Test**: Service tests prove valid promotion creates exactly one `Todo` unassigned ProjectTask with deterministic ID and provenance.

- [X] T008 [US1] Add promotion result state to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T009 [US1] Initialize promotion result state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T010 [US1] Wire `CandidateProjectTaskPromotionService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T011 [US1] Add explicit promote command handling in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T012 [US1] Add controller tests proving approved promotion creates one task and repeated command is idempotent in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Block unsafe promotion (Priority: P1)

**Goal**: Revalidate current state at promotion time and block unsafe/stale attempts.

**Independent Test**: Controller and service tests prove blocked inputs create no task and do not mutate employee/work-session/provider state.

- [X] T013 [US2] Add blocked-result handling and project isolation in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T014 [US2] Add controller tests for stale project, unavailable source, non-approved decision, no assignment, no employee mutation, no work-session creation, and no provider calls in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`
- [X] T015 [US2] Add upstream refresh and existing-task coexistence tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 5: User Story 3 - Display promotion results safely (Priority: P2)

**Goal**: Show promotion result state below existing dashboard planning rows without execution language.

**Independent Test**: View tests prove promoted/already/blocked rows, bounded text, `+N more`, and row priority.

- [X] T016 [P] Implement promotion result display rows in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionView.ts`
- [X] T017 [P] Add promotion result display tests in `src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionView.test.ts`
- [X] T018 [US3] Integrate promotion result rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T019 [US3] Add dashboard promotion result and layout regression tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Validation, Review, Commit

- [X] T020 Run focused promotion type tests
- [X] T021 Run focused promotion service tests
- [X] T022 Run focused controller/view tests
- [X] T023 Run `npm test`
- [X] T024 Run `npx tsc --noEmit`
- [X] T025 Run `npm run build`
- [X] T026 Run `git diff --check`
- [X] T027 Run `git diff --cached --check`
- [X] T028 Commit complete implementation locally
- [X] T029 Run independent Claude review against exact committed HEAD
- [X] T030 If review requests changes, fix blocking findings, revalidate, recommit, and re-review until Approved

## Dependencies & Execution Order

- Phase 1 before source implementation.
- Phase 2 before controller or UI integration.
- US1 and US2 are MVP and must pass before US3 is considered complete.
- Promotion result rows remain lower priority than promotion review, assignment, Candidate Task, issue, and active task rows.

## Parallel Opportunities

- T004 and T005 can run in parallel once names are stable.
- T016 and T017 can run after the result collection shape is stable.

## Implementation Strategy

Implement pure domain/result types first; then promotion service validation and mapping; then controller command/state integration; then dashboard display and layout tests.
