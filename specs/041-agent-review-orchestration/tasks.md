# Tasks: Agent Review Orchestration

**Input**: Design documents from `specs/041-agent-review-orchestration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/workflow-state.md`

## Phase 1: Existing System Review

- [x] T001 Inspect `package.json` to confirm available script/test setup and avoid adding dependencies.
- [x] T002 Inspect `.gitignore` and decide the safest local run-output ignore pattern.
- [x] T003 Inspect `AGENTS.md` and `.specify/feature.json` to update only the Spec Kit-managed active feature pointers.

---

## Phase 2: Spec Kit Design Artifacts

- [x] T004 Create `specs/041-agent-review-orchestration/spec.md`.
- [x] T005 Create `specs/041-agent-review-orchestration/plan.md`.
- [x] T006 Create `specs/041-agent-review-orchestration/research.md`.
- [x] T007 Create `specs/041-agent-review-orchestration/data-model.md`.
- [x] T008 Create `specs/041-agent-review-orchestration/contracts/workflow-state.md`.
- [x] T009 Create `specs/041-agent-review-orchestration/quickstart.md`.
- [x] T010 Create `specs/041-agent-review-orchestration/checklists/requirements.md`.

---

## Phase 3: Local Workflow Foundation

- [x] T011 Add `.agent-workflow/` to `.gitignore`.
- [x] T012 Create versioned prompt templates under `tools/agent-workflow/templates/`.
- [x] T013 Implement deterministic workflow state, result-recording, stage-selection, and prompt-generation helpers in `tools/agent-workflow/agentWorkflow.js`.
- [x] T014 Implement `tools/agent-workflow/cli.js` for `next` and `record` commands without network or remote mutation behavior.
- [x] T015 Add `tools/agent-workflow/README.md` with manual usage and human-gated steps.

---

## Phase 4: Tests

- [x] T016 Add tests proving a minimal state generates an implement prompt.
- [x] T017 Add tests proving an implementation result generates a review prompt.
- [x] T018 Add tests proving a `Changes Requested` review generates a fix prompt.
- [x] T019 Add tests proving a fix result generates a re-review prompt.
- [x] T020 Add tests proving an `Approved` review/re-review generates final verification.
- [x] T021 Add tests proving prompts include no-push/no-merge rules and validation commands.
- [x] T022 Add tests proving run output paths stay under `.agent-workflow/runs/`.
- [x] T023 Add tests proving the workflow warns/refuses remote-mutating actions and labels human-only commands.
- [x] T024 Add tests proving the workflow does not call network or external AI tools.
- [x] T025 Add tests proving generated prompts include primary-worktree non-interference instructions when provided.

---

## Phase 5: Validation and Commit Readiness

- [x] T026 Run `npm test`.
- [x] T027 Run `npx tsc --noEmit`.
- [x] T028 Run `npm run build`.
- [x] T029 Run `git diff --check`.
- [x] T030 Run `git diff --cached --check`.
- [x] T031 Confirm no primary working tree changes, no product feature changes, no push, and no PR creation.

## Dependencies

- Phase 1 before Phase 2.
- Phase 2 before implementation.
- Phase 3 before Phase 4 tests can pass.
- Phase 5 after implementation and tests.

## Implementation Strategy

1. Keep the script local and dependency-free.
2. Keep prompt text in Markdown templates.
3. Make stage transitions deterministic from recorded result text.
4. Prefer conservative decisions: `Changes Requested` overrides `Approved`.
5. Write all run records only under `.agent-workflow/runs/<feature-id>/`.
6. Validate before committing.
