# Tasks: Agent Runner Configuration and Real CLI Usage Guide

**Input**: Design documents from `specs/045-agent-runner-configuration-guide/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required for dry-run, diagnostics, and safety regression coverage. Tests must use fake adapters only.

## Phase 1: Setup

**Purpose**: Establish Spec Kit pointers and committed examples.

- [x] T001 Update `.specify/feature.json` and `AGENTS.md` to point at `specs/045-agent-runner-configuration-guide`
- [x] T002 [P] Add safe example workflow state in `tools/agent-workflow/examples/codex-claude-state.json`
- [x] T003 [P] Add safe runner config example in `tools/agent-workflow/examples/local-runner-config.json`

---

## Phase 2: Dry-Run Preview (US1)

**Goal**: Preview a workflow run without spawning any agent CLI.

**Independent Test**: Dry-run returns stage, selected agent, command, prompt path, run directory, and next expected step while fake adapters are not called.

- [x] T004 [US1] Add dry-run preview tests in `tools/agent-workflow/agentWorkflowRun.test.ts`
- [x] T005 [US1] Implement dry-run summary helpers in `tools/agent-workflow/agentWorkflowRun.js`
- [x] T006 [US1] Wire `run --dry-run` output in `tools/agent-workflow/cli.js`

---

## Phase 3: Runner Diagnostics (US2)

**Goal**: Make CLI configuration and availability failures clear.

**Independent Test**: Diagnostics reports available, missing, missing-config, and unsafe runner states with fake adapters.

- [x] T007 [US2] Add diagnostics tests in `tools/agent-workflow/agentRunner.test.ts`
- [x] T008 [US2] Implement runner diagnostics helpers in `tools/agent-workflow/agentRunner.js`
- [x] T009 [US2] Wire `diagnose` and state-aware `detect-agent` output in `tools/agent-workflow/cli.js`
- [x] T010 [US2] Improve failed run and timeout summary messages in `tools/agent-workflow/cli.js`

---

## Phase 4: Usage Guide (US3)

**Goal**: Document real local setup and safe operating flow.

**Independent Test**: README and quickstart describe CLI install/check, configuration, dry-run, one-stage run, until-blocked run, log inspection, and manual merge.

- [x] T011 [US3] Update `tools/agent-workflow/README.md` with real local usage flow and safety notes
- [x] T012 [US3] Verify example files contain no credentials and `.agent-workflow/` remains gitignored

---

## Phase 5: Validation and Commit

**Purpose**: Verify all tasks and safety gates before local commit.

- [x] T013 Run `npm test`
- [x] T014 Run `npx tsc --noEmit`
- [x] T015 Run `npm run build`
- [x] T016 Run `git diff --check`
- [x] T017 Run `git diff --cached --check`
- [x] T018 Commit locally with a clear message

## Dependencies & Execution Order

- Phase 1 before all implementation phases.
- Phase 2 before CLI README examples that mention dry-run.
- Phase 3 can run after Phase 1 and independently of Phase 2, but both must finish before Phase 4.
- Phase 5 after all feature work.

## Implementation Strategy

1. Deliver dry-run first as the MVP safety affordance.
2. Add diagnostics without changing execution semantics.
3. Document the real usage path after commands are test-covered.
4. Validate and commit once the feature is complete.
