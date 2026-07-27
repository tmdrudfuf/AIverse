# Feature Specification: Agent Workflow Performance and Review Convergence

**Feature Branch**: `codex/agent-workflow-performance-convergence`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Reduce measured Spec 055 orchestration wall-clock cost by (A) making the subprocess-heavy `tools/agent-workflow` test harness fast without weakening required integration coverage, and (B/C/D) making independent review converge in fewer rounds by requiring a comprehensive first-pass review, tracking a persistent finding ledger with new/known/reopened classification, enforcing safe review/fix-cycle budgets, and recording performance/convergence telemetry in the run summary."

## Clarifications

See [clarifications.md](clarifications.md) for the full session; it answers all 28 questions posed in the feature request. Load-bearing answers are summarized inline below where a requirement depends on them.

## Baseline (measured on `main` @ `75c3297`, before any change in this feature)

- First measurement attempt: `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts` reported 386.15s / 137 tests / 2 files, and `npm test` reported 390.92s / 1136 tests / 77 files. Investigating the unexpected "2 files"/"137 tests" for a single-file invocation found a pre-existing, gitignored, harness-managed Git worktree at `.claude/worktrees/docs-spec-restore/` (unrelated to this feature, left over from a prior session) containing its own older copy of `tools/agent-workflow/*.test.ts`. Vitest's default file discovery has no Git-worktree-boundary awareness and silently picked up that copy's 56 additional tests alongside this checkout's real 81, and ran the two files concurrently, so the reported wall-clock number understated this file's true isolated cost (concurrent execution overlaps rather than adds). This is a real, generally-applicable measurement bug in this repository's test discovery, not specific to this feature, and is fixed once by `vitest.config.ts` (`test.exclude` extended with `**/.claude/**`), applied before any other measurement below.
- **Corrected baseline**, `vitest.config.ts` exclusion applied, `orchestrateCommand.js`/`orchestrateCommand.test.ts` otherwise unmodified: `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts` → **417.73s** (vitest-reported) / 418.8s wall, **81 tests, 1 file**. `npm test` (full suite) → **406.47s** / 407.5s wall, **654 tests, 42 files**.
- The standalone file accounts for ~102% of the corrected full-suite wall time in isolated (non-concurrent) measurement — consistent with it being both the slowest single file and one of several files the runner would otherwise execute concurrently with others in a full `npm test` run.
- Source-level analysis (not instrumented — see `clarifications.md` Q27 for why): every test calls a helper `initRepo(cwd)` that spawns 6 real `git` subprocesses (`init`, `symbolic-ref`, `config` ×2, `add`, `commit`). `collectGitContext()` (in `reviewCommand.js`, called from ~13 sites in `orchestrateCommand.js`, several inside the `runOrchestration` stage loop) issues up to 13 further real `git` subprocesses per call and is called multiple times per end-to-end test. Across 81 tests this plausibly accounts for the full measured duration; no other repeated expensive pattern (filesystem tree copying, real timeout waiting beyond a small, deliberate integration subset) was found at comparable scale.

## Part A results (achieved)

