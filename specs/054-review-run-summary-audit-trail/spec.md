# Feature Specification: Review Run Summary and Audit Trail

**Feature Branch**: `codex/review-run-summary-audit-trail`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Add a concise, deterministic, machine-readable and human-readable summary for each orchestration run (`run-summary.json` / `run-summary.md`), derived from persisted workflow evidence, that answers who ran as Implementer/Reviewer, what stages ran, validation results, review/fix cycle counts, finding lifecycle aggregates, commit provenance, and human-gate readiness — without claiming success the run did not prove."

## Clarifications

### Session 2026-07-26

- Q: The suggested file layout nests summaries under a per-run-id directory (`.agent-workflow/runs/<feature-id>/<run-id>/run-summary.json`). Does the repository's actual run-directory structure support that? → A: No. `getRunDirectory` produces one flat directory per feature (`.agent-workflow/runs/<feature-id>/`); there is no per-run subdirectory concept anywhere in the existing artifact layout. This feature places `run-summary.json`/`run-summary.md` directly in that existing flat directory — one canonical, refreshed-in-place pair per feature, matching every other artifact in that directory.
- Q: The suggested filename `clarifications.md` — is that this repository's convention? → A: No. Spec 053 already established the convention of a `## Clarifications` section inside `spec.md` (added by commit `65b9c02`), with no separate `spec-template.md` section for it. This spec follows that established convention rather than introducing a new file.
- Q: Should `run-summary.json`/`.md` be written incrementally at every internal stage transition inside the `orchestrate` loop (~10 call sites), or once per CLI invocation? → A: Once per invocation, at the natural end of `runOrchestration()`'s internal loop (which already runs synchronously to a stopping point — terminal stage, blocked, or an uncaught throw before any stage starts). Every internal stopping condition (validation failure, timeout, interruption, invalid structured review, blocked, human-merge-decision) is reached by falling out of that same loop before the function returns, so a single call site captures all of them. A genuine OS-level kill of the parent process (never returns from `runOrchestration` at all) is the one case this cannot cover; the read-only `summary` CLI command compensates by rebuilding the summary fresh from current state on demand rather than trusting a possibly-stale cached file.
- Q: Should the `summary` CLI command render the cached `run-summary.json` file, or recompute from state each time? → A: Recompute from state each time, using the same pure `buildRunSummary(state, options)` function used to write the cached artifact. This makes the command trivially read-only (no dependency on a previous write having succeeded), naturally handles old runs that predate this feature, and can never go stale relative to the state file it is pointed at.
- Q: `state.reviewRuns[]` entries (existing, from Spec 048/053) do not record which review stage (`review` / `re-review` / `final-review`) produced them. Is inferring this from array position acceptable? → A: No, that is fragile. This feature adds an additive `stage` field to the `reviewRunRecord` object built in `runReviewWithoutStateWrite` (`orchestrateCommand.js`). Existing/old records without `stage` are tolerated by the summary builder (reported as `"unknown"`), preserving backward compatibility.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand a Completed Run Without Reading Every Artifact (Priority: P1)

An AIverse maintainer runs `orchestrate --implementer claude` to completion (or to a blocked/human-merge-decision stopping point) and wants a single, trustworthy answer to "what happened, is it safe to act on, and what's left to do" without opening every prompt, execution record, and validation log by hand.

**Why this priority**: This is the entire point of the feature — the workflow already produces a rich but scattered audit trail; without a summary, verifying a run's readiness (as demonstrated by the Spec 053 PR #44 verification gate) requires hand-assembling facts from many files every time.

**Independent Test**: Run a mock-driven orchestration to `Approved` → `final-verification passed` → human-merge-decision, then read `.agent-workflow/runs/<feature-id>/run-summary.json` and `run-summary.md` and confirm both report: correct Implementer/Reviewer identities and role source, `status: "awaiting-human-decision"`, `review.finalDecision: "Approved"`, `validation.status: "passed"`, `findings.remainingBlocking: 0`, `humanGate.ready: true`, and no claim of push/PR/merge having happened.

**Acceptance Scenarios**:

1. **Given** a run that reaches `human-merge-decision` with an Approved review and passing validation, **When** the run completes, **Then** both summary artifacts report `status: "awaiting-human-decision"`, the correct roles, `humanGate.ready: true`, and matching semantic content between JSON and Markdown.
2. **Given** the same run, **When** a maintainer inspects `run-summary.md`, **Then** it is concise, scannable, and includes a "Human decision" section stating no remote mutation was performed automatically.

