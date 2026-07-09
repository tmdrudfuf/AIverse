# Tasks: Agent Workflow Dry Run Preview

**Input**: Design documents from `specs/047-agent-workflow-dry-run-preview/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Required. This feature changes local workflow tooling and must use fake or injected adapters only.

**Organization**: Tasks are grouped by user story to enable independent implementation and review.

## Phase 1: Setup

**Purpose**: Align Spec Kit pointers and confirm the existing workflow seam.

- [X] T001 Update `.specify/feature.json` to point at `specs/047-agent-workflow-dry-run-preview`
- [X] T002 Update `AGENTS.md` SPECKIT pointer to `specs/047-agent-workflow-dry-run-preview/plan.md`
- [X] T003 Inspect `tools/agent-workflow/cli.js`, `tools/agent-workflow/agentWorkflowRun.js`, and `tools/agent-workflow/agentWorkflowRun.test.ts`

---

## Phase 2: User Story 1 - Preview the Next Workflow Stage Safely (Priority: P1)

**Goal**: Add a dry-run preview for the existing workflow `run` command that shows what would happen without spawning an agent or advancing state.

**Independent Test**: Run focused tests proving dry-run preview prints stage, agent, command preview, prompt path, run directory, and next expected step while making zero process-adapter calls.

- [ ] T004 [P] [US1] Add dry-run preview tests for one-stage runnable preview in `tools/agent-workflow/agentWorkflowRun.test.ts`
- [ ] T005 [P] [US1] Add dry-run preview tests for human-merge-decision and unsafe runner rejection in `tools/agent-workflow/agentWorkflowRun.test.ts`
- [ ] T006 [US1] Implement dry-run preview resolution in `tools/agent-workflow/agentWorkflowRun.js`
- [ ] T007 [US1] Wire `run --dry-run` output in `tools/agent-workflow/cli.js`
- [ ] T008 [US1] Confirm dry-run preview does not record results, append execution records, spawn agents, or advance workflow state

---

## Phase 3: Documentation and Validation

**Purpose**: Keep local tooling docs and validation evidence current.

- [ ] T009 Update `tools/agent-workflow/README.md` with the `run --dry-run` preview command
- [ ] T010 Run `npm test`
- [ ] T011 Run `npx tsc --noEmit`
- [ ] T012 Run `npm run build`
- [ ] T013 Run `git diff --check`
- [ ] T014 Run `git diff --cached --check`
- [ ] T015 Confirm no product `src/` files changed and no remote mutation occurred

## Dependencies & Execution Order

- Phase 1 before implementation.
- T004 and T005 can be written in parallel before implementation.
- T006 before T007.
- T008 after T006 and T007.
- Phase 3 after User Story 1 implementation.

## Implementation Strategy

1. Complete setup and review existing workflow seams.
2. Add failing focused tests for dry-run behavior.
3. Implement the smallest preview path that reuses existing stage, agent, and prompt resolution.
4. Validate with the full required suite.
5. Stop for live Codex -> Claude workflow review before push or PR actions.
