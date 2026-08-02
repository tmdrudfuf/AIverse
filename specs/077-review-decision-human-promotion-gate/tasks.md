# Tasks: Review Decision Human Promotion Gate

**Input**: Design documents from `specs/077-review-decision-human-promotion-gate/`
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/, research.md, quickstart.md

Phases 1 and 2 are complete. Remaining phases have not been executed.

## Phase 1: Investigation & Domain Model

- [x] T001 Re-read `ReviewerRuntimeService.validateContext` (`src/features/city-view/scene/office/reviewer-runtime/ReviewerRuntimeService.ts`) end to end and confirm which exact upstream validation functions can be reused as-is by `ReviewDecisionService` without duplication. Finding: none — the repository's established convention duplicates per-stage validation rather than importing a sibling's private functions (`ImplementerRuntimeService.validateContext` and `ReviewerRuntimeService.validateContext` are already independent copies). `ReviewDecisionService` follows that same convention with its own private `validateChain`; see plan.md's corrected "Chain Revalidation" section.
- [x] T002 Create `src/features/city-view/scene/office/review-decision/ReviewDecisionTypes.ts` with `ReviewDecisionState`, `ReviewPromotionReasonCode`, `ReviewPromotionRequest`, `ReviewPromotion`, `ReviewPromotionResult`, `ReviewPromotionCollection`, `ReviewPromotionResultCollection`, per data-model.md.
- [x] T003 [P] Write `ReviewDecisionTypes.test.ts` covering deterministic id construction and literal-type invariants (`validationStarted`/`repositoryMutationStarted`/`githubMutationStarted` always `false`).

## Phase 2: Review Decision Service

- [x] T004 Implement `ReviewDecisionService.classify(input)` per `contracts/review-decision-contract.md`, via its own private `validateChain` (mirroring, not importing, `ReviewerRuntimeService.validateContext`'s chain-revalidation logic — see T001 finding).
- [x] T005 Implement `ReviewDecisionService.promote(input, request)` per `contracts/human-promotion-contract.md`, including the deterministic-id idempotency short-circuit (Decision 5).
- [x] T006 [P] Write `ReviewDecisionService.test.ts` covering every `ReviewDecisionState` value, every `ReviewPromotionReasonCode` reachable from `promote`, and the idempotent-repeat path.

## Phase 3: Controller Wiring

- [x] T007 Add `reviewPromotionCollections`/`reviewPromotionResultCollections` to `OfficeProjectPortalTypes.ts`'s `ProjectPortalState`.
- [x] T008 Wire `ReviewDecisionService` into `OfficeProjectPortalController.ts` (construction, project-scoped read/write of the two new collections). See `promoteReviewForPromotion`.
- [x] T009 Correction made during implementation: per FR-011 (spec.md), `clearRuntimePreflightForProject` must NOT delete the two new collections — a recorded Review Promotion is an immutable historical record that must survive upstream invalidation; staleness is shown via the dashboard row comparing the promotion's `reviewerRuntimeId` against the current latest Reviewer Runtime result instead. Everything else upstream of it (readiness/approval/preflight/start/implementer/reviewer runtime) is still deleted as before.

## Phase 4: Explicit Human Promotion Input

- [x] T010 Add `promoteReviewPressed: boolean` to the controller's input type and `PROMOTE_REVIEW_KEY_CODE = "KeyP"` to `OfficeActionInputController.ts`, with a code comment stating why it must never share a keypress with any existing action (matching the `START_IMPLEMENTER_KEY_CODE`/`START_REVIEWER_KEY_CODE` precedent).
- [x] T011 Wire the Promote input through to `ReviewDecisionService.promote`, using the same `"Local Human"` actor constant every prior stage uses. See `updateProjectDashboardInput`'s `promoteReviewPressed` branch.

## Phase 5: Stale-Chain & Idempotency Behavior

- [x] T012 Implement and test the `Stale` classification path: individually invalidate plan, readiness, approval, preflight, Runtime Start, Implementer Runtime, and role binding, and verify each yields `Stale` and blocks Promote. Per-stage coverage of `validateChain`'s individual branches is at `ReviewDecisionService.test.ts` (service level, every stage); controller-level coverage (`OfficeProjectPortalController.review-decision.test.ts`, "blocks Promote and records no Review Promotion when the chain has gone Stale before Promote is pressed") proves the same drift blocks Promote through the real controller wiring and surfaces the generic `REVIEW_PROMOTION_REVIEWER_STALE` reason code, per `contracts/human-promotion-contract.md` precondition 2 (any Stale classification collapses to that one reason code, not a per-stage-specific one — confirmed by reading the contract before writing the assertion).
- [x] T013 Implement and test the idempotent double-Promote path: verify a second Promote for an already-Promoted Reviewer Runtime returns the same record, creates no duplicate, and invokes nothing. Covered at `ReviewDecisionService.test.ts` and at the controller level (`OfficeProjectPortalController.review-decision.test.ts`, "is idempotent..."). Correction made while writing the controller test: the `ReviewPromotionResult`'s own id is also deterministic (`projectId` + `reviewerRuntimeId`), so a second Promote overwrites the same result record via `upsertResult` rather than appending a second one — the result collection stays at length 1, not 2.
- [x] T014 Implement and test that a Review Promotion, once recorded, remains immutable and readable even after a later, unrelated upstream invalidation clears the *current* classification — while the historical record is not shown as currently applicable (per spec.md Edge Cases). Covered at the controller level (`OfficeProjectPortalController.review-decision.test.ts`, "keeps a previously recorded Review Promotion after a later, unrelated upstream invalidation clears the current Reviewer Runtime chain"): a stale-branch invalidation deletes `reviewerRuntimeCollections`/`reviewerRuntimeResultCollections` as before, while `reviewPromotionCollections` is left untouched. The "not shown as currently applicable" display side is covered separately by `ReviewDecisionView.test.ts`.

## Phase 6: Dashboard

- [x] T015 Add the `[REVIEW DECISION]` row to `OfficeProjectPortalView.ts` per plan.md's "Dashboard Strategy," covering unavailable, ready-not-approved, approved-not-yet-promoted, blocked, stale, and promoted wording. Correction made during implementation: the row is gated on `reviewerRuntimeResultCollection || reviewPromotionCollection` existing (matching the majority Execution Plan/Readiness/Approval/Preflight/Start pattern), not unconditionally computed like Implementer/Reviewer Runtime — it is one step further downstream of the already-always-visible Reviewer Runtime row, which already reports "unavailable" until a result exists, so an unconditional second "unavailable" row would be redundant and also broke several pre-existing fixed-height dashboard layout tests. Correction from round-1 independent review (P1-001, fixed in `d9f04f2`): `createReviewDecisionDisplayRows` (`ReviewDecisionView.ts`) takes a `ReviewDecisionClassification` (computed fresh per render via `ReviewDecisionService.classify`/`resolveReviewDecisionInput`, shared with the Promote precondition) + `ReviewPromotionCollection`, not a raw `ReviewerRuntimeResultCollection` — the original approach of trusting a leftover Reviewer Runtime result without revalidating the chain could show a confident "Approved" row on a chain that was actually Stale. The one case classification alone doesn't cover is a Review Promotion whose chain has since changed; that's detected by comparing the promotion's `reviewerRuntimeId` against the current classification.
- [x] T016 [P] Write/extend `OfficeProjectPortalView.test.ts` proving no row ever pairs with "Merged," "Pushed," "PR Created," "Validation Passed," or "Repository Mutated" wording (new `ReviewDecisionView.test.ts`), and add `reviewDecisionRows` to `createProjectDashboardLowerRows`'s dropPriority-17 slot (immediately below Reviewer Runtime's 16, per FR-013).

