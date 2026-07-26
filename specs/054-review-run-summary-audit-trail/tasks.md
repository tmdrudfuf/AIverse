# Tasks: Review Run Summary and Audit Trail

**Input**: Design documents from `specs/054-review-run-summary-audit-trail/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required by the specification for schema normalization, summary building, Markdown rendering, CLI summary command, dry-run safety, resume/no-duplication, redaction, and backward compatibility.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare feature pointers and inspect existing state/artifact seams this feature reads from.

- [x] T001 Update `.specify/feature.json` to `specs/054-review-run-summary-audit-trail`
- [x] T002 Update the SPECKIT pointer in `AGENTS.md` to `specs/054-review-run-summary-audit-trail/plan.md`
- [x] T003 [P] Inspect `state.orchestration`/`orchestrationRuns`/`reviewRuns`/`validationRuns`/`findingHistory` shapes in `tools/agent-workflow/orchestrateCommand.js`
- [x] T004 [P] Inspect `getRunDirectory`/`createRunFilePath`/`writeState`'s atomic-write pattern in `tools/agent-workflow/agentWorkflow.js`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the pure schema/model layer before any command wiring depends on it.

- [x] T005 Implement `tools/agent-workflow/runSummarySchema.js`: `SCHEMA_VERSION`, `RUN_STATUSES`, `STOP_REASONS`, `VALIDATION_STATUSES`, `HUMAN_GATE_STATES`, and normalization helpers (`normalizeRunStatus`, `normalizeStopReason`, `normalizeValidationStatus`)
- [x] T006 [P] Add `tools/agent-workflow/runSummarySchema.test.ts` covering every enum value and rejection of unrecognized free-form values
- [x] T007 Implement `tools/agent-workflow/runSummary.js`: pure `buildRunSummary(state, options)` covering `run`, `roles`, `execution`, `stageTimeline`, `validation`, `review`, `findings`, `commits`, `humanGate`, `artifacts`, `warnings`
- [x] T008 [P] Add `tools/agent-workflow/runSummary.test.ts` covering the full contract in `contracts/run-summary-schema.md`, including its invariants

---

## Phase 3: User Story 1 - Understand a Completed Run Without Reading Every Artifact (Priority: P1) MVP

**Goal**: A clean Approved run produces both summary artifacts with correct roles, validation, review, findings, and human-gate readiness.

**Independent Test**: Drive a mock orchestration to Approved → final-verification passed → human-merge-decision and read both generated artifacts.

- [x] T009 [P] Add `tools/agent-workflow/runSummaryRenderer.js`: pure `renderRunSummaryMarkdown(summary)` matching the Markdown structure in spec.md
- [x] T010 [P] Add `tools/agent-workflow/runSummaryRenderer.test.ts` covering section presence/absence and determinism
- [x] T011 Implement `refreshRunSummary({ state, cwd, options })` in `tools/agent-workflow/runSummary.js`: atomic write of `run-summary.json`/`run-summary.md` to `getRunDirectory(state, options)`, best-effort (never throws)
- [x] T012 Add `stage: reviewStage` to the `reviewRunRecord` object in `runReviewWithoutStateWrite` (`tools/agent-workflow/orchestrateCommand.js`)
- [x] T013 Call `refreshRunSummary` once, immediately before `runOrchestration`'s `return` statement, threading the result (`summaryPaths`, `summary`, `summaryWarning`) into the returned object (`tools/agent-workflow/orchestrateCommand.js`)
- [x] T014 Add `formatOrchestrationSummaryPointer(run)` and wire it into the `orchestrate` command's non-dry-run success path in `tools/agent-workflow/cli.js`
- [x] T015 [P] Add success-path summary tests (Approved/human-merge-decision) in `tools/agent-workflow/orchestrateCommand.test.ts`

---

## Phase 4: User Story 2 - Never Report False Success (Priority: P1)

**Goal**: Changes Requested, Unknown, invalid structured review, validation failure, and timeout paths never report readiness or Approved.

**Independent Test**: Drive each failure path and confirm `humanGate.ready: false` and no false `Approved`/`awaiting-human-decision` claim.

- [x] T016 [P] Add stop-reason mapping tests (validation failure, timeout, interrupted, Unknown decision, invalid structured review, unresolved questions, max fix cycles, unsafe runner never reaching a run at all) in `tools/agent-workflow/runSummary.test.ts`
- [x] T017 [P] Add matching end-to-end tests in `tools/agent-workflow/orchestrateCommand.test.ts` for each failure path, asserting on the persisted/returned summary

---

## Phase 5: User Story 3 - Track Fix/Question Cycles and Finding Lifecycle at a Glance (Priority: P2)

**Goal**: Question/fix cycle counts and finding lifecycle aggregates are correct and internally consistent.

**Independent Test**: Questions → answered → Changes Requested (F1) → fix → re-review (F1 resolved) → Approved.

- [x] T018 [P] Add finding-lifecycle aggregate tests (opened/resolved/carriedForward/remainingBlocking/remainingNonBlocking, per-finding attempt numbers) in `tools/agent-workflow/runSummary.test.ts`
- [x] T019 [P] Add a question-cycle + fix-cycle end-to-end test in `tools/agent-workflow/orchestrateCommand.test.ts`

---

## Phase 6: User Story 4 - Resume Without Losing or Duplicating History (Priority: P2)

**Goal**: Resume preserves stage timeline and original role resolution.

**Independent Test**: Stop after Changes Requested, resume to Approved.

- [x] T020 [P] Add a resume test asserting no duplicate stage-timeline entries and unchanged `roles` in `tools/agent-workflow/orchestrateCommand.test.ts`
- [x] T021 [P] Add a determinism test (same state twice → identical JSON apart from timestamps) in `tools/agent-workflow/runSummary.test.ts`

---

## Phase 7: User Story 5 - Inspect a Run Without Side Effects (Priority: P3)

**Goal**: A read-only `summary` CLI command works for current and legacy state, with zero side effects.

**Independent Test**: `summary --state <state.json>` against a completed run and an old pre-Spec-054 state file.

- [x] T022 Implement `tools/agent-workflow/summaryCommand.js`: `getRunSummaryForDisplay(state, options)` (calls `buildRunSummary` directly) and `formatSummaryCommandOutput(summary, format)`
- [x] T023 [P] Add `tools/agent-workflow/summaryCommand.test.ts` covering markdown/json output, legacy state, and no-spawn/no-write guarantees
- [x] T024 Wire `summary --state <state.json> [--format markdown|json]` into `tools/agent-workflow/cli.js`, read-only (uses `readState`, never `writeState`)
- [x] T025 [P] Add `summary` command tests (missing flags, format selection, no process adapter invoked) in `tools/agent-workflow/cli.test.ts`
- [x] T026 Add dry-run-writes-nothing tests (`orchestrate --dry-run`) in `tools/agent-workflow/orchestrateCommand.test.ts` and `tools/agent-workflow/cli.test.ts`

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Redaction, missing/malformed-artifact tolerance, documentation, validation, smoke tests, independent review, and local commit.

- [x] T027 [P] Add secret-redaction tests (env-like values never copied into summary) in `tools/agent-workflow/runSummary.test.ts`
- [x] T028 [P] Add missing/malformed-optional-artifact tolerance tests (warns, does not crash, does not fabricate) in `tools/agent-workflow/runSummary.test.ts`
- [x] T029 Update `tools/agent-workflow/README.md` with summary artifact paths, schema version, statuses, stop reasons, human-gate states, dry-run behavior, `summary` command usage, backward-compatibility notes
- [x] T030 Run focused tests: `runSummarySchema`, `runSummary`, `runSummaryRenderer`, `summaryCommand`, `orchestrateCommand`, `cli`
- [x] T031 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [x] T032 Run mock-runner Smoke A (clean approval), Smoke B (questions+fix), Smoke C (validation failure), Smoke D (timeout), Smoke E (resume), Smoke F (dry-run)
- [x] T033 Request configured Codex CLI independent review using `orchestrate --implementer claude --timeout-ms 600000 --max-fix-cycles 2` (or `run-review --implementer claude` if a dedicated review-only pass is more appropriate)
- [x] T034 Address any valid blocking review findings and rerun focused/full validation and relevant smoke tests
- [x] T035 Stage intended files, run `git diff --cached --check`, and commit with `feat: add workflow run summaries`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 setup must complete before implementation.
- Phase 2 (schema + pure `buildRunSummary`) blocks all user stories.
- User Story 1 (P1) is the MVP: the write path (`refreshRunSummary`, CLI wiring) must land before User Stories 2-5, which extend the same summary content and call sites.
- User Story 2 (false-success prevention) depends on User Story 1's write path but is otherwise independent of User Stories 3-5.
- User Story 3 (cycle/finding tracking) and User Story 4 (resume) both depend on Phase 2's `buildRunSummary` and can proceed in parallel with each other.
- User Story 5 (read-only CLI command) depends only on Phase 2 (`buildRunSummary`), not on the write path, and can be built in parallel with User Stories 2-4.
- Polish depends on all user stories.

### Parallel Opportunities

- T003/T004 can run in parallel.
- T006/T008 can be drafted while the corresponding modules are implemented, contract-first.
- T016/T017, T018/T019, T020/T021, T023/T025 are natural parallel pairs (unit-level vs. end-to-end coverage of the same behavior).

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2.
2. Implement User Story 1: successful runs produce both correct, agreeing summary artifacts.
3. Validate focused tests.

### Incremental Delivery

1. Add false-success-prevention coverage across every stop reason (User Story 2).
2. Add cycle/finding-lifecycle aggregation (User Story 3) and resume safety (User Story 4).
3. Add the read-only `summary` CLI command (User Story 5).
4. Complete docs, full validation, smoke tests, independent review, and commit.
