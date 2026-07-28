# Tasks: Candidate Task Promotion Approval Foundation

**Input**: Design documents from `specs/065-candidate-task-promotion-approval-foundation/`

**Prerequisites**: spec.md, plan.md, data-model.md, contracts/, quickstart.md

**Tests**: Required by the feature request.

## Phase 1: Setup

**Purpose**: Establish feature pointers and documentation.

- [X] T001 Update `.specify/feature.json` to point at `specs/065-candidate-task-promotion-approval-foundation`
- [X] T002 Update `AGENTS.md` Spec Kit pointer to `specs/065-candidate-task-promotion-approval-foundation/plan.md`
- [X] T003 Create Spec Kit docs in `specs/065-candidate-task-promotion-approval-foundation/`

---

## Phase 2: Foundational Domain

**Purpose**: Promotion review, eligibility, transition, and immutable decision data.

- [X] T004 [P] Create promotion domain types in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionTypes.ts`
- [X] T005 [P] Add promotion type immutability tests in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionTypes.test.ts`
- [X] T006 [P] Implement eligibility evaluator in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionEligibility.ts`
- [X] T007 [P] Add eligibility tests in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionEligibility.test.ts`
- [X] T008 Implement promotion service and transition policy in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionService.ts`
- [X] T009 Add decision transition, storage, ordering, and immutability tests in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionService.test.ts`

---

## Phase 3: User Story 1 - Evaluate promotion eligibility (Priority: P1)

**Goal**: Produce promotion review collections from existing Candidate Tasks and assignment recommendations.

**Independent Test**: Service tests prove eligibility and no-match behavior without upstream mutation.

- [X] T010 [US1] Add `candidatePromotionReviewCollections`, `candidatePromotionDecisionRecords`, and `selectedCandidatePromotionIndex` to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts`
- [X] T011 [US1] Initialize promotion state in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`
- [X] T012 [US1] Wire `CandidatePromotionService` into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T013 [US1] Refresh promotion review collections after Candidate Task and assignment refresh in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T014 [US1] Add controller tests for Candidate Task and assignment reuse in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 4: User Story 2 - Record human decisions locally (Priority: P1)

**Goal**: Apply safe local human decisions without creating active work.

**Independent Test**: Controller tests prove approval is local and creates no ProjectTask, work session, employee mutation, AI invocation, or GitHub mutation.

- [X] T015 [US2] Add controller decision application methods in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T016 [US2] Add dashboard input handling for selection, approve, reject/defer/reset cycle in `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [X] T017 [US2] Add controller safety and project isolation tests in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

---

## Phase 5: User Story 3 - Display promotion review safely (Priority: P2)

**Goal**: Render promotion reviews as the lowest-priority dashboard planning row.

**Independent Test**: View tests prove row text, action labels, no execution wording, bounded text, `+N more`, and layout priority.

- [X] T018 [P] Implement promotion display rows in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionView.ts`
- [X] T019 [P] Add promotion display row tests in `src/features/city-view/scene/office/candidate-promotions/CandidatePromotionView.test.ts`
- [X] T020 [US3] Integrate promotion rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [X] T021 [US3] Add dashboard promotion rendering and layout regression tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

---

## Phase 6: Validation, Review, Commit

- [X] T022 Run focused promotion eligibility tests
- [X] T023 Run focused promotion service/type tests
- [X] T024 Run focused controller/view tests
- [X] T025 Run `npm test`
- [X] T026 Run `npx tsc --noEmit`
- [X] T027 Run `npm run build`
- [X] T028 Run `git diff --check`
- [X] T029 Run `git diff --cached --check`
- [ ] T030 Commit complete implementation locally
- [ ] T031 Run independent Claude review against exact committed HEAD
- [ ] T032 If review requests changes, fix blocking findings, revalidate, recommit, and re-review until Approved

## Dependencies & Execution Order

- Phase 1 before source implementation.
- Phase 2 before controller or UI integration.
- US1 and US2 are MVP and must pass before US3 is considered complete.
- Promotion rows remain lower priority than assignment, Candidate Task, and issue detail rows.

## Parallel Opportunities

- T004-T007 can be implemented by file once type names are stable.
- T018-T019 can proceed after `CandidatePromotionReviewCollection` shape is stable.

## Implementation Strategy

Implement pure types and eligibility first; then local decision transitions; then controller state/input; then dashboard display.
