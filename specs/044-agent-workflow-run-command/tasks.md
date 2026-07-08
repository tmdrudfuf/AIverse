# Tasks: Agent Workflow Run Command

**Input**: Design documents from `specs/044-agent-workflow-run-command/`

## Phase 1: Review and Design

- [x] T001 Inspect Spec 042 workflow architecture.
- [x] T002 Inspect Spec 043 runner architecture.
- [x] T003 Create Spec Kit artifacts for Spec 044.

## Phase 2: Run Command Implementation

- [x] T004 Add `tools/agent-workflow/agentWorkflowRun.js`.
- [x] T005 Add `run` command handling to `tools/agent-workflow/cli.js`.
- [x] T006 Update `tools/agent-workflow/README.md`.

## Phase 3: Tests

- [x] T007 Test one-stage run executes exactly one stage.
- [x] T008 Test `--until-blocked` continues and stops before human-merge-decision.
- [x] T009 Test failed run stops and does not advance.
- [x] T010 Test missing config stops before spawn.
- [x] T011 Test max-step guard.
- [x] T012 Test console/run summary shape and output paths.

## Phase 4: Validation

- [x] T013 Run `npm test`.
- [x] T014 Run `npx tsc --noEmit`.
- [x] T015 Run `npm run build`.
- [x] T016 Run `git diff --check`.
- [x] T017 Run `git diff --cached --check`.
- [x] T018 Confirm no product `src/` files changed, no push, and no PR creation.
