# Tasks: Spec 086

**Input**: Design documents from `/specs/086-approved-re-review-promotion-execution-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 086 artifact state.
- [X] T002 Create Spec 086 Spec Kit artifacts for approved re-review promotion execution.

## Phase 2: User Story 1 - Execute Approved Re-Review Promotion (Priority: P1)

**Goal**: Explicit Promote after an Approved post-validation re-review records the final promotion and result for the fresh reviewer runtime without starting downstream execution.

**Independent Test**: Complete an Approved post-validation re-review, press Promote, verify the promotion and result target the post-validation reviewer runtime/target, repeat Promote, and verify idempotency plus unchanged downstream execution counts.

- [X] T003 [US1] Add controller regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts`.
- [X] T004 [US1] Make minimal production updates if the regression exposes a gap in `src/features/city-view/scene/office/OfficeProjectPortalController.ts` or `src/features/city-view/scene/office/review-decision/ReviewDecisionService.ts`. Existing production wiring satisfies the behavior after inspection; no production edits required.

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

Complete the single P1 regression first. If the existing promotion path passes by inspection, leave production code unchanged and defer validation to the external ADOS runtime.
