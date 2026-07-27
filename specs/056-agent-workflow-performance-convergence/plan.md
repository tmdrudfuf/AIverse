# Implementation Plan: Agent Workflow Performance and Review Convergence

**Branch**: `codex/agent-workflow-performance-convergence` | **Date**: 2026-07-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/056-agent-workflow-performance-convergence/spec.md`

## Summary

Two independent but co-shipped improvements. Part A threads an injectable `gitAdapter` (matching `collectGitContext`'s existing adapter shape) through every remaining `orchestrateCommand.js` call site, adds `tools/agent-workflow/testDependencies.js` with deterministic fake Git/command-runner adapters, replaces per-test `git init`/config/commit with a copy of one lazily-created base fixture for the real-Git subset, and converts the representative majority of `orchestrateCommand.test.ts`'s orchestration-decision tests to the fake adapter — while keeping a real Git repository and the real process adapter for the enumerated integration subset (unsafe-command rejection, exact target/diff detection, timeout/interruption cleanup, resume, BOM loading, dry-run, human gate). Parts B/C/D add four small modules (`reviewCoverage.js`, `reviewConvergence.js`, `reviewBudget.js`, `performanceMetrics.js`) that build a deterministic changed-file inventory, classify review completeness independent of the Markdown decision, maintain the existing Spec 052 finding ledger's new/known/reopened classification for a single convergence metric, resolve/enforce a `reviewBudget`, and record per-attempt timing — integrated thinly into `orchestrateCommand.js`, `reviewCommand.js`, and `runSummary.js` (mirroring Spec 055's `isFinalValidationSatisfied` "single shared computation" precedent so orchestration-level decisions and the run summary can never disagree).

## Technical Context

**Language/Version**: JavaScript/CommonJS with TypeScript tests

**Primary Dependencies**: Existing Node.js standard library (`node:child_process`, `node:crypto`), Vitest test suite, existing `orchestrateCommand.js`/`reviewCommand.js`/`findingLifecycle.js`/`structuredReview.js`/`runSummary.js`/`validationPolicy.js`/`validationPlan.js` conventions

**Storage**: Additive fields on `state.reviewRuns[]`/`state.validationRuns[]`/`state.orchestration`/`state.findingHistory` and the existing `run-summary.json`/`.md` artifacts; no new tracked files; test fixtures live under the OS temp directory exactly as today

**Testing**: Vitest — new `reviewCoverage.test.ts`, `reviewConvergence.test.ts`, `reviewBudget.test.ts`, `performanceMetrics.test.ts`, `testDependencies.test.ts`; additive coverage in `orchestrateCommand.test.ts` (including Smoke A-H), `reviewCommand.test.ts`, `runSummary.test.ts`, `runSummaryRenderer.test.ts`, `cli.test.ts`; before/after timing for `orchestrateCommand.test.ts` and full `npm test`

**Target Platform**: Local Windows PowerShell-compatible CLI workflow; cross-platform Node process execution paths preserved

**Project Type**: Local CLI/developer workflow tooling

**Performance Goals**: Reduce `orchestrateCommand.test.ts` from a corrected 417.73s/81-test baseline (see `spec.md` Baseline section for the stray-worktree measurement correction) toward the requested <120s target (report the achieved number and remaining bottleneck if not fully reached); reduce Reviewer round count for a given defect set via comprehensive first-pass review and convergence tracking, not via smaller prompts

**Constraints**: No new orchestration stage names; no weakening of any Spec 042-055 safety/validation/role/lifecycle/summary behavior; no new path to remote mutation; `schemaVersion` stays `1`; fake adapters are not reachable from production CLI flags; a failed test must not corrupt a later test's fixture

**Scale/Scope**: Five new small modules (four production, one test-support), gitAdapter threading across ~13 existing call sites in `orchestrateCommand.js`, a base-fixture-copy helper for the retained real-Git test subset, representative conversion of the fake-adapter-eligible test subset, two new review-prompt templates' worth of additive instructions, CLI flag additions, run-summary integration, README updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec Kit workflow followed: spec, clarifications, plan, tasks, quickstart before implementation.
- Existing architecture is extended, not replaced: the `implement → validate → review → [fix → revalidate → re-review]* → final-verification → human-merge-decision` sequence, Spec 055's focused/full validation split, and Spec 052's finding-lifecycle map are all reused; no new stage names, no parallel workflow engine.
- Runtime artifacts stay under `.agent-workflow/` and are not committed; no new tracked files. Test fixtures stay under the OS temp directory.
- Remote mutations remain human-only; this feature adds no push/PR/merge/branch-deletion path and does not weaken `--dry-run`'s no-spawn/no-write guarantee.
- Backward compatibility: old state files/run-summaries without this feature's new fields resolve to documented defaults (`reviewBudget` defaults, `reviewConvergence.status: "not-started"`); `schemaVersion` stays `1`.

## Project Structure

### Documentation (this feature)

```text
specs/056-agent-workflow-performance-convergence/
├── spec.md
├── clarifications.md
├── plan.md
├── tasks.md
└── quickstart.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
├── testDependencies.js            (new: fake gitAdapter, fake command runner, fake clock)
├── testDependencies.test.ts       (new)
├── reviewCoverage.js              (new: changed-file inventory, high-risk classification, completeness)
├── reviewCoverage.test.ts         (new)
├── reviewConvergence.js           (new: ledger-backed new/known/reopened classification, convergence status)
├── reviewConvergence.test.ts      (new)
├── reviewBudget.js                (new: budget resolution/enforcement, CLI/state precedence)
├── reviewBudget.test.ts           (new)
├── performanceMetrics.js          (new: per-attempt timing, prompt size, process-metric helpers)
├── performanceMetrics.test.ts     (new)
├── orchestrateCommand.js          (additive: gitAdapter threading, coverage/convergence/budget integration)
├── orchestrateCommand.test.ts     (additive coverage, base-fixture-copy helper, fake-adapter conversion, Smoke A-H)
├── reviewCommand.js               (additive: changed-file inventory + checklist in the review prompt)
├── reviewCommand.test.ts          (additive coverage)
├── runSummary.js                  (additive: performance + reviewConvergence sections)
├── runSummary.test.ts             (additive coverage)
├── runSummaryRenderer.js          (additive: Performance / Review Convergence Markdown sections)
├── runSummaryRenderer.test.ts     (additive coverage)
├── cli.js                         (additive: review-budget flags, dry-run preview lines)
├── cli.test.ts                    (additive coverage)
├── templates/independent-review.md      (additive: comprehensive-review instructions, checklist, inventory, coverage contract)
├── templates/orchestrate-final-review.md (additive: same, final-review variant)
└── README.md                      (additive documentation)
```

**Structure Decision**: Four new modules mirror the Spec 053/054/055 precedent (`roleResolver.js`, `runSummary*.js`, `validationPolicy.js`/`validationPlan.js`/`validationPhase.js`) of small, pure, state-in/value-out modules with no I/O beyond what they're explicitly given: `reviewCoverage.js` only computes from a supplied `gitContext`/diff-stat text and a supplied structured-review object; `reviewConvergence.js` only computes from a supplied ledger and structured-review object; `reviewBudget.js` only resolves/checks numbers. `orchestrateCommand.js` gets the smallest possible integration: it calls into these modules instead of re-implementing inventory/classification/budget logic inline. `testDependencies.js` is test-support-only, imported exclusively from `*.test.ts` files, and exports nothing reachable from `cli.js`.

## Complexity Tracking

No constitution violations. The new abstractions (four review-support modules, one test-support module) directly mirror precedent already established in Spec 053-055; none introduces a competing workflow engine, a new stage name, or a new remote-mutation path.

## Architecture Decisions

1. **`gitAdapter` threading reuses `collectGitContext`'s existing seam rather than inventing a new one.** `reviewCommand.js#collectGitContext` already accepts `options.gitAdapter` with the `{ run(args, cwd), verify(ref, cwd) }` shape (used today only by `previewIndependentReview`/`runIndependentReview`). This feature threads the same option through the ~13 `orchestrateCommand.js` call sites that currently omit it, so a caller (test or otherwise) can supply a fake without any change to `collectGitContext` itself.
2. **The fake adapters simulate at the `.run()/.verify()` level, not by wrapping `collectGitContext`'s return value.** This keeps the fake indistinguishable in shape from the real adapter (same seam, same call signature, same 13-ish distinct `git` invocation patterns `collectGitContext` issues), so production code never needs a "am I faked" branch, and the fake can be unit-tested against the exact same argument patterns the real adapter receives.
3. **Base-fixture-copy, not a shared mutable repository.** Per clarifications Q3/Q4, one base fixture directory is created once (lazily, cached) and never mutated; every real-Git test still gets its own fresh `mkdtemp` copy. This preserves today's full per-test isolation guarantee while removing the repeated `git init`/config/commit subprocess cost.
4. **`reviewConvergence.js` sits on top of Spec 052's existing finding-lifecycle map, it does not replace it.** New/known/reopened classification and the "new blocking findings after first review" metric are a read of the same `findingHistory`/lifecycle data `findingLifecycle.js` already maintains, keeping finding-ID stability and resume behavior exactly as Spec 052 built it.
5. **Readiness/convergence checks are consulted from both `orchestrateCommand.js` and `runSummary.js` via the same shared functions**, mirroring Spec 055's `isFinalValidationSatisfied` "the two can never disagree" pattern — `reviewConvergence.js`'s `computeConvergenceStatus` and `reviewBudget.js`'s `isBudgetExhausted` are the single source of truth for both the orchestration-level stop decision and the run-summary's `reviewConvergence.status`.
6. **Deterministic coverage verification, not trusted self-report.** `reviewCoverage.js` computes `changedFilesTotal`/`highRiskFilesTotal` independently from `git diff --stat`/`git status --porcelain`; a Reviewer's self-reported `changedFilesInspected`/`highRiskFilesInspected` is only accepted up to those independently-computed totals — a claim of full coverage that undercounts the deterministic total is `incomplete`, never trusted at face value.
7. **No `schemaVersion` bump.** `performance` and `reviewConvergence` are new, additively-nested `run-summary.json` objects; no existing field is renamed, removed, or reinterpreted, mirroring Spec 055 Architecture Decision 6.
