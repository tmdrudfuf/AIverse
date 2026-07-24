# Tasks: Agent Workflow Automated Fix Loop

**Input**: Design documents from `specs/049-agent-workflow-automated-fix-loop/`

**Prerequisites**: spec.md, plan.md, research.md, data-model.md, contracts/

**Tests**: Required. Use deterministic mock runners and validation commands; do not call live Codex or Claude from automated tests.

## Phase 1: Setup

**Purpose**: Align Spec Kit pointers and inspect reusable workflow helpers.

- [X] T001 Inspect `tools/agent-workflow/agentRunner.js`, `agentWorkflow.js`, `agentWorkflowRun.js`, `reviewCommand.js`, `cli.js`, and workflow templates
- [X] T002 Update `.specify/feature.json` to `specs/049-agent-workflow-automated-fix-loop`
- [X] T003 Update `AGENTS.md` SPECKIT pointer to `specs/049-agent-workflow-automated-fix-loop/plan.md`

---

## Phase 2: User Story 1 - Run the Complete Local Loop With One Command (Priority: P1)

**Goal**: Add `orchestrate` and `orchestrate --dry-run` for the direct approval path.

**Independent Test**: Mock Implementer, validation, and Reviewer produce an approved workflow ending at `human-merge-decision`.

- [X] T004 [P] [US1] Add `tools/agent-workflow/templates/orchestrate-implement.md`
- [X] T005 [P] [US1] Add direct approval and dry-run tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T006 [US1] Implement role preview, plan preview, and Implementer prompt building in `tools/agent-workflow/orchestrateCommand.js`
- [X] T007 [US1] Implement validation command execution and artifact recording in `tools/agent-workflow/orchestrateCommand.js`
- [X] T008 [US1] Implement direct approval orchestration and persistence in `tools/agent-workflow/orchestrateCommand.js`
- [X] T009 [US1] Wire `orchestrate` and `orchestrate --dry-run` in `tools/agent-workflow/cli.js`

---

## Phase 3: User Story 2 - Apply Bounded Fix Cycles From Actionable Findings (Priority: P1)

**Goal**: Feed actionable Reviewer findings to the Implementer, validate, re-review, and stop at approval or max cycles.

**Independent Test**: Mock Reviewer returns Changes Requested then Approved; repeated Changes Requested stops at the configured limit.

- [X] T010 [P] [US2] Add one-fix-cycle, max-cycle, non-actionable, and no-change-fix tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T011 [US2] Implement conservative review finding extraction in `tools/agent-workflow/orchestrateCommand.js`
- [X] T012 [US2] Implement focused fix prompt construction in `tools/agent-workflow/orchestrateCommand.js`
- [X] T013 [US2] Implement fix-cycle loop, max-cycle blocking, and no-change guard in `tools/agent-workflow/orchestrateCommand.js`

---

## Phase 4: User Story 3 - Stop Safely on Failures and Resume From Completed Stages (Priority: P2)

**Goal**: Stop conservatively on failures and resume from completed checkpoints.

**Independent Test**: Mock validation failure, Reviewer Unknown, Implementer timeout, Reviewer timeout, unsafe runner, role swap, BOM state, and resume.

- [X] T014 [P] [US3] Add validation failure, timeout, unsafe runner, role swap, BOM state, and resume tests in `tools/agent-workflow/orchestrateCommand.test.ts`
- [X] T015 [US3] Implement resumable state-stage detection in `tools/agent-workflow/orchestrateCommand.js`
- [X] T016 [US3] Implement conservative terminal state recording for validation failure, unknown review, timeout, execution failure, missing runner, unsafe runner, branch change, and malformed state
- [X] T017 [US3] Ensure state writes are atomic in `tools/agent-workflow/agentWorkflow.js`

---

## Phase 5: Documentation and Validation

**Purpose**: Document usage and validate the complete feature.

- [X] T018 Update `tools/agent-workflow/README.md` with `orchestrate`, state examples, flows, dry-run, resume, timeout, and safety boundaries
- [X] T019 Run focused workflow tests
- [X] T020 Run `npm test`
- [X] T021 Run `npx tsc --noEmit`
- [X] T022 Run `npm run build`
- [X] T023 Run `git diff --check`
- [X] T024 Run `run-review --dry-run` and one bounded real Reviewer run (real Reviewer run timed out; artifacts preserved)
- [X] T025 Confirm no product `src/` files changed, no generated runtime artifacts staged, and no remote mutation occurred

## Dependencies & Execution Order

- Phase 1 before implementation.
- US1 before US2 and US3.
- US2 before max-cycle and no-change fix behavior can be complete.
- US3 before final validation.
- Phase 5 after implementation.

## Implementation Strategy

1. Build the direct approval MVP first.
2. Add bounded fix cycles and finding extraction.
3. Add failure/resume guards.
4. Validate with focused tests, full suite, CLI dry-runs, and independent review.
