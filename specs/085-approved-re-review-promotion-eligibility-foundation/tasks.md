# Tasks: Spec 085

**Input**: Design documents from `/specs/085-approved-re-review-promotion-eligibility-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 085 artifact state.
- [X] T002 Create Spec 085 Spec Kit artifacts for approved re-review promotion eligibility.

## Phase 2: User Story 1 - Promote Approved Re-Review (Priority: P1)

**Goal**: Approved post-validation re-review is eligible for explicit Promote and is not treated as already promoted by historical records.

**Independent Test**: Complete an Approved post-validation re-review with a historical promotion in state, verify the current display offers Promote, then press Promote and verify the new promotion targets the post-validation reviewer runtime and review target.

- [X] T003 [US1] Add controller regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts`.
- [X] T004 [US1] Make minimal Review Decision/controller/view updates if the regression exposes a gap in `src/features/city-view/scene/office/review-decision/ReviewDecisionService.ts`, `src/features/city-view/scene/office/review-decision/ReviewDecisionView.ts`, `src/features/city-view/scene/office/OfficeProjectPortalController.ts`, or `src/features/city-view/scene/office/OfficeProjectPortalView.ts`. Existing shared resolver and controller wiring already satisfy the behavior after inspection; no production edits required.

## Phase 3: Validation and Handoff

- [ ] T005 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T006 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T007 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001 before T002.
- T002 before T003.
- T003 before T004.
- T005-T007 remain intentionally unchecked in this runtime.

## Implementation Strategy

Complete the single P1 regression first. If the existing shared resolver passes the intended behavior by inspection, record that no production code change was needed and leave validation for the external ADOS runtime.
