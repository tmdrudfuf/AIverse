# Tasks: Human Execution Approval Foundation

## Phase 1: Setup

- [x] T001 Create Spec 072 documentation in `specs/072-human-execution-approval-foundation/`
- [x] T002 Update Spec Kit pointers in `.specify/feature.json` and `AGENTS.md`

## Phase 2: Foundation

- [x] T003 [P] Add Human Execution Approval domain types in `src/features/city-view/scene/office/human-execution-approvals/HumanExecutionApprovalTypes.ts`
- [x] T004 [P] Add approval service in `src/features/city-view/scene/office/human-execution-approvals/HumanExecutionApprovalService.ts`
- [x] T005 [P] Add dashboard row formatter in `src/features/city-view/scene/office/human-execution-approvals/HumanExecutionApprovalView.ts`

## Phase 3: Explicit Approval Flow

- [x] T006 [P] Add approval domain tests in `src/features/city-view/scene/office/human-execution-approvals/`
- [x] T007 Wire approval state and service into `src/features/city-view/scene/office/OfficeProjectPortalController.ts`
- [x] T008 Add controller tests for explicit input, revalidation order, idempotency, and no source mutation in `src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`

## Phase 4: Dashboard

- [x] T009 Wire approval rows into `src/features/city-view/scene/office/OfficeProjectPortalView.ts`
- [x] T010 Add dashboard wording and layout tests in `src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`

## Phase 5: Validation and Review

- [x] T011 Run focused approval tests and record exact file/test counts
- [x] T012 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [ ] T013 Commit the complete local implementation
- [ ] T014 Run independent Claude review against exact HEAD
- [ ] T015 Fix blocking findings, rerun validation, and repeat review until Approved
- [ ] T016 Complete the exact-HEAD provenance gate

## Dependencies

T001-T002 precede implementation. T003-T005 precede controller and dashboard integration. T006, T008, and T010 validate the feature before full validation and review.