- `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts`: **129.5-156.5s across repeated runs** (machine-load variance; representative figure ~150s), 88/88 tests passing (81 baseline tests, all still present and green, plus 7 new Spec 056 smoke tests A/B/C/D/E/G/H — no coverage removed), down from the corrected 417.73s baseline. **~62-69% reduction depending on run.** Target (<120s) not consistently reached (one run came within 10s of it); see remaining bottleneck below.
- `npm test` (full suite, includes Parts B/C/D's new module test files too): measured at 758 tests/47 files/161.90s just before Smoke C was added, and re-confirmed green after; the one-test difference is immaterial to the percentage. Net new coverage from `testDependencies.js`, `reviewCoverage.js`, `reviewConvergence.js`, `reviewBudget.js`, `performanceMetrics.js` and their tests, plus 7 new orchestration-level smoke tests; nothing removed. Down from the corrected 406.47s baseline. **~60% reduction — target (<180s) met.**
- What changed: (1) a lazily-created, once-per-process base Git fixture copied via `fs.cpSync` per test replaces every test's own `git init`/config/commit sequence; (2) `gitAdapter` threaded through all 14 `collectGitContext` call sites in `orchestrateCommand.js`; (3) 49 of 81 tests (plus the 9 in the "runtime role selection" block converted first, several of which also matched the general pattern) converted to `createFakeGitAdapter()` with no real Git repository at all; (4) the `runOrchestration` stage loop's `validate`/`revalidate`/`final-verification` handling reuses that iteration's already-collected `gitContext` instead of issuing a second real `collectGitContext` call for the same point in time (a production-code fix, not test-only — reduces real subprocess count for every consumer, not just tests).
- **Remaining bottleneck**: the ~21 tests that must stay on a real Git repository and real diff detection (fix-cycle/no-diff detection, final-validation tree-modification, answer-stage-modified-files detection, exact-target/dirtyHash, one real timeout/interruption/BOM/resume/dry-run/unsafe-command test each) still each pay for several real `collectGitContext` calls (~13 real `git` subprocesses each) as the orchestration loop progresses through multiple stages — this is inherent to proving real diff-detection behavior, not incidental setup cost, and is exactly the coverage this feature's constraints (FR-003/FR-005) forbid removing or faking.
- **Why not fully closed**: closing the remaining ~32s gap would require reducing `collectGitContext`'s own internal `git`-plumbing call count (e.g. consolidating `rev-parse`/`status` invocations) — a legitimate future lever, deferred per `clarifications.md` Q28 because it changes behavior for every consumer of `gitContext`, including Reviewer-facing prompt content, which is a wider blast radius than this feature's "safe performance change" scope covers.
- Reviewer round durations from the Spec 055 merge (612.7s, 626.9s, 481.5s, 962.7s, 1084.8s across 5 rounds, ~62.9 min total) grew while prompt size stayed flat (23,319–23,644 bytes), confirming round *count*, not prompt size, is the lever this feature must pull for Part B/C.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Local Test Iteration (Priority: P1)

A developer running `npm test` or the standalone `orchestrateCommand.test.ts` after a small change to `tools/agent-workflow/` wants a result in roughly the time it takes to read the diff, not in over six minutes, so that focused validation (Spec 055) is actually fast in practice for this repository's own tooling, not only in the workflow it implements.

**Why this priority**: This is the concrete, measured problem statement — the test harness for the very feature that added "focused validation" is itself the slowest thing in the repository's own test suite.

**Independent Test**: Run `npx vitest run tools/agent-workflow/orchestrateCommand.test.ts` before and after this feature on the same machine; compare wall-clock duration and test/file counts.

**Acceptance Scenarios**:

1. **Given** the corrected pre-feature baseline (417.73s, 81 tests, 1 file), **When** this feature's test-harness changes are applied, **Then** the same file reports an equal or greater test count in materially less wall-clock time, with the exact before/after numbers recorded in this spec's directory.
2. **Given** the refactor introduces fake `gitAdapter`/command-runner seams, **When** a test that must prove real subprocess or real Git behavior is inspected, **Then** it is found in the retained real-integration subset (§ "Retained real integration coverage" below), not converted to a fake.

---

### User Story 2 - Comprehensive First-Pass Review (Priority: P1)

A maintainer waiting on Reviewer round-trips (5 rounds for Spec 055, 17 for Spec 054) wants the first independent review to surface every blocking defect it can find in one pass — including related occurrences of the same pattern — rather than one issue per round.

**Why this priority**: Directly targets the measured 62.9 minutes of Reviewer wall time and the round-trip pattern the spec calls out (find A, fix A, find B, fix B, find C...).

**Independent Test**: Drive Smoke A (two-review convergence): Review 1 returns 3 blocking findings in one pass; one consolidated fix cycle resolves all 3; Review 2 is a complete Approved review with zero new blockers. Confirm `reviewAttempts = 2`, not 4.

**Acceptance Scenarios**:

1. **Given** an implementation with three independent blocking defects, **When** the first independent review runs under the comprehensive-review prompt, **Then** all three are reported as blocking findings in that single review attempt (not discovered one per round).
2. **Given** a review reports it stopped early or leaves high-risk files uninspected, **When** review completeness is evaluated, **Then** it is classified `incomplete`, not `Approved`, regardless of its Markdown decision heading.

---

### User Story 3 - Persistent, Convergence-Tracked Finding Ledger (Priority: P1)

A maintainer wants to know, at any point in a multi-round review, exactly which findings are new since the last review, which are still-open carryovers, and which have reopened — the single number that answers "are we converging or thrashing?"

**Why this priority**: Without this, round count alone cannot distinguish "the Reviewer is finding new things every round" (not converging) from "the Reviewer is re-verifying the same fix" (converging, just slow).

**Independent Test**: Drive Smoke C (new late finding): Review 1 returns 2 blockers, both fixed; Review 2 discovers 1 genuinely new blocker. Confirm `newBlockingFindingsAfterFirstReview = 1` and `status` is not `converged`.

**Acceptance Scenarios**:

1. **Given** a finding first reported in review N, **When** it is reported again unchanged in review N+1, **Then** it is classified `previously known`, not `new`.
2. **Given** a finding marked `resolved` and then reported again with the same identity, **When** classified, **Then** it is `reopened` and its `reopenedCount` increments.
3. **Given** a resumed run, **When** the ledger is reloaded, **Then** finding IDs, statuses, and reopened counts are unchanged from before the pause.

---

### User Story 4 - Safe Review and Fix-Cycle Budgets (Priority: P2)

A maintainer wants review/fix looping to stop safely and legibly — never silently, never as a false approval, never by discarding findings — once a configured budget is exhausted, so a genuinely stuck run surfaces for human attention instead of looping or (worse) reaching the human gate without real convergence.

**Why this priority**: A convergence-tracking feature that has no stopping rule just changes *what* gets logged while the loop still runs unbounded or gives up silently.

**Independent Test**: Drive Smoke D: `reviewBudget.maxReviewAttempts = 2`, force a scenario requiring a third review. Confirm `stopReason = "review-convergence-failed"`, `ready = false`, open findings preserved, no remote mutation.

**Acceptance Scenarios**:

1. **Given** `reviewBudget.maxReviewAttempts` is reached without a complete Approved review with zero open blockers, **When** the workflow evaluates the next stage, **Then** it stops with a stable `stopReason`, never with `humanGate.ready: true`.
2. **Given** the workflow is stopped for budget exhaustion, **When** a human increases the configured budget and resumes, **Then** the run continues from its persisted ledger and attempt counts without duplication or loss.

---

### User Story 5 - Performance and Convergence Telemetry in the Run Summary (Priority: P3)

A maintainer inspecting `run-summary.json`/`.md` wants to see Reviewer/validation timing and convergence metrics (first-review blocking count, new findings after round 1, reopened count, fix cycles, status) without reconstructing them from raw run artifacts.

**Why this priority**: Extends Spec 054's audit-trail value with the two things this feature specifically measures; lowest priority because it is observability, not a safety or performance mechanism itself.

**Independent Test**: Run Smoke A end to end; confirm `run-summary.json` contains `performance.reviewDurationMs`, `reviewConvergence.firstReviewBlockingFindings`, and that `run-summary.md` renders a "Review Convergence" and "Performance" section with matching numbers.

**Acceptance Scenarios**:

1. **Given** a converged run, **When** the summary is built, **Then** `reviewConvergence.status === "converged"` only if a complete Approved review exists and open blocking findings = 0.
2. **Given** an old run-summary (pre-Spec-056) with no `performance`/`reviewConvergence` keys, **When** read by this feature's tooling, **Then** it remains fully readable and is not misinterpreted as `converged` or `budget-exhausted` — it reports `not-started`.

### Edge Cases

- A Reviewer that returns zero findings because the implementation is correct is a valid, complete, Approved review — completeness/convergence tracking MUST NOT force or fabricate findings.
- A malformed, timed-out, interrupted, empty, or unknown-decision review MUST NOT count as `complete`/`Approved` and MUST NOT advance convergence.
- A P3 (non-blocking) finding MUST NOT by itself trigger another fix/re-review cycle.
- Any finding in a high-risk category (false readiness, remote mutation, unsafe command execution, credential exposure, state corruption, resume corruption, incorrect exact-head provenance, validation bypass, review-parser approval bug, data loss, human-gate weakening) remains blocking regardless of the Reviewer's severity label.
- A code change after a complete Approved review invalidates that review's convergence evidence for readiness purposes (exact-head mismatch), mirroring Spec 055's exact-target design.
- Budget exhaustion is a stable, resumable stop state — never approval, never a discarded ledger, never a self-raised limit.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The test harness MUST support an injectable `gitAdapter` (matching the existing `{ run(args, cwd), verify(ref, cwd) }` shape already accepted by `collectGitContext`) threaded through every `orchestrateCommand.js` call site that currently calls `collectGitContext` without one, with production code defaulting to the existing real adapter when none is supplied.
- **FR-002**: A new `tools/agent-workflow/testDependencies.js` MUST provide a deterministic fake `gitAdapter` and a deterministic fake command runner (promoted from the existing test-local `createSequenceAdapter` pattern), each supporting success, failure, timeout, and interruption simulation, and spawn/kill tracking, with no reachable path for these fakes to be selected via production CLI flags.
- **FR-003**: Tests that only exercise orchestration decision logic (state transitions, role selection, budget arithmetic, prompt content, run-summary shape) MAY use the fake `gitAdapter` and a plain temporary directory with no real Git repository. Tests enumerated under "Retained real integration coverage" MUST continue to use a real Git repository and the real process adapter.
- **FR-004**: Repeated real-Git test setup (`git init`/config/commit) that remains necessary MUST be reduced to a filesystem copy of one lazily-created base fixture rather than re-running `git init` and its configuration/commit sequence per test.
- **FR-005**: The refactor MUST NOT reduce the total test count, MUST NOT remove coverage for any item in "Retained real integration coverage" below, and any removed test MUST be replaced by an equivalent-or-stronger one; before/after test-file and test counts MUST be recorded.
- **FR-006**: The independent-review prompt MUST instruct the Reviewer to continue reviewing after the first valid finding, to search for related occurrences of the same defect pattern, and to return all material blocking findings discovered in that single pass, while still permitting a genuine zero-finding Approved outcome.
- **FR-007**: Before invoking the Reviewer, the workflow MUST build a deterministic changed-file inventory (path, status, approximate added/removed line counts where available from `git diff --stat`, and a high-risk classification) and include or reference it in the review prompt.
- **FR-008**: The review prompt MUST include a concise, mode-specific checklist covering at minimum: correctness, state transitions, resume behavior, target provenance, validation readiness, structured review parsing, finding lifecycle, timeout handling, interruption handling, unsafe-command rejection, dry-run no-write behavior, backward compatibility, run-summary accuracy, and the human remote-mutation boundary.
- **FR-009**: The structured review schema MUST additively accept a `reviewCoverage` object (`changedFilesTotal`, `changedFilesInspected`, `highRiskFilesTotal`, `highRiskFilesInspected`, `checklistCompleted`); the workflow MUST independently verify `changedFilesTotal`/`highRiskFilesTotal` against its own deterministic inventory rather than trusting the Reviewer's self-reported totals.
- **FR-010**: The workflow MUST compute a `completeness` status (`complete`, `incomplete`, `invalid`) for every review attempt, independent of the Markdown `decision`; a review is `incomplete` when the Reviewer explicitly reports stopping early, when reported inspected counts fall short of the deterministic inventory, when required checklist coverage is missing, or when the reviewer process times out before returning a decision. An `incomplete` review MUST NOT be treated as `Approved` regardless of its decision heading.
- **FR-011**: The workflow MUST persist a finding ledger with stable, resume-safe IDs; each entry MUST track severity, blocking flag, summary, location, the review attempt it was first detected in, current status (`open`, `resolved`, `reopened`, `accepted-non-blocking`, `deferred`, `invalid`), a resolution target/note, and a reopened count.
- **FR-012**: Each review attempt MUST classify every reported finding against the ledger as `new`, `previously known`, `reopened`, or `related expansion`, and MUST record the count of new blocking findings discovered after the first review — the primary convergence metric.
- **FR-013**: When a review returns multiple valid blocking findings, the Implementer prompt for the following fix cycle MUST include the complete unresolved blocking set; the workflow MUST NOT trigger a re-review while any verified blocking finding from that same review remains intentionally unaddressed.
- **FR-014**: The workflow MUST resolve a `reviewBudget` (`maxReviewAttempts` default 3, `maxAutomaticFixCycles` default 2, `maxIncompleteReviewRetries` default 1, `maxReviewerQuestionCycles` default 1, matching the existing question-cycle default) from CLI flags/state with documented precedence against the existing `--max-fix-cycles` (which continues to mean "maximum automatic Implementer fix cycles"; `reviewBudget.maxReviewAttempts` is a distinct, independently tracked ceiling on total independent Reviewer attempts).
- **FR-015**: When any review-budget ceiling is exhausted without a converged, ready state, the workflow MUST stop with a stable `stopReason` (`review-convergence-failed` or a documented equivalent), MUST report attempt count, configured limit, open blocking findings, new findings in the latest round, reopened findings, and a recommended human action, MUST NOT mark `humanGate.ready: true`, MUST NOT discard findings, MUST NOT silently raise its own limit, and MUST remain resumable once a human increases the limit or changes the code.
- **FR-016**: P0/P1 findings are blocking by default; P2 is blocking when a concrete correctness/safety/behavioral/compatibility risk is identified; P3 is non-blocking by default and MUST NOT by itself start another fix/re-review cycle. Any finding in a designated high-risk category remains blocking regardless of its reported severity.
- **FR-017**: Final readiness MUST require a `complete` `Approved` review with zero open blocking findings, an exact reviewed-target match with the fully-validated target (reusing Spec 055's target-equality mechanism), and a passing final full validation on that exact target; the workflow MUST NOT insert an additional final review once a complete Approved review already covers the exact final target.
- **FR-018**: The workflow MUST record, per review attempt, start/end/duration, decision, completeness status, changed/high-risk file counts, new/known/reopened/resolved finding counts, and prompt character/byte counts; and per validation attempt, phase, commands, per-command and total duration, exit status, and target — additive to Spec 055's existing validation records.
- **FR-019**: `run-summary.json`/`.md` MUST additively report `performance` (Reviewer/validation durations, review attempts) and `reviewConvergence` (first-review blocking findings, new findings after first review, reopened findings, automatic fix cycles, status) without a `schemaVersion` bump; old summaries without these keys MUST remain readable and MUST report convergence `status: "not-started"` rather than a fabricated value.
- **FR-020**: This feature MUST NOT modify production `src/` files, MUST NOT weaken any existing Spec 042/043/044/046/047/048/049/050/051/052/053/054/055 safety, validation, role-resolution, lifecycle, or summary behavior, and MUST NOT introduce any new path to push, open/approve/merge/close a PR, or delete a remote branch.

### Key Entities *(include if feature involves data)*

- **Fake Git Adapter / Fake Command Runner**: Deterministic, test-only implementations of the existing `gitAdapter`/process-adapter seams, not reachable from production CLI flags.
- **Changed-File Inventory**: Deterministic `{ path, status, additions, deletions, highRisk }[]` computed once per review attempt from `git diff --stat`/`git status --porcelain` against the same merge-base `collectGitContext` already computes.
- **Review Coverage**: `{ changedFilesTotal, changedFilesInspected, highRiskFilesTotal, highRiskFilesInspected, checklistCompleted }`, partly self-reported (semantic inspection) and partly independently verified (totals against the deterministic inventory).
- **Review Completeness**: `complete` | `incomplete` | `invalid`, computed independently of the Markdown `decision`.
- **Finding Ledger Entry**: `{ id, severity, blocking, summary, location, firstDetectedAttempt, status, resolutionTarget, resolutionNote, reopenedCount }`.
- **Review Budget**: `{ maxReviewAttempts, maxAutomaticFixCycles, maxIncompleteReviewRetries, maxReviewerQuestionCycles }`, resolved with documented CLI/state precedence.
- **Convergence Status**: `not-started` | `in-progress` | `converged` | `budget-exhausted` | `incomplete-review` | `blocked`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `orchestrateCommand.test.ts` and `npm test` after-numbers are recorded against the corrected 417.73s/406.47s baseline with an honest percentage improvement, even if the 120s/180s targets are not fully reached.
- **SC-002**: Every item under "Retained real integration coverage" has an identifiable, passing test using the real process adapter/real Git repository after the refactor.
- **SC-003**: Smoke A (two-review convergence) reaches `reviewAttempts = 2`, `automaticFixCycles = 1`, `status = "converged"`, `ready = true`.
- **SC-004**: Smoke D (budget exhaustion) never reports `ready: true` and preserves all open findings.
- **SC-005**: Smoke E (P3 note) converges without an automatic extra cycle.
- **SC-006**: Old run-summary/state fixtures remain readable and are not misclassified as `converged`.
- **SC-007**: A complete independent Codex review of this feature's own diff reaches `Approved` with zero open blocking findings before the final local commit.

## Retained real integration coverage

Per FR-003/FR-005, the following MUST keep a real Git repository and the real process adapter after the Part A refactor (see `clarifications.md` Q1/Q2 for the full mapping to specific test names):

- Unsafe-command rejection before spawn (validation and runner config).
- Exact Git target/`dirtyHash` snapshot computation.
- Fix-cycle / final-validation tree-diff detection (`getDiffSignature`/`getAnswerStageEditSignature` consumers).
- At least one real timeout-cleanup integration test (SIGTERM → SIGKILL escalation).
- Interruption cleanup.
- State persistence and resume.
- BOM-tolerant state loading.
- Dry-run no-write guarantees.
- Real command exit-status handling.
- Human-gate enforcement.

## Assumptions

- `collectGitContext`'s existing `{ run(args, cwd), verify(ref, cwd) }` adapter shape is stable and sufficient to fake deterministically; this feature does not change that shape.
- The existing `validate → review → [fix → revalidate → re-review]* → final-verification → human-merge-decision` stage sequence and Spec 055's focused/full validation split are both left structurally unchanged; this feature only adds review-side coverage/convergence/budget/telemetry and test-harness seams.
- Incremental (diff-only) review, provider-specific token counting, distributed test execution, remote CI orchestration, automatic test selection from changed files, automatic budget modification, and any remote PR/merge operation are explicitly deferred (see `clarifications.md`).
