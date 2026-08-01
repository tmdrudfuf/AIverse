# Tasks: Review Decision Human Promotion Gate

**Input**: Design documents from `specs/077-review-decision-human-promotion-gate/`
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/, research.md, quickstart.md

None of the tasks below have been executed. This file is a planning artifact only; implementation has not begun.

## Phase 1: Investigation & Domain Model

- [ ] T001 Re-read `ReviewerRuntimeService.validateContext` (`src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.ts`) end to end and confirm which exact upstream validation functions can be reused as-is by `ReviewDecisionService` without duplication.
- [ ] T002 Create `src/features/city-view/scene/office/review-decision/ReviewDecisionTypes.ts` with `ReviewDecisionState`, `ReviewPromotionReasonCode`, `ReviewPromotionRequest`, `ReviewPromotion`, `ReviewPromotionResult`, `ReviewPromotionCollection`, `ReviewPromotionResultCollection`, per data-model.md.
- [ ] T003 [P] Write `ReviewDecisionTypes.test.ts` covering deterministic id construction and literal-type invariants (`validationStarted`/`repositoryMutationStarted`/`githubMutationStarted` always `false`).

## Phase 2: Review Decision Service

- [ ] T004 Implement `ReviewDecisionService.classify(projectId, planId)` per `contracts/review-decision-contract.md`, reusing `ReviewerRuntimeService.validateContext`'s chain-revalidation functions.
- [ ] T005 Implement `ReviewDecisionService.promote(request)` per `contracts/human-promotion-contract.md`, including the deterministic-id idempotency short-circuit (Decision 5).
- [ ] T006 [P] Write `ReviewDecisionService.test.ts` covering every `ReviewDecisionState` value, every `ReviewPromotionReasonCode`, and the idempotent-repeat path.

## Phase 3: Controller Wiring

- [ ] T007 Add `reviewPromotionCollections`/`reviewPromotionResultCollections` to `OfficeProjectPortalTypes.ts`'s `ProjectPortalState`.
- [ ] T008 Wire `ReviewDecisionService` into `OfficeProjectPortalController.ts` (construction, project-scoped read/write of the two new collections).
- [ ] T009 Extend `clearRuntimePreflightForProject` to also delete the two new collections on upstream invalidation, per plan.md's "State and Storage."

## Phase 4: Explicit Human Promotion Input

- [ ] T010 Add `promoteReviewPressed: boolean` to the controller's input type and `PROMOTE_REVIEW_KEY_CODE = "KeyP"` to `OfficeActionInputController.ts`, with a code comment stating why it must never share a keypress with any existing action (matching the `START_IMPLEMENTER_KEY_CODE`/`START_REVIEWER_KEY_CODE` precedent).
- [ ] T011 Wire the Promote input through to `ReviewDecisionService.promote`, using the same `"Local Human"` actor constant every prior stage uses.

## Phase 5: Stale-Chain & Idempotency Behavior

- [ ] T012 Implement and test the `Stale` classification path: individually invalidate plan, readiness, approval, preflight, Runtime Start, Implementer Runtime, and role binding, and verify each yields `Stale` and blocks Promote.
- [ ] T013 Implement and test the idempotent double-Promote path: verify a second Promote for an already-Promoted Reviewer Runtime returns the same record, creates no duplicate, and invokes nothing.
- [ ] T014 Implement and test that a Review Promotion, once recorded, remains immutable and readable even after a later, unrelated upstream invalidation clears the *current* classification — while the historical record is not shown as currently applicable (per spec.md Edge Cases).

## Phase 6: Dashboard

- [ ] T015 Add the `[REVIEW DECISION]` row to `OfficeProjectPortalView.ts` per plan.md's "Dashboard Strategy," covering unavailable, ready-not-approved, approved-not-yet-promoted, blocked, stale, and promoted wording.
- [ ] T016 [P] Write/extend `OfficeProjectPortalView.test.ts` proving no row ever pairs with "Merged," "Pushed," "PR Created," "Validation Passed," or "Repository Mutated" wording, and extend the existing full-layout containment test to include `[REVIEW DECISION]`.

## Phase 7: Targeted Tests (cross-cutting)

- [ ] T017 Controller-level test file `OfficeProjectPortalController.review-decision.test.ts` covering the full User Story 1–3 acceptance scenarios end to end through the controller.
- [ ] T018 Run targeted validation (`npx vitest run` on every file touched above, `npx tsc --noEmit` on touched files) after each of Phases 1–6 — not a full suite run per phase, per `docs/agent-workflow/token-efficient-review-policy.md`.

## Phase 8: Documentation

- [ ] T019 Update this `tasks.md` file's checkboxes as work completes (no other spec file requires mid-implementation edits unless empirical implementation reveals a plan.md correction, in which case document it in plan.md directly, matching Spec 076's precedent).

## Phase 9: Final Validation

- [ ] T020 Run the full validation gate once: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check` — all passing before the implementation commit.

## Phase 10: Independent Review

- [ ] T021 Commit the complete implementation locally, then run up to three independent Reviewer rounds via `tools/agent-workflow/cli.js run-review`, per `docs/agent-workflow/token-efficient-review-policy.md`'s round cap. Fix genuine feature-local findings and re-review; reject repository-wide-generalization findings with documented precedent-comparison rationale in `review.md`, using Spec 076's `review.md` as the structural precedent. Do not exceed three rounds unless a round produces a genuine new fix that itself requires one re-review round, per the policy's "additional rounds" exception.

## Phase 11: Final Local Report

- [ ] T022 Deliver a Final Report per `docs/agent-workflow/token-efficient-review-policy.md`'s "Final Report" structure: status, implementation summary, review history summary, outstanding items, final commit SHA with clean working tree confirmation, and next step — explicitly noting that push, PR creation, marking ready, and merge are human-gated follow-up actions **not** performed as part of this task list.

## Human-Gated Follow-Up Actions (not executable tasks)

The following are explicitly out of this task list's scope and require separate, explicit human authorization when the time comes:

- `git push` of the feature branch.
- Pull request creation.
- Marking a pull request ready for review.
- Merge.
- Remote branch deletion or any other remote GitHub mutation.

## Dependencies & Execution Order

- Phase 1 blocks all others (domain types must exist before the service, controller, or tests can reference them).
- Phase 2 blocks Phases 3–6 (controller/input/dashboard all depend on `ReviewDecisionService`'s public shape).
- Phases 3 and 4 can proceed in parallel once Phase 2 is complete; Phase 6 depends on Phase 3 (state must exist before the dashboard can read it).
- Phase 5 depends on Phases 2–4 being wired together (it tests the integrated behavior, not the service in isolation).
- Phase 7 runs continuously alongside Phases 1–6, not only at the end.
- Phases 8–11 run in strict order after Phases 1–7 are complete.

## Parallel Opportunities

- T003, T006, T016 (marked `[P]`) can each be written alongside their corresponding implementation task rather than strictly after it, since the contracts they test are already fully specified in `contracts/`.

## Implementation Strategy

Follow Spec 076's empirically-validated shape: implement the smallest correct version of each phase, run targeted tests immediately, and defer the one full validation pass to Phase 9 — never re-running the full suite after every small edit, per the token-efficient policy's "Validation Strategy."
