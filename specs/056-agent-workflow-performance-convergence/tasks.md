# Tasks: Agent Workflow Performance and Review Convergence

**Input**: Design documents from `specs/056-agent-workflow-performance-convergence/`

**Tests**: Vitest tests are included per task, matching this repository's existing convention of colocated `*.test.ts` files.

## Phase 0: Baseline (blocking, before any implementation)

- [X] T001 Run `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts --reporter=verbose` on clean `main`; record duration, file/test counts.
- [X] T002 Run `npm test` on clean `main`; record duration, file/test counts.
- [X] T003 Record baseline numbers and source-level bottleneck analysis in `spec.md`.
- [X] T004 Create feature branch `codex/agent-workflow-performance-convergence` from updated `main`.

## Phase 1: Spec Kit documentation (blocking, before implementation)

- [X] T005 Write `spec.md` (this feature).
- [X] T006 Write `clarifications.md` answering all 28 requested questions.
- [X] T007 Write `plan.md`.
- [X] T008 Write `tasks.md` (this file).
- [X] T009 Write `quickstart.md`.
- [X] T010 Update `.specify/feature.json` to point at this feature directory.
- [X] T011 Update the `AGENTS.md` `<!-- SPECKIT START -->` pointer block to reference `specs/056-agent-workflow-performance-convergence/plan.md`.

## Phase 2 (User Story 1 - P1): Fast local test iteration