---

### User Story 2 - Never Report False Success (Priority: P1)

A maintainer must never be misled into thinking a run is ready for merge when it is not — the run summary must reflect exactly what the persisted workflow evidence proves, and no more.

**Why this priority**: A summary that overstates readiness is worse than no summary at all; this is the same "do not treat malformed/Unknown output as approval" discipline already required of the review pipeline (Spec 048/050), now applied to the summary layer.

**Independent Test**: Drive mock runs through Changes Requested, Unknown decision, invalid structured review, validation failure, and timeout paths, and confirm each summary reports `humanGate.ready: false`, a normalized `stopReason` where applicable, and never reports `review.finalDecision: "Approved"` or `status: "completed"`/`"awaiting-human-decision"` for any of them.

**Acceptance Scenarios**:

1. **Given** a Reviewer run that times out, **When** the summary is built, **Then** `run.status` is `"timed-out"`, `humanGate.ready` is `false`, and `review.finalDecision` is not `"Approved"`.
2. **Given** a required validation command that fails, **When** the summary is built, **Then** `validation.status` is `"failed"`, `run.stopReason` is `"validation-failed"`, and `humanGate.ready` is `false`.
3. **Given** a structured review that is malformed (invalid), **When** the summary is built, **Then** `review.structuredReviewStatus` is `"invalid"`, `review.finalDecision` is not reported as `"Approved"`, and `humanGate.ready` is `false`.

---

### User Story 3 - Track Fix/Question Cycles and Finding Lifecycle at a Glance (Priority: P2)

A maintainer resuming or auditing a multi-cycle run wants to see, without reconstructing it manually, how many Reviewer question cycles and fix cycles occurred, and which findings are new, carried forward, resolved, or still blocking.

**Why this priority**: This is the primary value-add over reading raw artifacts one at a time; Spec 051 (question loop) and Spec 052 (finding lifecycle) already persist this data, but nothing aggregates it into one place today.

**Independent Test**: Drive a mock run through Questions → answered → Changes Requested (F1) → fix → re-review (F1 resolved) → Approved, and confirm the summary reports `questionCycles: 1`, `fixCycles: 1`, `findings.opened: 1`, `findings.resolved: 1`, `findings.remainingBlocking: 0`, and finding `F1` with `status: "resolved"`.

**Acceptance Scenarios**:

1. **Given** a run with one question cycle and one fix cycle, **When** the summary is built, **Then** `review.questionCycles` and `review.fixCycles` match the persisted `state.questionCycle`/`state.fixCycleCount` exactly.
2. **Given** a finding opened in review attempt 1 and resolved in review attempt 2, **When** the summary is built, **Then** the finding's `openedReviewAttempt`/`resolvedReviewAttempt` match the persisted `firstSeenReviewSequence`/`resolvedReviewSequence`, and aggregate counts are internally consistent (`opened = resolved + remainingBlocking + remainingNonBlockingOpen`, scoped per kind).

---

### User Story 4 - Resume Without Losing or Duplicating History (Priority: P2)

A maintainer resumes an interrupted or blocked run on the same state file, and expects the summary to keep reporting the same logical run's full history — not a fresh, empty one, and not duplicated stage entries.

**Why this priority**: Directly parallels the Spec 053 "resume must not silently change roles" guarantee; a summary that fabricates duplicate stages or loses prior evidence on resume would itself become a source of false confidence.

**Independent Test**: Stop a mock run after `Changes Requested`, resume it to `Approved`, and confirm the summary's stage timeline contains exactly one entry per actual stage attempt (no duplicates), roles are unchanged from the original resolution, and cycle counts reflect the full run, not just the resumed portion.

**Acceptance Scenarios**:

1. **Given** a run resumed after a fix cycle, **When** the summary is rebuilt, **Then** the stage timeline includes both the original and resumed stages in order, with no duplicate entries for stages that did not re-run.
2. **Given** the same resumed run, **When** roles were resolved via `--implementer` on the first invocation and the resume omits `--implementer`, **Then** the summary reports the original resolved roles and role source, not newly recalculated defaults.

---

