# Implementation Plan: Focused Validation Review Loop

**Branch**: `codex/focused-validation-review-loop` | **Date**: 2026-07-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/055-focused-validation-review-loop/spec.md`

## Summary

Introduce a validation-policy subsystem (`validationPolicy.js`, `validationPlan.js`, `validationPhase.js`) that resolves a `strategy` (`full-every-cycle` default, `focused-final-full` opt-in) and two independently configurable command lists (focused, full) from CLI flags and state, and selects which list a given `validate`/`revalidate`/`final-verification` occurrence runs — with zero new orchestration stage names. `final-verification` always runs the full list and is always the sole gate for `humanGate.ready`; a focused-only pass can never satisfy readiness. A `final-verification` failure or tree-modifying full-validation run, after an Approved decision, is routed back to `fix` (not hard-blocked) up to a dedicated, separately-tracked retry ceiling. Every validation/review record additively gains a `phase`, `triggerReason`, and exact `target` (`{ commit, dirty, dirtyHash }`), letting the Spec 054 run summary report focused/full attempts and status separately and compute a real `exactCommitMatch` instead of the permanent `"unknown"` placeholder, while remaining on `schemaVersion: 1`.

## Technical Context

**Language/Version**: JavaScript/CommonJS with TypeScript tests

**Primary Dependencies**: Existing Node.js standard library (`crypto` for deterministic target hashing), Vitest test suite, existing `orchestrateCommand.js`/`reviewCommand.js`/`agentWorkflow.js`/`runSummary.js`/`runSummarySchema.js` conventions

**Storage**: Additive fields on the existing `state.validationRuns[]`/`state.reviewRuns[]`/`state.orchestration` records and the existing `run-summary.json`/`.md` artifacts; no new tracked files, no new artifact directories

**Testing**: Vitest focused tests (`validationPolicy.test.ts`, `validationPlan.test.ts`, `validationPhase.test.ts`, additions to `orchestrateCommand.test.ts`, `runSummary.test.ts`, `runSummaryRenderer.test.ts`, `cli.test.ts`) plus full `npm test`

**Target Platform**: Local Windows PowerShell-compatible CLI workflow; cross-platform Node process execution paths preserved

**Project Type**: Local CLI/developer workflow tooling

**Performance Goals**: This feature exists specifically to reduce wall-clock time in multi-round review/fix loops by deferring the full command list to a single occurrence per approval candidate, without any change to how individual commands execute

**Constraints**: No new orchestration stage names; `final-verification`/full validation remains the only path to `humanGate.ready`; unsafe-command rejection applies identically to both command lists; dry-run writes nothing; old state files and old `validationRuns` records (no `phase` field) remain fully valid and are interpreted as `phase: "full"`; `schemaVersion` stays `1`

**Scale/Scope**: Three new small modules, additive fields on two existing record types and one existing orchestration-state object, one new fix-capable transition inside the existing `final-verification` handling in `runOrchestration`'s loop, CLI flag additions, run-summary integration, documentation updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec Kit workflow followed: spec (with embedded Clarifications), plan, design artifacts, tasks before implementation.
- Existing architecture is extended, not replaced: `validate`/`revalidate`/`final-verification` remain the only validation-running stages; no new stage names are introduced; the existing `runValidationCommands`/`assertSafeValidationCommand` execution and safety path is reused unchanged for both command lists.
- Runtime artifacts stay under `.agent-workflow/` and are not committed; no new tracked files.
- Remote mutations remain human-only; nothing in this feature spawns agents, mutates state, or touches validation commands during `--dry-run`.
- Backward compatibility: default strategy reproduces pre-Spec-055 behavior exactly; `schemaVersion` stays `1`; old `validationRuns`/`reviewRuns` records without new fields remain fully interpretable.

## Project Structure

### Documentation (this feature)

```text
specs/055-focused-validation-review-loop/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── validation-policy-schema.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
├── validationPolicy.js           (new: strategy/command resolution, target computation, phase-for-stage)
├── validationPolicy.test.ts      (new)
├── validationPlan.js             (new: dry-run plan preview, isFinalValidationSatisfied)
├── validationPlan.test.ts        (new)
├── validationPhase.js            (new: record field normalization, phase bucketing helpers)
├── validationPhase.test.ts       (new)
├── orchestrateCommand.js         (additive: phase/triggerReason/target fields on records, fix-capable final-verification-failure routing, fullValidationFixCycleCount)
├── orchestrateCommand.test.ts    (additive coverage, Smoke A-E)
├── reviewCommand.js              (additive: target on review execution record)
├── runSummary.js                 (additive: validation.focused/full, commits.reviewedTarget/fullValidationTarget/exactCommitMatch)
├── runSummary.test.ts            (additive coverage)
├── runSummaryRenderer.js         (additive: focused/full Markdown lines)
├── runSummaryRenderer.test.ts    (additive coverage)
├── cli.js                        (additive: --validation-strategy, --focused-validation-command, --full-validation-command, --force-full-validation, dry-run preview lines)
├── cli.test.ts                   (additive coverage)
└── README.md                     (additive documentation)
```

**Structure Decision**: The validation-policy subsystem is split into three small, independently testable modules rather than folded into `orchestrateCommand.js`, mirroring the Spec 053 (`roleResolver.js`) and Spec 054 (`runSummary*.js`) precedent of pure, state-in/value-out modules with no filesystem/process access at their core. `validationPolicy.js` owns pure resolution (strategy, command lists, phase-for-stage, target computation) and has no I/O. `validationPlan.js` owns the read-only "what would run next and why" question, shared by both the dry-run preview and the run-summary's `finalReadinessSatisfied`/`exactCommitMatch` computation, so the two can never disagree. `validationPhase.js` owns the small, shared normalization of a validation record's additive fields, used both when `orchestrateCommand.js` writes a record and when `runSummary.js` reads one back (including legacy records missing `phase`). `orchestrateCommand.js` gets the smallest possible integration: it calls into these modules instead of re-implementing resolution/target logic inline, and gains one new fix-capable branch in its existing `final-verification` handling.

## Complexity Tracking

No constitution violations. The only new abstraction is the validation-policy subsystem, which centralizes what would otherwise be duplicated "which commands run at this occurrence, and did the tree change since the last checkpoint" logic between `orchestrateCommand.js`, `cli.js`'s dry-run preview, and `runSummary.js`'s readiness computation.

## Architecture Decisions

1. **No new orchestration stages.** The existing `validate → review → [fix → revalidate → re-review]* → final-verification → human-merge-decision` sequence already has exactly one stage (`final-verification`) that runs once, only after Approved, immediately before the human gate — precisely where "final full validation" belongs. `validate`/`revalidate` already run once after `implement` and once per fix cycle — precisely where "focused validation" belongs under the new strategy. This feature only changes *which command list* each of these three stage names selects; it does not add, rename, or remove any stage.
2. **`final-verification` failure becomes fix-capable, not a new hard stop.** Today, any validation stage failing (including `final-verification`) calls `markBlocked` and stops the loop permanently for that state file. This feature adds a dedicated branch: when `final-verification` specifically fails (or passes but modifies the tree), and a separate `fullValidationFixCycleCount` has not exceeded `maxFixCycles`, the run transitions to `fix` instead of blocking — reusing the entire existing `fix → revalidate → re-review` machinery unmodified. `revalidate`'s phase is resolved the same way as any other occurrence (focused under `focused-final-full`, full under `full-every-cycle`), so the next validation after this kind of fix is intentionally the cheap phase, and a fresh Reviewer decision is still required (via `re-review`) before `final-verification` can run again. This is additive: focused-validation failures (`validate`/`revalidate` failing on their own, not via this path) keep today's hard-block behavior unchanged.
3. **A separate counter, not a shared one, for full-validation-triggered fixes.** Reusing `fixCycleCount` for this new path would let a defect the full suite found (not the Reviewer) silently consume the Reviewer's fix-cycle budget, or vice versa — exactly what the spec warns against. `fullValidationFixCycleCount` is tracked and capped independently (against the same `maxFixCycles` value, to avoid a second CLI flag) so the two are never conflated in the run summary or in fix-cycle-limit diagnostics.
4. **Exact target tracking via a small, deterministic, dependency-free signature.** `{ commit, dirty, dirtyHash }`, computed once from data `collectGitContext` already gathers (`headCommit`, `statusPorcelain`, `stagedDiff`, `unstagedDiff`) via Node's built-in `crypto.createHash("sha256")` — no new dependency, no fabricated commit SHA for a dirty tree. Recording this on every validation and review record (additive fields) makes "did the full-validation target match the reviewed target" a pure equality check rather than a new git-shelling-out call at readiness-computation time.
5. **`runSummary.js`'s aggregate `validation.status` mirrors the full phase, not the last record.** Before this feature, "the last validation record's status" and "the full phase's status" were the same thing, because there was only one phase. Under `focused-final-full`, the last record could be a passing focused occurrence while full has not run yet; reporting that as aggregate `"passed"` would be exactly the false-success failure mode the spec calls out. The aggregate is redefined to mean "the latest full-phase attempt's status, or `not-run` if none exists" — which is a no-op change for `full-every-cycle` (every record is phase `"full"`, so "latest full-phase attempt" = "latest record", identical to before) and correctly withholds `"passed"` under `focused-final-full` until `final-verification` actually runs.
6. **No `schemaVersion` bump.** Every new run-summary field is additive (nested under `validation`/`commits`) or a refinement of a field Spec 054 already documented as a deliberate `"unknown"` placeholder pending future evidence (`commits.exactCommitMatch`). No existing field is renamed, removed, or reinterpreted for a consumer that only reads the Spec 054 shape.
