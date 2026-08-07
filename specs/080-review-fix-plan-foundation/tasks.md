# Tasks: Review Fix Plan Foundation

**Input**: Design documents from `specs/080-review-fix-plan-foundation/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

## Phase 1: Setup

- [x] T001 Confirm feature worktree and branch are isolated for Spec 080.
- [x] T002 [P] Create Review Fix Plan domain directory in `src/features/city-view/scene/office/review-fix-plans/`.

## Phase 2: Foundational

- [x] T003 Add Review Fix Plan types, deterministic IDs, defensive-copy helpers, and collections in `src/features/city-view/scene/office/review-fix-plans/ReviewFixPlanTypes.ts`.
- [x] T004 Add Review Fix Plan service with Review Fix Request revalidation, actor validation, exact-context binding, idempotency, and blocked results in `src/features/city-view/scene/office/review-fix-plans/ReviewFixPlanService.ts`.
- [x] T005 Add Review Fix Plan dashboard formatter in `src/features/city-view/scene/office/review-fix-plans/ReviewFixPlanView.ts`.
- [x] T006 Add per-project Review Fix Plan state maps to `src/features/city-view/scene/office/OfficeProjectPortalTypes.ts` and initialize them in `src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts`.

## Phase 3: User Story 1 - Plan requested review fixes (Priority: P1)

**Goal**: Explicit human action creates one immutable Review Fix Plan for a current Review Fix Request.

**Independent Test**: Start from a current `ChangesRequested` review and Review Fix Request, invoke only `Plan review fixes`, and verify one plan/result with all execution and mutation flags false.

- [x] T007 [P] [US1] Add Review Fix Plan type tests in `src/features/city-view/scene/office/review-fix-plans/ReviewFixPlanTypes.test.ts`.
- [x] T008 [P] [US1] Add successful plan service tests in `src/features/city-view/scene/office/review-fix-plans/ReviewFixPlanService.test.ts`.
- [x] T009 [US1] Integrate explicit plan input into `src/features/city-view/scene/office/OfficeActionInputController.ts`.
- [x] T010 [US1] Integrate Review Fix Plan command handling into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`.
- [x] T011 [US1] Render Review Fix Plan rows from `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [x] T012 [US1] Add controller/input tests proving request and plan require separate input events.

## Phase 4: User Story 2 - Block stale or unsafe fix plans (Priority: P1)

**Goal**: Stale, unsafe, non-human, or non-current contexts block without source mutation.

**Independent Test**: Mutate an upstream request/chain field after a Review Fix Request and verify planning blocks with no new plan.

- [x] T013 [P] [US2] Add service tests for stale request, missing request, non-human actor, non-requestable review decision, and project isolation.
- [x] T014 [US2] Add controller tests proving stale request revalidation blocks before any duplicate plan is created.
- [x] T015 [US2] Add dashboard tests for blocked and unavailable Review Fix Plan states.

## Phase 5: User Story 3 - Repeat planning idempotently (Priority: P2)

**Goal**: Repeated planning is deterministic, duplicate-safe, and stale repeats do not incorrectly return `AlreadyPlanned`.

**Independent Test**: Invoke planning twice for identical current context, then mutate context and verify repeat blocks.

- [x] T016 [P] [US3] Add service idempotency, exact-context, and defensive-copy tests.
- [x] T017 [US3] Add dashboard test for a current planned state with bounded wording and no execution claims.

## Phase 6: Polish & Validation

- [x] T018 Update Spec Kit docs and task checklist with implementation evidence.
- [x] T019 Run focused tests for Review Fix Plan, input, controller, and view behavior.
- [x] T020 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.
- [ ] T021 Commit the complete local implementation.
- [ ] T022 Run independent Claude review against exact committed HEAD.
- [ ] T023 Fix all blocking review findings, revalidate, recommit, and re-review until Approved.
- [ ] T024 Verify exact-HEAD gate: approved review SHA, validated SHA, and current HEAD are identical with clean working tree.

## Dependencies & Execution Order

- Phase 1 precedes all product edits.
- Phase 2 types/service/view/state precede controller and dashboard integration.
- US1 is the MVP and establishes the plan path.
- US2 and US3 build on the same service and controller path.
- Validation and review happen after all tasks are completed.

## Parallel Opportunities

- T002, T007, T008, T013, and T016 touch separate files and may be implemented in parallel after their prerequisites.
- Dashboard tests and controller tests must follow the related implementation files.

## Implementation Strategy

1. Build the domain types and service first.
2. Add focused tests around exact-context binding and safety flags.
3. Wire input/controller/state/dashboard.
4. Run focused validation.
5. Run full validation and independent review.

## Validation Evidence

- Focused validation: `npm test -- ReviewFixPlan OfficeActionInputController OfficeProjectPortalController.review-decision` -> 5 files / 33 tests passed.
- Full validation: `npm test` -> 127 files / 1741 tests passed.
- TypeScript validation: `npx tsc --noEmit` passed.
- Build validation: `npm run build` passed.
- Diff checks: `git diff --check` and `git diff --cached --check` passed.
