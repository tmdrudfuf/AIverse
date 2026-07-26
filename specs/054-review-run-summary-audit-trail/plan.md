# Implementation Plan: Review Run Summary and Audit Trail

**Branch**: `codex/review-run-summary-audit-trail` | **Date**: 2026-07-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/054-review-run-summary-audit-trail/spec.md`

## Summary

Add a centralized, pure summary subsystem (`runSummarySchema.js`, `runSummary.js`, `runSummaryRenderer.js`, `summaryCommand.js`) that derives a normalized, versioned `run-summary` model directly from already-persisted `orchestrate` state (`state.orchestration`, `state.orchestrationRuns`, `state.reviewRuns`, `state.validationRuns`, `state.findingHistory`) and existing artifact paths — never from re-parsing free-form logs when structured state already exists. `runOrchestration` writes `run-summary.json` (source of truth) and `run-summary.md` (deterministic rendering of the same model) once, at the natural end of its already-synchronous internal loop, to the existing flat per-feature run directory. A new read-only `summary` CLI command recomputes the same model on demand from any state file (including old, pre-Spec-054 state) without spawning, validating, mutating, or writing anything. `orchestrate --dry-run` continues to write nothing.

## Technical Context

**Language/Version**: JavaScript/CommonJS with TypeScript tests

**Primary Dependencies**: Existing Node.js standard library, Vitest test suite, existing `agentWorkflow.js`/`orchestrateCommand.js`/`findingLifecycle.js`/`structuredReview.js`/`roleResolver.js` state and artifact conventions

**Storage**: JSON/Markdown artifacts under the existing flat per-feature `.agent-workflow/runs/<feature-id>/` directory; no new tracked files

**Testing**: Vitest focused tests (`runSummary.test.ts`, `runSummaryRenderer.test.ts`, `summaryCommand.test.ts`, additions to `orchestrateCommand.test.ts`/`cli.test.ts`) plus full `npm test`

**Target Platform**: Local Windows PowerShell-compatible CLI workflow; cross-platform Node process execution paths preserved

**Project Type**: Local CLI/developer workflow tooling

**Performance Goals**: Summary building is pure in-memory computation over already-loaded state and small artifact-existence checks; negligible compared with agent execution and validation commands

**Constraints**: No remote mutation, no live AI in automated tests, old state/run directories remain fully readable, summary-write failure must never block or corrupt the primary state write, dry-run writes nothing, secrets must never be copied into summary artifacts, output must be deterministic apart from timestamps

**Scale/Scope**: Four new small modules, one additive field on an existing record (`reviewRunRecord.stage`), one new CLI command, one new call site at the end of `runOrchestration`, documentation updates

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec Kit workflow followed: spec (with embedded Clarifications), plan, design artifacts, tasks before implementation.
- Existing architecture is extended, not replaced: the summary subsystem reads persisted state produced by Specs 048/050/051/052/053 unchanged; it does not introduce a parallel state-tracking mechanism.
- Runtime artifacts stay under `.agent-workflow/` and are not committed.
- Remote mutations remain human-only; the summary and its CLI command are strictly read/derive-only and cannot spawn agents, run validation, or mutate state.

## Project Structure

### Documentation (this feature)

```text
specs/054-review-run-summary-audit-trail/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── run-summary-schema.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
├── runSummarySchema.js
├── runSummarySchema.test.ts
├── runSummary.js
├── runSummary.test.ts
├── runSummaryRenderer.js
├── runSummaryRenderer.test.ts
├── summaryCommand.js
├── summaryCommand.test.ts
├── orchestrateCommand.js         (additive: reviewRunRecord.stage, refreshRunSummary call)
├── orchestrateCommand.test.ts    (additive coverage)
├── cli.js                       (additive: `summary` command, orchestrate summary pointer output)
├── cli.test.ts                  (additive coverage)
└── README.md                    (additive documentation)
```

**Structure Decision**: Summary logic belongs in its own small set of pure modules, mirroring the `roleResolver.js` precedent from Spec 053 (a focused, independently unit-testable module with no filesystem/process access at its core). `runSummarySchema.js` owns enum/version normalization only. `runSummary.js` owns `buildRunSummary` (pure, state-in/model-out) and `refreshRunSummary` (the only function that touches the filesystem — atomic write of the two artifacts, best-effort, never throwing). `runSummaryRenderer.js` owns the deterministic Markdown rendering of the normalized model, kept separate so JSON and Markdown are provably two views of one model rather than two independent generators. `summaryCommand.js` owns the read-only CLI-facing presentation (calls `buildRunSummary` directly, never `refreshRunSummary`, so it can never write anything). `orchestrateCommand.js` gets the smallest possible integration: one additive field on an existing record, and one call to `refreshRunSummary` at the single point where its internal loop already always stops before returning.

## Complexity Tracking

No constitution violations. The only new abstraction is the summary subsystem, which centralizes what would otherwise be duplicated "read scattered state fields and print something" logic between the CLI's own `formatOrchestrationResult` and any future audit tooling.

## Architecture Decisions

1. **Single call site, not ten.** `runOrchestration`'s internal `while` loop already writes `state` at every meaningful transition (via `persistStage` or an explicit `writeState` before each `break`), and the loop provably always exits — to a terminal stage, to `blocked`, or by throwing before the loop is ever entered — before the function's own `return` statement. Rather than threading a summary refresh through every one of the ~10 existing break points (invasive, error-prone to keep in sync), this feature adds exactly one call, immediately before that `return`, using the final `currentState`. This covers every internally-detected stopping condition (validation failure, timeout, interruption, invalid structured review, blocked, human-merge-decision) because they all reach that same exit path. It does not cover a genuine OS-level kill of the parent process, which is why the `summary` CLI command recomputes fresh from state rather than trusting a cached file.
2. **Derive the stage timeline from durable arrays, not the ephemeral `steps` list.** `runOrchestration` resets its local `steps` array to `[]` on every invocation; only `state.orchestrationRuns` (via `appendRecord`, which only ever appends) accumulates durably across resumed invocations. Building the timeline from `state.orchestrationRuns`/`state.reviewRuns`/`state.validationRuns` — arrays that already exist and already never get duplicated or reset on resume — automatically satisfies "no duplicate stages after resume" and "preserve prior completed stage evidence" without new bookkeeping.
3. **`summary` CLI command recomputes, never reads a cache.** Making `summaryCommand.js` call `buildRunSummary(state, options)` directly (the same pure function `refreshRunSummary` calls before writing) rather than reading back `run-summary.json` means: it is trivially read-only, it can never disagree with a stale cached file, and it works unchanged for state files that predate this feature entirely (no cached file to find).
4. **Additive `stage` field on `reviewRunRecord`.** The existing `reviewRunRecord` pushed into `state.reviewRuns` by `runReviewWithoutStateWrite` has no field recording whether it came from `review`, `re-review`, or `final-review`. Inferring this from array position/surrounding decisions would be fragile and would duplicate logic already available at the call site (the `reviewStage` parameter). Adding `stage: reviewStage` is a one-line, purely additive, backward-compatible change — old records without it are tolerated (reported as `"unknown"`) rather than required.
5. **Summary-write failure is isolated from the state write.** `refreshRunSummary` is only ever called after `writeState`/`persistStage` has already durably written the primary state for this transition. It is wrapped in try/catch; on failure it returns a warning object that the CLI can print, and never throws into the caller. This directly satisfies "do not allow summary-writing failure to corrupt the primary workflow state" — the two writes are sequential and independent, and the state write already happened.
6. **No new tracked files; flat existing directory.** `run-summary.json`/`run-summary.md` are written via `getRunDirectory(state, options)`, the same helper every other artifact in this codebase uses, directly in the existing per-feature flat directory (not a new per-run subdirectory the codebase does not otherwise have).