- [X] T012 Add `gitAdapter` threading to every `collectGitContext(...)` call site in `orchestrateCommand.js` that currently omits it (`buildImplementerPrompt`, `buildAnswerPrompt`, `buildFinalReviewPrompt`, the validate/revalidate/final-verification target computation, `runReviewWithoutStateWrite`/`executeReviewStage`, `executeAnswerQuestionsStage`, `previewOrchestration`, and the `runOrchestration` loop's initial-branch/per-iteration/fix-diff/final-tree/final-summary calls), defaulting to the real adapter when omitted.
- [X] T013 [P] Create `tools/agent-workflow/testDependencies.js`: `createFakeGitAdapter(config)` implementing every `git` invocation pattern `collectGitContext` issues; `createFakeCommandRunner(sequence)` promoted from the existing test-local `createSequenceAdapter`, with success/failure/timeout/interruption simulation and spawn/kill tracking; `createFakeClock(startIso)`.
- [X] T014 [P] `testDependencies.test.ts`: fake command runner success/failure/timeout/interruption + spawn-count tracking; fake Git adapter deterministic branch/merge-base/dirty-snapshot; confirms these exports are not imported by `cli.js`.
- [X] T015 Add a lazily-created, cached, never-mutated base Git fixture helper in `orchestrateCommand.test.ts` (or a small shared test helper module) and an `fs.cpSync`-based per-test copy, replacing `initRepo`'s `git init`/config/commit sequence for the tests that still need a real repository.
- [X] T016 Convert the representative fake-adapter-eligible subset of `orchestrateCommand.test.ts` (role selection/swap, question-loop progression beyond the diff-sensitive ones, structured-review-outcome/lifecycle classification tests, run-summary shape tests) to `createFakeGitAdapter` + a plain `mkdtempSync` directory (no `initRepo`). Achieved: 58 of 81 tests converted (9 role-selection + 49 bulk-converted); 21 remain on real Git for mutate/diff-detection coverage, 2 more (role-swap fix test, legacy-target resume test) explicitly kept real for the same reason.
- [X] T017 Confirm and, where needed, re-label the retained real-Git integration subset (spec.md's "Retained real integration coverage" list) so it is unambiguous in the test file which tests are intentionally real. Also discovered and fixed a pre-existing test-discovery bug: a stray gitignored worktree under `.claude/worktrees/` was being picked up by Vitest's default file globbing, inflating/diluting measured counts and durations (`vitest.config.ts` added to exclude it).
- [X] T018 Re-run `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts --reporter=verbose` and `npm test`; record after-numbers, percentage improvement, and before/after test counts in `spec.md`/final report. Result: 152.03s/81 tests (63.6% reduction from 417.73s baseline, target <120s not fully met — see spec.md's "Part A results" for the honest remaining-bottleneck explanation); full suite 162.40s/670 tests/43 files (60.0% reduction from 406.47s/654 tests/42 files, target <180s met).

## Phase 3 (User Story 2 - P1): Comprehensive first-pass review

- [X] T019 [P] Create `tools/agent-workflow/reviewCoverage.js`: `buildChangedFileInventory(gitContext)`, `classifyHighRisk(filePath, stats)`, `validateReviewCoverage(reviewCoverage, inventory)`, `computeReviewCompleteness({ structuredAnalysis, reviewCoverage, inventory, timedOut, executionFailed })` → `complete`/`incomplete`/`invalid`.
- [X] T020 [P] `reviewCoverage.test.ts` covering inventory construction, high-risk classification, coverage validation, and all completeness classification branches.
- [X] T021 Extend `structuredReview.js`'s validated shape to additively accept `reviewCoverage` on the structured review object. Revised during implementation: absence of `reviewCoverage` (or of any structured review at all) is treated as `complete`, not merely "coverage-unverified" -- see clarifications.md Q7 for why (44/81 tests broke under the stricter interpretation).
- [X] T022 Update `templates/independent-review.md` and `templates/orchestrate-final-review.md` with: comprehensive-first-pass instruction, related-pattern-search instruction, the workflow checklist, the changed-file inventory, and the `reviewCoverage` output contract.
- [X] T023 Wire the deterministic inventory into `buildIndependentReviewPrompt`/`buildFinalReviewPrompt` (via `reviewCommand.js`/`orchestrateCommand.js`).

## Phase 4 (User Story 3 - P1): Persistent convergence-tracked finding ledger

- [X] T024 [P] Create `tools/agent-workflow/reviewConvergence.js`: `classifyFindingsForAttempt(currentFindings, findingHistory, currentAttemptNumber)` → new/previously-known/reopened; `updateConvergenceMetrics(...)` (first-review blocking count, new-after-first count, reopened count, resolved-verified count); `buildFindingLedger(findingHistory, reopenedCounts)`; `computeConvergenceStatus({ latestReviewOutcome, latestCompletenessStatus, activeBlockingFindingsCount, exactTargetMatch, budgetExhausted, hasAnyReviewAttempt })`. "Related expansion" is documented as a prompting concept only (clarifications Q11), not a machine-checkable classification.
- [X] T025 [P] `reviewConvergence.test.ts` covering new/known/reopened classification, P3 non-blocking exclusion, high-risk-category forced-blocking override, and all convergence statuses.
- [X] T026 Integrate `reviewConvergence.js` into `orchestrateCommand.js`'s review-outcome handling (alongside existing `applyFindingLifecycle`), and into `runSummary.js` so both read the same computed status.

## Phase 5 (User Story 4 - P2): Safe review and fix-cycle budgets

- [X] T027 [P] Create `tools/agent-workflow/reviewBudget.js`: `resolveReviewBudget({ cliOverrides, state })` with documented precedence over `--max-fix-cycles`; `isBudgetExhausted(usage, budget)`; `buildExhaustionReport(usage, budget, options)`.
- [X] T028 [P] `reviewBudget.test.ts` covering default resolution, CLI/state precedence, each ceiling's enforcement, exhaustion report shape, and "never silently raises its own budget."
- [X] T029 Integrate `reviewBudget.js` into `runOrchestration`'s review/fix loop: stop with `stopReason: "review-convergence-failed"` on exhaustion, never mark the human gate, preserve findings, remain resumable. New checks are ordered strictly after every pre-existing check so default-configuration behavior/messages are unchanged.
- [X] T030 Add CLI flags for `reviewBudget` overrides in `cli.js`; document precedence against `--max-fix-cycles` in `README.md`.

## Phase 6 (User Story 5 - P3): Performance and convergence telemetry

- [X] T031 [P] Create `tools/agent-workflow/performanceMetrics.js`: prompt-size measurement, validation-phase duration summarization (reusing Spec 055's phase split via `validationPhase.js`), review-duration summarization.
- [X] T032 [P] `performanceMetrics.test.ts`.
- [X] T033 Extend `runSummary.js`/`runSummaryRenderer.js` with additive `performance`/`reviewConvergence` sections; extend `runSummaryRenderer.test.ts` for the new Markdown sections.
- [X] T034 Add compatibility tests confirming an old (pre-Spec-056) `run-summary.json`/state file remains readable and reports `reviewConvergence.status: "not-started"` rather than a fabricated value.

## Phase 7: Smoke tests

- [X] T035 Smoke A: two-review convergence (3 blockers → 1 fix cycle → Approved with complete coverage).
- [X] T036 Smoke B: Reviewer reports incomplete coverage; incomplete-review budget consumed; findings preserved.
- [X] T037 Smoke C: new late finding after first review; convergence not reached; second fix cycle + third review required.
- [X] T038 Smoke D: review-attempt budget exhaustion; stable stop reason; no remote mutation.
- [X] T039 Smoke E: Approved with one P3 note and complete coverage converges without an extra cycle.
- [X] T040 Smoke F: test-harness performance before/after comparison, reported in the final report (spec.md's "Part A results" section).
- [X] T041 Smoke G: resume after Review 1 + consolidated fix preparation preserves ledger/budget/convergence state.
- [X] T042 Smoke H: dry-run previews inventory/high-risk files/budget usage/open findings/next action with zero spawn/validation/state-write/artifact-write/remote-mutation.

## Phase 8: Documentation and final validation

- [X] T043 Update `tools/agent-workflow/README.md` per spec.md's documentation list, with PowerShell examples.
- [X] T044 Run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`; record results.
- [ ] T045 Request an independent Codex review under the new comprehensive-review protocol; iterate via consolidated fix cycles until `Approved` with zero open blocking findings and exact-head match.
- [ ] T046 Create the final local commit (no push, no PR, no merge, no remote branch mutation).