### User Story 5 - Inspect a Run Without Side Effects (Priority: P3)

A maintainer wants to check the current summary of a run (including old runs that predate this feature) without risking any mutation, spawn, or validation execution.

**Why this priority**: Read-only inspection must be as safe as `--dry-run`, matching the workflow's existing human-only remote-mutation and no-surprise-mutation guarantees.

**Independent Test**: Run `node tools/agent-workflow/cli.js summary --state <state.json>` against (a) a state file from a completed run and (b) an old state file with no Spec 054 fields at all, and confirm both print a summary (the second with explicit "unknown"/absent markers rather than fabricated data), and that neither invocation spawns a process, writes state, or writes any artifact.

**Acceptance Scenarios**:

1. **Given** any state file, **When** `summary` is run, **Then** no process is spawned, no state file is written, and no `run-summary.*` artifact is written or rewritten.
2. **Given** an old state file predating Spec 054, **When** `summary` is run, **Then** it produces a safe partial summary with explicit unknown/absent markers instead of crashing or fabricating data.

### Edge Cases

- Dry-run orchestration (`orchestrate --dry-run`) must not write `run-summary.json`/`.md`, matching every other dry-run guarantee (no state write, no artifact write, no spawn).
- A run blocked before any agent spawns (e.g. unsafe runner rejected, role resolution failed) produces no summary at all for that invocation, since `runOrchestration` throws before reaching its own return statement — this is correct, not a defect: no run occurred to summarize, and Spec 045 runner-safety rejection must not be reported as if agent execution happened.
- A run whose Reviewer output is Unknown (ambiguous decision) must report `review.finalDecision: "Unknown"` and `humanGate.ready: false`, never inferring approval from surrounding prose.
- A summary-write failure (e.g. disk full, permission error) must never prevent the primary `state` file write, since state is always persisted via the existing `writeState` before the summary is attempted, and summary writing is wrapped so its own failure can only downgrade to a printed warning.
- Two different state files that happen to share the same `featureId` will share one run directory and therefore one summary pair; this is an existing repository convention (one state file = one feature = one run directory), not a new risk introduced by this feature, and is documented rather than solved here.
- Missing optional artifacts (e.g. a validation log file deleted after the fact) must produce a warning entry in the summary, not a crash, and must not silently claim the missing evidence still exists.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST generate `run-summary.json` (normalized source of truth) and `run-summary.md` (deterministic human-readable rendering of the same data) for every `orchestrate` invocation that reaches the end of `runOrchestration`'s internal loop, whether it stops at `human-merge-decision`, `blocked`, or exhausts a resumed loop.
- **FR-002**: Both artifacts MUST be derived from a single normalized summary model (`buildRunSummary`), with the JSON produced by direct serialization and the Markdown produced by a pure renderer over that same model; there MUST NOT be two independent summary-generation code paths.
- **FR-003**: Summary artifacts MUST be written to the existing flat per-feature run directory (`getRunDirectory(state, options)`), not to a new or tracked location, and `.agent-workflow/` MUST remain gitignored.
- **FR-004**: The summary schema MUST be versioned (`schemaVersion`) and MUST distinguish absent, unknown, failed, and not-applicable information; it MUST NOT convert unknown or absent evidence into a false success signal.
- **FR-005**: `run.status` MUST use one of a fixed set of deterministic values (`planned`, `running`, `blocked`, `failed`, `interrupted`, `timed-out`, `completed`, `awaiting-human-decision`) with an exact, documented mapping from persisted orchestration state; free-form status strings MUST NOT be introduced.
- **FR-006**: A run that stops at the human merge boundary MUST report `status: "awaiting-human-decision"`, never a status implying remote delivery (merged, pushed, PR'd) occurred.
- **FR-007**: When a run does not reach `human-merge-decision`, the summary MUST record a normalized `stopReason` from a fixed set (`validation-failed`, `changes-requested-limit-reached`, `reviewer-questions-unresolved`, `structured-review-invalid`, `review-decision-unknown`, `timeout`, `interrupted`, `unsafe-runner`, `role-resolution-failed`, `command-failed`, `state-invalid`, `manual-stop`), derived from existing structured state (`orchestration.reason`, review/validation outcomes), not inferred from free-form log prose when structured state already provides one.
- **FR-008**: The summary MUST report the exact effective Implementer/Reviewer roles and role source for the run, sourced from the Spec 053 persisted fields (`orchestration.resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource`, falling back to `latestResolvedRoles`/`latestRoleResolutionSource` for non-orchestration-scoped or legacy data); a resumed run MUST report the original pinned roles, not newly recalculated defaults.
- **FR-009**: The summary MUST include a stage timeline derived from persisted, durable evidence (`state.orchestrationRuns`, `state.reviewRuns`, `state.validationRuns`) rather than from any single invocation's ephemeral in-memory step list, so that resuming a run does not lose prior-invocation stage history or duplicate stages that did not re-run.
- **FR-010**: The summary MUST report each validation command separately (command text, status, exit code, timing, artifact path) using the existing `validationRuns` records, and MUST support `passed`, `failed`, `timed-out`, `interrupted`, `skipped`, and `not-run` statuses; overall validation status MUST NOT be `"passed"` if any required command failed, timed out, was interrupted, or never ran. Validation explicitly skipped via `--skip-validation` MUST be reported distinctly from validation that was expected but did not run.
- **FR-011**: The summary MUST report the Reviewer identity, reviewed-commit evidence, structured review validity, final decision (`Approved`/`Changes Requested`/`Unknown`, matching existing conventions), review attempt count, question cycle count, fix cycle count, and blocking/non-blocking finding counts; it MUST NOT reinterpret `Unknown`, timeout, incomplete output, or malformed structured review as `Approved`.
- **FR-012**: The summary MUST integrate Spec 052 finding lifecycle data (`state.findingHistory`), reporting per-finding `findingId`, `severity`, `summary`, `status`, `openedReviewAttempt`, `resolvedReviewAttempt` (when resolved), and artifact paths, plus aggregate counts for newly opened, carried forward, resolved, remaining blocking, and remaining non-blocking; it MUST NOT invent findings from log prose when normalized lifecycle state already exists for that review.
- **FR-013**: Where available, the summary MUST report base commit, implementation-adjacent branch/commit context, and reviewed-commit evidence, and MUST explicitly represent unavailable commit evidence as unknown/null rather than fabricating a match; it MUST NOT claim an exact-commit review match without persisted evidence for it.
- **FR-014**: The summary MUST clearly state whether the next action belongs to a human, using a fixed set of human-gate states, and MUST NOT claim a PR exists unless the run has direct persisted evidence of one (this workflow currently has none, so PR-related states are not claimed).
- **FR-015**: The summary MUST include an artifact index (relative paths) of significant detailed artifacts (implementation/review/validation/lifecycle/question/answer records) without embedding large raw logs into `run-summary.json`.
- **FR-016**: Summary generation MUST be triggered after `runOrchestration`'s internal loop reaches its stopping point (once per invocation), MUST write atomically (temp file + rename, matching `writeState`'s existing pattern) to avoid partially written JSON, and MUST tolerate resume without duplicating stage history.
- **FR-017**: A failure while writing summary artifacts MUST NOT corrupt or block the primary `state` file write; it MUST be caught and reported only as a warning (in CLI output), since the state write always happens first via the existing, unmodified `writeState` call.
- **FR-018**: Given equivalent normalized run state, `run-summary.json` and `run-summary.md` output MUST be deterministic except for legitimate timestamp/duration fields: stable stage/finding/artifact ordering (derived from persisted array order, not filesystem enumeration or object insertion order), consistent newline handling, and both files MUST end with exactly one trailing newline.
- **FR-019**: The summary MUST NOT copy secret-bearing values (API keys, access tokens, cookies, authorization headers, complete secret-bearing environment values) into either artifact; raw stdin prompts and full combined Reviewer/Implementer output remain in their existing detailed audit artifacts (referenced by path) and MUST NOT be copied into the summary body.
- **FR-020**: `orchestrate --dry-run` MUST NOT write `run-summary.json`/`.md`; it MAY print a preview stating that summaries would be generated during a real run, consistent with dry-run's existing no-mutation guarantees (no process spawn, no validation, no state write, no artifact write, no remote mutation).
- **FR-021**: A new read-only `summary` CLI command MUST render the latest logical run summary for a supplied state file by recomputing it fresh from current state (via the same `buildRunSummary` function used elsewhere), supporting `--format markdown|json` (default markdown); it MUST NOT spawn agents, run validation, mutate state, rewrite artifacts, or perform remote mutation under any invocation.
- **FR-022**: The summary builder MUST NOT crash when an optional artifact (validation log, structured review file, lifecycle artifact) is missing, malformed, or references a nonexistent path; it MUST report an explicit warning in the summary rather than silently omitting the fact or fabricating the missing data. Missing evidence that is required for readiness (e.g. no reviewed-commit evidence at all) MUST cause `humanGate.ready` to be `false`, not merely a cosmetic warning.
- **FR-023**: Old state files and run directories created before this feature MUST remain fully readable; the summary builder MUST derive a safe partial summary from whatever fields are present, MUST NOT rewrite or migrate old state or old run artifacts merely because they were read, and MUST NOT assume every historical run used Spec 053 runtime role selection or Spec 052 finding lifecycle tracking.
- **FR-024**: This feature MUST NOT modify production `src/` files, MUST NOT weaken any existing Spec 045/048/049/050/051/052/053 safety, validation, or role-resolution behavior, and MUST limit changes to `tools/agent-workflow/`, `specs/054-review-run-summary-audit-trail/`, `AGENTS.md`, `CLAUDE.md`, `.specify/feature.json`, and related workflow documentation.

