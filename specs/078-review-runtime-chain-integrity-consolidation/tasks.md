# Tasks: Review Runtime Chain Integrity Consolidation

**Input**: Design documents from `specs/078-review-runtime-chain-integrity-consolidation/`
**Prerequisites**: spec.md, plan.md, data-model.md, contracts/, quickstart.md

## Phase 1: Audit

- [x] T001 Audit every chain record type (Execution Plan through Reviewer Runtime Result) reachable from `ReviewDecisionService.validateChain`'s `ReviewDecisionInput`, re-grepping each creation service directly in this worktree rather than trusting prior investigation, to find every canonical `create*Id` helper / `*_RULES_VERSION` constant already in use at creation time but not yet recomputed/checked at validation time. Recorded in `.agent-workflow/spec-078-chain-integrity-audit.md`: twelve stages inspected, nine identity/rules-version gaps found across seven stages (Execution Readiness, Human Execution Approval, Implementer Runtime, Implementer Runtime Result, Review Target, Reviewer Runtime, Reviewer Runtime Result), two stages (Execution Plan, Runtime Preflight/Runtime Start) already had theirs, no gap requiring a new helper or constant to be invented.

## Phase 2: Shared Validator Extraction

- [x] T002 Create `src/features/city-view/scene/office/review-decision/ReviewRuntimeChainIntegrityService.ts`, extracting `ReviewDecisionService`'s private `validateChain` into a standalone exported `validateReviewRuntimeChainIntegrity(input: ReviewDecisionInput)`, plus the sibling `getActorBlockReason` export (plan.md Decision 3), preserving the existing per-stage `??`-chained structure and every pre-existing check verbatim.
- [x] T003 Close all nine audited gaps in place, one per stage: recompute each record's id via its own canonical `create*Id` helper and check its `rulesVersion` against its own canonical constant, reusing that stage's existing `REVIEW_PROMOTION_*` reason code (no new reason code introduced) — per data-model.md's per-stage table.
- [x] T004 Update `ReviewDecisionService.ts` to import and call `validateReviewRuntimeChainIntegrity` (and `getActorBlockReason`) from the new module instead of its own private copy; confirm no second, independently-maintained list of chain-record checks remains in this file (FR-001/SC-004).

## Phase 3: Fixture Corrections

- [x] T005 Correct `ReviewerRuntime`/`ReviewerRuntimeResult` test fixtures in `ReviewDecisionService.test.ts` and `OfficeProjectPortalController.review-decision.test.ts` that had been constructing `reviewerRuntimeId`/`id` via a formula not matching `ReviewerRuntimeService.ts`'s actual creation-site calls (`createReviewerRuntimeId(projectId, reviewTargetId)` / `createReviewerRuntimeResultId(projectId, reviewTargetId)`, both keyed by `reviewTargetId`) — confirmed by direct grep of the production creation-site call, not assumed from the type signature alone.

## Phase 4: Table-Driven Tests

- [x] T006 Write `ReviewRuntimeChainIntegrityService.test.ts` calling `validateReviewRuntimeChainIntegrity` directly (not through `ReviewDecisionService`), with `describe`/`it.each` blocks per stage covering: existence, project scope, upstream linkage, malformed own-id, unsupported/missing own-`rulesVersion`, and role-mismatch cases — 95 cases total, including two explicitly labeled as covering the reported Round-10 P1-001 Reviewer Runtime gap (malformed `reviewerRuntimeId`, unsupported `reviewerRuntimeResult.rulesVersion`), plus a baseline valid-chain-passes case and a project-isolation case.
- [x] T007 Verify by code-reading (tracing each mutated field against `ReviewRuntimeChainIntegrityService.ts`'s actual branch order) that every table case reaches its intended branch rather than short-circuiting on an earlier, unrelated check — in particular confirming the id-recompute and `rulesVersion` checks are independently reachable for Reviewer Runtime/Result (an id-recompute call using a defaulted `rulesVersion` argument, not the record's own possibly-mutated field, means a malformed-id case and an unsupported-rulesVersion case exercise two genuinely separate branches, not the same one twice).

## Phase 5: Regression & Validation

- [x] T008 Ran the full suite after the fixture corrections and new test file: `npx vitest run` → 1610/1610 tests passed across 120 test files (1515/1515 baseline + 95 new, zero regressions elsewhere).
- [x] T009 Ran `npx tsc --noEmit` → 0 errors (after fixing one literal-type test-fixture cast: `HumanExecutionApproval.executionApproved` is typed as literal `true`, requiring `as unknown as true` for an intentionally-invalid `false` test fixture).
- [x] T010 Ran `npm run build` → succeeded. Ran `git diff --check` and `git diff --cached --check` → both clean (no whitespace errors), in both the working tree and staged state.

## Phase 6: Documentation

- [x] T011 Wrote this spec's documentation set (`spec.md`, `plan.md`, `data-model.md`, `contracts/chain-integrity-contract.md`, `quickstart.md`, this file, `review.md`), reusing `.agent-workflow/spec-078-chain-integrity-audit.md` as the source of truth for the per-stage table rather than re-deriving it.
- [x] T012 Assessed whether Spec 077's own documentation (`spec.md`, `plan.md`, `review.md`, `tasks.md`, `contracts/review-decision-contract.md`) contains any claim that is now inaccurate rather than merely superseded. Conclusion: Spec 077's `validateChain` references are accurate historical snapshots of what was actually implemented and reviewed at the time — not incorrect. The one candidate for a narrow correction is `plan.md`'s closing sentence in "Chain Revalidation" ("this feature's revalidation is not required to exceed what those siblings already validate") — a forward-looking ceiling this spec's own nine-gap audit is direct evidence was insufficient. Recorded as a pointer in this spec's `review.md` rather than editing Spec 077's `plan.md` itself, preserving Spec 077's review history as a historical record per the standing instruction to never rewrite it.

## Phase 7: Independent Review

- [ ] T013 Commit the complete implementation locally in the `AIverse-spec-078` worktree, then run exactly one independent review round (Implementer = Claude CLI, Reviewer = Codex CLI) against the exact final commit HEAD. Require numeric `schemaVersion: 1`; only an explicit Approved decision with zero blocking findings satisfies the local gate. Do not auto-fix any new finding this single round surfaces — stop and report it instead.

## Phase 8: Final Local Report

- [ ] T014 Deliver a final report confirming the exact-HEAD gate (Approved-review SHA = Validated SHA = current HEAD SHA), working-tree cleanliness, and explicit confirmation that Spec 077's own branch/worktree were left untouched and that no push, PR, Ready transition, merge, branch/worktree deletion, or other remote mutation occurred.

## Human-Gated Follow-Up Actions (not executable tasks)

- `git push` of the feature branch.
- Pull request creation.
- Marking a pull request ready for review.
- Merge.
- Remote branch deletion or any other remote GitHub mutation.
