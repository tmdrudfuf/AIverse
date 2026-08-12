# Tasks: Spec 087

**Input**: Design documents from `/specs/087-promotion-history-timeline-foundation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

## Phase 1: Setup

- [X] T001 Verify feature worktree, branch, base SHA, and missing Spec 087 artifact state.
- [X] T002 Create Spec 087 Spec Kit artifacts for promotion history and timeline foundation.

## Phase 2: Foundational

- [X] T003 Verify ignore/config baseline for the Node/TypeScript project in `.gitignore`.

## Phase 3: User Story 1 - Inspect Promotion History (Priority: P1)

**Goal**: Operators can see current and historical Review Promotion activity without changing promotion execution behavior.

**Independent Test**: Create historical/current/idempotent/blocked promotion states and verify the derived history and dashboard row distinguish them.

- [X] T004 [US1] Add promotion timeline types and derivation helpers in `src/features/city-view/scene/office/review-decision/ReviewDecisionTypes.ts`.
- [X] T005 [US1] Add compact promotion timeline display rows in `src/features/city-view/scene/office/review-decision/ReviewPromotionTimelineView.ts`.
- [X] T006 [US1] Render the promotion timeline summary in `src/features/city-view/scene/office/OfficeProjectPortalView.ts`.
- [X] T007 [US1] Add focused regression coverage in `src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts`.

## Phase 4: Validation and Handoff

- [ ] T008 Run focused validation outside this runtime per ADOS handoff policy.
- [ ] T009 Run full ADOS validation outside this runtime per handoff policy.
- [ ] T010 Commit, review, publish, merge, deploy, or remote operations outside this runtime only.

## Dependencies & Execution Order

- T001-T003 before T004.
- T004 before T005.
- T005 before T006.
- T007 after T004-T006.
- T008-T010 remain intentionally unchecked in this runtime.

## Implementation Strategy

Complete the single P1 foundation first: derive timeline events, render the compact dashboard row, and cover the behavior without running validation in this runtime.