## Phase 7: Targeted Tests (cross-cutting)

- [x] T017 Controller-level test file `OfficeProjectPortalController.review-decision.test.ts` covering the full User Story 1–3 acceptance scenarios end to end through the controller: base happy-path Promote (US1/US2), idempotent double-Promote (US2), Stale-blocks-Promote (US3), and historical-promotion-survives-invalidation (US3/Edge Cases). Reuses `driveDailyProofToRuntimeStart` from the shared `testHelpers.ts`; duplicates its own `driveDailyProofToApprovedReviewer`/`createImplementerOutcomeForPlan`/`createReviewerOutcomeForRuntime` fixtures rather than importing the sibling `reviewer-runtime.test.ts` file's private ones, per the established per-test-file fixture-duplication convention. Added `reviewPromotionCollections`/`reviewPromotionResultCollections` to the shared `ControllerInternals` type in `testHelpers.ts` since no prior test file needed to read those two fields.
- [x] T018 Ran targeted validation (`npx vitest run` on every file touched, `npx tsc --noEmit`) after each of Phases 1–7 — not a full suite run per phase, per `docs/agent-workflow/token-efficient-review-policy.md`. All targeted runs passed; `tsc --noEmit` clean.

## Phase 8: Documentation

- [x] T019 Updated this `tasks.md` file's checkboxes as work completed. plan.md received one mid-implementation correction (T009's FR-011 immutability finding); documented there directly, matching Spec 076's precedent.

## Phase 9: Final Validation

- [x] T020 Ran the full validation gate once in the `AIverse-spec-077` worktree: `npx tsc --noEmit` (clean), `npx vitest run` (119 test files, 1448 tests, all passed), `npm run build` (succeeded), `git status --short` (confirmed only the expected new/modified files), `git diff --cached --check` (no whitespace errors) — all passing before the implementation commit.

## Phase 10: Independent Review

- [x] T021 Commit the complete implementation locally, then run independent Reviewer rounds via `tools/agent-workflow/cli.js run-review`, per `docs/agent-workflow/token-efficient-review-policy.md`'s round cap. Fix genuine feature-local findings and re-review; reject repository-wide-generalization findings with documented precedent-comparison rationale in `review.md`, using Spec 076's `review.md` as the structural precedent. Rounds 1-2 run: round 1 (`d3a092c`) returned Changes Requested (1 P1 blocking, 2 non-blocking); P1-001 and P2-001 fixed in `d9f04f2`, P3-001 accepted as residual risk. Round 2 (`d9f04f2`) returned Approved with no new blocking findings.

  Rounds 3-4 run against `24b8c28` (a later docs-only commit) to satisfy the project's exact-HEAD provenance rule, this time with Codex CLI as an independent Reviewer (rounds 1-2 used Claude CLI as Reviewer). Both rounds returned Changes Requested, independently reproducing the same P1-001 (missing `reviewerRuntimeResult` status/decision parity check in `validateChain`) and the same P3-001 (stale contract text). Fixed in the commit following `24b8c28` — see `review.md`'s rounds 3-4 section for the fix rationale and reachability trace. Round 5 pending against the new HEAD. See `review.md`.

## Phase 11: Final Local Report

- [x] T022 Deliver a Final Report per `docs/agent-workflow/token-efficient-review-policy.md`'s "Final Report" structure: status, implementation summary, review history summary, outstanding items, final commit SHA with clean working tree confirmation, and next step — explicitly noting that push, PR creation, marking ready, and merge are human-gated follow-up actions **not** performed as part of this task list.

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
