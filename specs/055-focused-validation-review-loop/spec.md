# Feature Specification: Focused Validation Review Loop

**Feature Branch**: `codex/focused-validation-review-loop`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Add an efficient validation strategy where implementation and review/fix cycles run a focused (fast, targeted) validation phase, and a complete full validation gate runs only once a Reviewer approval candidate exists, before the workflow can reach final human remote-mutation readiness — without ever reporting readiness based on focused validation alone."

## Clarifications

### Session 2026-07-26

- Q: What is the default validation strategy? → A: `full-every-cycle` (maximum backward compatibility). This feature is additive and opt-in; a state file or CLI invocation that specifies nothing continues to behave exactly as it did before this feature (every `validate`/`revalidate`/`final-verification` occurrence runs the same full command list, exactly today's behavior). `focused-final-full` must be explicitly requested via `--validation-strategy focused-final-full` or `state.validationPolicy.strategy`.
- Q: How do `validate`/`revalidate`/`final-verification` map onto "focused" vs "full" phases? → A: No new orchestration stages are introduced. `final-verification` (which already runs immediately before `human-merge-decision`, exactly once per Approved outcome) is always the "full" phase. `validate` (after `implement`) and `revalidate` (after `fix`) are the "focused" phase when `strategy = focused-final-full`, and are also "full" phase when `strategy = full-every-cycle` (in which case every occurrence uses the same full command list, reproducing today's behavior exactly). This reuses the existing state machine (`orchestrateCommand.js#nextStageAfterCompleted`) with zero new stage names.
- Q: What happens when `focused-final-full` is selected but no focused commands are configured? → A: Fall back to running the full command list at that occurrence (never silently skip validation, never error out and halt the run). This is the safer of the two documented fallback options: it costs the performance optimization for that occurrence but never weakens safety. A `validation-configuration-invalid` stop reason and run status exist in the schema for completeness but are not reachable under this chosen fallback policy; a future stricter policy may adopt them without a schema change.
- Q: Does focused validation run after Reviewer questions if answers changed code? → A: The `answer-questions` stage already refuses to proceed if the Implementer's answer pass produced any repository file change (`orchestrateCommand.js#executeAnswerQuestionsStage`, "Answer stage modified repository files" → blocked). Since answers can never change code today, there is no code-changed case that would require re-running validation after Q&A, and this feature does not add one. Documented rather than built, since building a mechanism for an unreachable case would be untested, false-safety complexity.
- Q: Does full validation run before or after Reviewer approval? → A: After. `final-verification` is only entered once `review`/`re-review`/`final-review` returns `Approved` (existing `nextStageAfterCompleted`/persistStage transition), so full validation always runs against the exact tree the Reviewer approved, never before it.
- Q: Is another full Reviewer review required after full validation passes? → A: No new review is required when full validation passes and the working tree is unchanged from what the Reviewer approved (verified via an exact target-signature comparison, see Commit/Target Integrity below). A fresh review is required only if full validation modified the tree or failed and a subsequent fix cycle changed the implementation — in both cases the workflow routes back through `fix → revalidate (focused) → re-review`, which already requires a fresh Reviewer decision before `final-verification` can run again.
- Q: What happens if full validation passes but the reviewed commit/target differs from what was approved? → A: This is only reachable if full validation itself modified the tree (see next clarification), since nothing else runs between the Approved decision and `final-verification` in the existing loop. When detected, the run does not proceed to `human-merge-decision`; it is treated the same as a full-validation failure (see below) and routed back to `fix`, since the approval no longer describes the current tree.
- Q: What happens if full validation itself modifies files (e.g. a formatter, generated snapshot, or build artifact under version control)? → A: The tree signature immediately before and immediately after running `final-verification`'s commands is compared (reusing the existing `getDiffSignature` helper already used for the `fix`-stage no-diff check). A mismatch is treated identically to a full-validation command failure: the run does not reach `human-merge-decision`; it routes back to `fix` instead of hard-blocking, so the Implementer can commit/reconcile the change and a fresh Reviewer decision can be obtained.
- Q: How are dirty working-tree targets identified when no commit exists yet? → A: A `target` object is recorded on every validation and review record: `{ commit, dirty, dirtyHash }`. `commit` is the current `HEAD` SHA (`collectGitContext().headCommit`); `dirty` is true when staged or unstaged changes exist; `dirtyHash` is a deterministic `sha256` (first 12 hex chars) of the concatenation of `git status --porcelain`, the staged diff, and the unstaged diff, present only when `dirty` is true. Two targets are considered an exact match only if `commit`, `dirty`, and (when dirty) `dirtyHash` are all equal. This never fabricates a commit SHA for an uncommitted tree.
- Q: How does `--skip-validation` interact with readiness? → A: `--skip-validation` skips every validation stage occurrence in that invocation (focused and full alike) and marks `validationSkipped: true`; `humanGate.ready` requires `validation.status === "passed"` and skipped validation is reported as `"skipped"`, never `"passed"`, so a skipped run can never become merge-ready. This feature does not add a way to skip only the full phase while keeping readiness. A pre-existing gap (present before this feature, surfaced by Codex review round 1 against this spec's own touched code) is closed here: a skipped `final-verification` used to still call `markHumanGate`, reaching `orchestration.currentStage: "human-merge-decision"` and `decision: "Ready for human merge decision"` at the top level even though the run-summary correctly reported `humanGate.ready: false` — a disagreement between the two readiness signals. `final-verification` now checks `orchestration.validationSkipped` before marking the human gate and blocks instead (`"final-verification skipped via --skip-validation; human merge decision requires actual validation evidence"`), so the orchestration-level decision and the run-summary can never disagree about whether skipping permits readiness.
- Q: Does manual `--force-full-validation` consume a fix cycle? → A: No. It only elevates the very next validation stage occurrence(s) in that single CLI invocation from "focused" to "full" command execution (`triggerReason: "manual-request"`); it does not skip stages, does not touch `fixCycleCount`, and does not mark anything ready by itself — readiness still requires the normal Approved + full-validation-passed + exact-target-match conditions.
- Q: What happens when focused tests pass but a later full test fails? → A: `humanGate.ready` is `false` (it was never `true`, since full validation had not yet passed), the run's `stopReason` reports `full-validation-failed` (or `-timed-out`/`-interrupted`), and — unlike a focused-validation failure, which still hard-blocks as today — the run routes back to `fix` (see the full-validation-failure clarification above) up to a dedicated retry ceiling (`fullValidationFixCycleCount`, capped by the same `--max-fix-cycles` value as Reviewer-requested fixes, but tracked as a separate counter so a defect found by full validation cannot silently consume the Reviewer's fix-cycle budget or vice versa).
- Q: How are old state files interpreted? → A: Every new field (`state.validationPolicy`, `record.phase`, `record.triggerReason`, `record.target*`, `orchestration.fullValidationFixCycleCount`) is additive and optional. A `validationRuns` record with no `phase` field is treated as `phase: "full"` (the historical meaning: before this feature, every validation occurrence used one uniform "full" command list). A state file with no `validationPolicy` resolves to `strategy: "full-every-cycle"` with commands resolved exactly as `getValidationCommands` did before this feature (`state.validationCommands` / `DEFAULT_VALIDATION_COMMANDS`). No historical field is renamed, removed, or reinterpreted with a new meaning.
- Q: Is the run-summary schema version bumped? → A: No. `schemaVersion` remains `1`. Every Spec 055 addition to `run-summary.json` is either a new field nested under existing objects (`validation.strategy`, `validation.focused`, `validation.full`, `validation.finalReadinessSatisfied`, `commits.reviewedTarget`, `commits.fullValidationTarget`) or a refinement of a field that Spec 054 explicitly documented as a deliberate placeholder (`commits.exactCommitMatch` moves from a permanent `"unknown"` string to a computed `true`/`false` once both a reviewed target and a full-validation target exist, falling back to `"unknown"` exactly as before when either is absent — old consumers reading it as an opaque value are unaffected). The existing flat `validation.commands[]` array is preserved unchanged in shape (each entry gains an additive `phase` field) for any consumer that only ever read that array.
- Q: How do resumed runs avoid unnecessary full validation? → A: Re-invoking `orchestrate` on a state file already at a `TERMINAL_STAGES` stage (`human-merge-decision` or `blocked`) never enters the stage loop at all (`while (!TERMINAL_STAGES.has(getCurrentStage(currentState)))` — existing, unmodified guard), so a completed run's `final-verification` evidence is never re-executed just by invoking the command again. This is an existing guarantee this feature relies on rather than re-implements; a regression test confirms it explicitly for the focused-final-full strategy.
- Q: Which changes always force full validation early? → A: Out of initial scope. The spec author's "high-risk change policy" section allows an explicit `requiresFullValidation` state flag or a deterministic changed-path policy; this feature implements the explicit state flag (`state.validationPolicy.requiresFullValidation: true` forces every validate/revalidate occurrence to run full commands for that run, overriding `focused-final-full`'s normal focused mapping) and does not implement changed-path inference, since a path-based heuristic that silently under-covers a "shared infrastructure" change would provide false safety — exactly what the spec instructs against. Documented as deferred scope.
- Q: The suggested file layout / `clarifications.md` — repository convention? → A: Same precedent as Spec 053/054: this `## Clarifications` section inside `spec.md`, no separate file.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Fast Iteration During Multi-Round Review (Priority: P1)

An Implementer/Reviewer pair iterating through several Changes-Requested/fix rounds (as Spec 054 needed 17 rounds for) wants each fix cycle to only pay for a focused, targeted test run, not the entire suite, so the loop is fast, while still guaranteeing the full suite runs before anything can be reported ready for a human decision.

**Why this priority**: This is the entire point of the feature — the observed Spec 054 cost (17 rounds × full suite ≈ over two hours) is the motivating problem.

**Independent Test**: Configure `strategy: focused-final-full` with a small focused command list and a full command list; drive a mock run through two Changes-Requested/fix cycles then Approved; confirm `validate`/`revalidate` occurrences ran only the focused commands (2 occurrences) and `final-verification` ran the full commands exactly once.

**Acceptance Scenarios**:

1. **Given** `focused-final-full` with configured focused and full commands, **When** a run goes through N fix cycles then Approved, **Then** focused commands run at every `validate`/`revalidate` occurrence (N+1 total) and full commands run exactly once, at `final-verification`.
2. **Given** the same run, **When** it reaches `human-merge-decision`, **Then** `humanGate.ready` is `true` only because the full phase passed, not because the focused phase passed.

---

### User Story 2 - Full Validation Is Never Skippable for Readiness (Priority: P1)

A maintainer must never see `humanGate.ready: true` on the strength of focused validation alone — the full suite is the only evidence that can satisfy final readiness.

**Why this priority**: A "faster" workflow that can be misread as "ready" without the full suite having run would be a severe regression in trust, worse than the delay this feature removes.

**Independent Test**: Drive a mock run to a state where focused validation has passed and the Reviewer has returned `Approved`, but stop before `final-verification` runs; confirm `humanGate.ready` is `false` and `validation.finalReadinessSatisfied` is `false`. Then run full validation and have it fail; confirm readiness remains `false`, the run does not terminate at `human-merge-decision`, and the run instead becomes fix-capable again.

**Acceptance Scenarios**:

1. **Given** focused validation passed and the Reviewer approved, but full validation has not yet run, **When** the summary is built, **Then** `humanGate.ready` is `false`.
2. **Given** full validation fails after an Approved decision, **When** the run continues, **Then** the prior approval is not treated as final, the run transitions to `fix` (not a terminal block, up to a dedicated retry ceiling), and a fresh focused validation + Reviewer decision are required before `final-verification` can run again.

---

### User Story 3 - Full-Every-Cycle Remains Available and Is the Default (Priority: P1)

A maintainer who does not opt in to the new strategy, or who explicitly wants maximum safety at the cost of speed, continues to get exactly today's behavior: the full command list runs at every `validate`/`revalidate`/`final-verification` occurrence.

**Why this priority**: Backward compatibility — this feature must not silently change the behavior of every existing and future state file that does not request the new strategy.

**Independent Test**: Run a mock orchestration with no `--validation-strategy` flag and no `state.validationPolicy` at all; confirm every validation occurrence uses the same command list Spec 045-054 already used, and existing focused/full-agnostic tests continue to pass unmodified.

**Acceptance Scenarios**:

1. **Given** no strategy configured, **When** the run executes, **Then** `resolveValidationPolicy` returns `strategy: "full-every-cycle"` and every `validate`/`revalidate`/`final-verification` occurrence runs the same (legacy-resolved) command list.
2. **Given** `--validation-strategy full-every-cycle` explicitly, **When** the run executes, **Then** behavior is identical to (1).

---

### User Story 4 - Trustworthy Audit Trail Across Two Validation Phases (Priority: P2)

A maintainer inspecting the run summary wants to see, at a glance, how many focused validation attempts occurred, how many full validation attempts occurred, and that these are not conflated with Reviewer-requested fix cycles.

**Why this priority**: Directly extends Spec 054's audit-trail value; without phase separation, a summary reporting one blended "validation" count would misrepresent what actually ran and how much it cost.

**Independent Test**: Drive Smoke A (below) and confirm the summary reports `validation.focused.attempts: 3`, `validation.full.attempts: 1`, `review.fixCycles: 2`, and that these three numbers are visibly distinct in both JSON and Markdown.

**Acceptance Scenarios**:

1. **Given** a run with 3 focused attempts, 1 full attempt, and 2 Reviewer fix cycles, **When** the summary is built, **Then** all three counts are reported separately and none is derived from another.
2. **Given** the same run, **When** `run-summary.md` is rendered, **Then** it shows the strategy name, focused attempts/result, and full attempts/result as distinct lines, and never prints a bare `Validation: Passed` unless the full phase specifically passed.

---

### User Story 5 - Safe Dry-Run Preview of the Validation Plan (Priority: P3)

A maintainer wants to preview which validation phase would run next, and with which commands, without executing anything.

**Why this priority**: Matches every other dry-run guarantee already in this workflow; a strategy/command-list preview reduces surprise before a real run.

**Independent Test**: Run `orchestrate --dry-run --validation-strategy focused-final-full --focused-validation-command "..." --full-validation-command "..."` against states at several different current stages; confirm the preview reports the strategy, both command lists, and the phase that would run next, and confirm no process is spawned, no state is written, and no validation command executes.

**Acceptance Scenarios**:

1. **Given** any current stage, **When** `--dry-run` is used, **Then** the preview reports `validationPolicy.strategy`, `validationPolicy.focusedCommands`, `validationPolicy.fullCommands`, and `nextValidationPhase.phase` with a reason, and no command runs.

### Edge Cases

- A `validate`/`revalidate` occurrence under `focused-final-full` with no configured focused commands falls back to running the full command list for that occurrence (documented above), never silently skipping validation.
- `final-verification` failing after Approved routes to `fix` (not a hard block) up to `fullValidationFixCycleCount` attempts (capped by `maxFixCycles`); exceeding the cap hard-blocks with a distinct reason, exactly as today's "Maximum fix cycles reached" hard-blocks.
- `final-verification` passing while modifying the tracked working tree is treated identically to a `final-verification` failure (see Clarifications).
- A resumed run already at `human-merge-decision` or `blocked` never re-enters the stage loop (existing `TERMINAL_STAGES` guard), so it can never redundantly re-run full validation.
- `--force-full-validation` never marks anything ready by itself and never skips a stage; it only changes which command list the next validation occurrence(s) in that invocation use.
- Old `validationRuns` records without a `phase`/`target*` field are treated as `phase: "full"` with an absent target (never fabricated), preserving Spec 045-054 backward compatibility.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST support a `strategy` selecting between `full-every-cycle` (every validation occurrence runs the same full command list — today's behavior) and `focused-final-full` (validate/revalidate occurrences run a focused command list; only `final-verification` runs the full command list), resolved via `--validation-strategy` / `state.validationPolicy.strategy`, defaulting to `full-every-cycle` when unspecified.
- **FR-002**: The workflow MUST support independently configured focused and full command lists via repeatable `--focused-validation-command` / `--full-validation-command` flags and/or `state.validationPolicy.focusedCommands` / `state.validationPolicy.fullCommands`, and MUST continue to honor the existing repeatable `--validation-command` flag and `state.validationCommands` field as the full-command-list source when the new flags/fields are not supplied.
- **FR-003**: When `focused-final-full` is selected and no focused commands are configured (by flag or state), the workflow MUST fall back to running the full command list for that occurrence rather than skipping validation or silently guessing a subset.
- **FR-004**: `final-verification` MUST always run the full command list regardless of strategy, and MUST only ever be entered after a Reviewer `Approved` decision (existing transition, unchanged).
- **FR-005**: `humanGate.ready` (and any equivalent readiness signal) MUST NOT become `true` unless the most recent `final-verification` (full-phase) attempt passed for the exact tree the Reviewer approved; focused-only validation passing MUST NOT satisfy this gate under any strategy or configuration.
- **FR-006**: If `final-verification` fails (command failure, timeout, or interruption) after an Approved decision, the workflow MUST NOT hard-block immediately; it MUST route to `fix` (reusing the existing `fix → revalidate → re-review` loop) up to a dedicated `fullValidationFixCycleCount` ceiling (capped by the same value as `--max-fix-cycles`), tracked separately from Reviewer-requested `fixCycleCount`, and MUST hard-block with a distinct reason once that ceiling is exceeded.
- **FR-007**: If `final-verification`'s commands modify the tracked working tree (detected via a before/after diff-signature comparison), the workflow MUST treat this identically to a `final-verification` failure (FR-006) rather than proceeding to `human-merge-decision`.
- **FR-008**: Every validation record (`state.validationRuns[]`) MUST additively record `phase` (`"focused"` or `"full"`), `triggerReason` (one of a fixed enum: `initial-implementation`, `reviewer-fix`, `full-validation-retry`, `manual-request`, `resume-revalidation`), and a `target` (`{ commit, dirty, dirtyHash }`) describing the exact tree state validated; missing `phase` on legacy records MUST be interpreted as `"full"`.
- **FR-009**: Every review record (`state.reviewRuns[]`) MUST additively record the same `target` shape describing the exact tree state reviewed, so it can be compared against the `final-verification` target for exact-match readiness.
- **FR-010**: The workflow MUST expose a deterministic exact-match comparison between the latest Approved review's `target` and the latest `final-verification` attempt's `target`; readiness MUST be `false` whenever this comparison fails, is inconclusive, or either target is missing, and `commits.exactCommitMatch` MUST report `true`/`false` only when both targets are present, `"unknown"` otherwise (never fabricated).
- **FR-011**: `--force-full-validation` MUST cause the next validation occurrence(s) in that invocation to run the full command list regardless of strategy, MUST NOT skip any stage, MUST NOT modify `fixCycleCount`, and MUST NOT mark anything ready by itself.
- **FR-012**: `--skip-validation` MUST continue to skip every validation occurrence (focused and full alike) in that invocation and MUST make `humanGate.ready` unreachable for that invocation (validation status `"skipped"`, never `"passed"`); a skipped `final-verification` MUST NOT reach `human-merge-decision`/`"Ready for human merge decision"` at the orchestration-decision level either — the two readiness signals (run-summary and top-level orchestration decision/CLI exit code) MUST never disagree about whether skipping permits readiness.
- **FR-013**: Unsafe-command rejection (`assertSafeValidationCommand`, remote-mutation rejection) MUST apply identically to focused and full command lists, before any subprocess spawns, with no separate or weaker code path for either.
- **FR-014**: The run summary MUST report focused and full validation as distinct nested sections (`validation.focused`, `validation.full`) with their own `status` and `attempts` count, in addition to the existing flat `validation.commands[]` array (each entry gaining an additive `phase` field) and the existing aggregate `validation.status`, which MUST mirror the full phase's status (not the focused phase's), so a focused-only pass is never reported as aggregate `"passed"`.
- **FR-015**: The run-summary Markdown renderer MUST show the configured strategy, focused attempts/result, and full attempts/result as distinct lines, and MUST NOT print a bare `Validation: Passed` unless the full phase specifically passed.
- **FR-016**: `schemaVersion` MUST remain `1`; every new field MUST be additive to the existing normalized model, and every existing field's meaning MUST be preserved for old consumers (see Clarifications for the specific mapping of `commits.exactCommitMatch`).
- **FR-017**: Re-invoking `orchestrate` on a state file already at a terminal stage (`human-merge-decision` or `blocked`) MUST NOT re-execute any validation stage (existing `TERMINAL_STAGES` guard, unmodified) — this feature MUST NOT introduce a path that redundantly re-runs full validation for an unchanged implementation target.
- **FR-018**: `previewOrchestration`'s dry-run output MUST report the resolved strategy, both command lists, and which phase would run next (with a reason), MUST NOT execute any command, spawn any process, write state, or write any artifact, and MUST preserve the existing `validationCommands` field for backward compatibility with existing dry-run consumers.
- **FR-019**: This feature MUST NOT modify production `src/` files, MUST NOT weaken any existing Spec 045/048/049/050/051/052/053/054 safety, validation, role-resolution, or summary behavior, and MUST limit changes to `tools/agent-workflow/`, `specs/055-focused-validation-review-loop/`, `AGENTS.md`, `CLAUDE.md`, `.specify/feature.json`, and related workflow documentation.

### Key Entities *(include if feature involves data)*

- **Validation Policy**: The resolved `{ strategy, focusedCommands, fullCommands }` used for a given invocation, resolved from CLI flags, state, and documented defaults/fallbacks.
- **Validation Phase**: `"focused"` or `"full"`, describing which command list a given validation occurrence used.
- **Validation Target**: `{ commit, dirty, dirtyHash }`, the exact tree state a validation or review record covers.
- **Trigger Reason**: One of the fixed enum values describing why a validation occurrence ran.
- **Full Validation Fix Cycle Count**: A counter, separate from Reviewer-requested `fixCycleCount`, tracking `fix` stage entries caused by a `final-verification` failure or tree modification, capped by the same `--max-fix-cycles` value.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Under `focused-final-full`, a multi-fix-cycle run executes the full command list exactly once (at `final-verification`), regardless of how many focused fix cycles preceded it.
- **SC-002**: `humanGate.ready` is `false` for every run state where the full phase has not passed, including when focused validation passed and the Reviewer approved.
- **SC-003**: A `final-verification` failure after Approved never hard-blocks immediately; it routes to `fix` up to the dedicated ceiling, and a fresh Reviewer decision is required before `final-verification` runs again.
- **SC-004**: `full-every-cycle` (explicit or default) reproduces byte-for-byte the same stage sequence and command execution as pre-Spec-055 behavior for an equivalent state file.
- **SC-005**: The run summary reports focused and full attempts/status as distinct fields, and `validation.status` never reports `"passed"` when only the focused phase has passed.
- **SC-006**: `orchestrate --dry-run` with any validation-strategy flags writes zero state changes, zero artifacts, and spawns zero processes, while still reporting the resolved strategy, both command lists, and the next phase.
- **SC-007**: Existing Spec 045/048/049/050/051/052/053/054 focused tests remain green without modification to their assertions.

## Assumptions

- "Full validation" and "focused validation" both execute through the exact same command-safety and subprocess-execution path (`runValidationCommands`/`assertSafeValidationCommand`); this feature changes only *which command list* is selected for a given occurrence, never *how* a command list is executed or safety-checked.
- The existing `validate → review → [fix → revalidate → re-review]* → final-verification → human-merge-decision` stage sequence is sufficient to express "focused during iteration, full before the human gate" without introducing new stage names; this feature reuses it rather than replacing it.
- A `final-verification` failure being made fix-capable (FR-006) is additive to, not a replacement for, focused validation's existing hard-block-on-failure behavior, which this feature leaves unchanged.