### Key Entities *(include if feature involves data)*

- **Run Summary**: The normalized, versioned model built by `buildRunSummary(state, options)` — the single source of truth serialized to `run-summary.json` and rendered to `run-summary.md`.
- **Run Status**: One of the fixed `run.status` enum values (Requirement FR-005), computed deterministically from persisted orchestration/validation/review state.
- **Stop Reason**: One of the fixed `run.stopReason` enum values (Requirement FR-007), populated only when the run does not reach `human-merge-decision`.
- **Stage Timeline Entry**: One durable record per actual stage attempt, derived from `state.orchestrationRuns`/`state.reviewRuns`/`state.validationRuns`, not from any single invocation's transient step list.
- **Validation Command Summary**: One record per validation command actually attempted (or explicitly skipped), derived from `state.validationRuns`.
- **Finding Summary**: One record per entry in `state.findingHistory`, plus aggregate counts, integrating Spec 052 finding lifecycle tracking.
- **Human Gate**: The fixed set of states describing whether/what human remote-mutation decision is pending, and whether the run is actually ready for it.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A clean Approved run produces both summary artifacts reporting `status: "awaiting-human-decision"`, correct roles, `validation.status: "passed"`, `findings.remainingBlocking: 0`, and `humanGate.ready: true`.
- **SC-002**: Changes Requested, Unknown decision, invalid structured review, validation failure, and timeout paths each produce a summary with `humanGate.ready: false` and never report `review.finalDecision: "Approved"`.
- **SC-003**: A run driven through one question cycle and one fix cycle reports `questionCycles: 1`, `fixCycles: 1`, and correct finding lifecycle aggregates matching persisted `state.findingHistory`.
- **SC-004**: A resumed run's stage timeline contains no duplicate entries for stages that did not re-run, and reports the original resolved roles, not newly recalculated defaults.
- **SC-005**: `orchestrate --dry-run` writes zero summary artifacts, zero state changes, and spawns zero processes.
- **SC-006**: The `summary` CLI command is read-only under every tested input, including old state files with no Spec 054 fields, and never crashes on a missing optional artifact.
- **SC-007**: Given equivalent normalized state, repeated summary generation produces byte-identical output apart from timestamp/duration fields.
- **SC-008**: Existing Spec 045/048/049/050/051/052/053 focused tests remain green without modification to their assertions.

## Assumptions

- One state file corresponds to one feature and one flat run directory (`getRunDirectory`), matching every existing artifact-writing call site in this codebase; this feature does not introduce per-run subdirectories.
- "Resume" retains its Spec 053 meaning: re-invoking `orchestrate` on the same state file while `orchestration.startedAt` is present and the current stage is non-terminal.
- The workflow has no mechanism today for exposing an actual GitHub PR's existence to the state file, so PR-specific human-gate states are defined for future use but are not claimed as evidence-backed today.
- Summary generation happening once per CLI invocation (at the natural end of `runOrchestration`'s already-synchronous loop) is an accurate and sufficient interpretation of "update after meaningful persisted state transitions," since every internal stopping condition already causes the loop to exit before that same return point.
