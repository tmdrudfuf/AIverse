# Feature Specification: Agent Workflow Run Command

**Feature Branch**: `044-agent-workflow-run-command`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Add an end-to-end local workflow execution command so a user can run the agent workflow with one command, while keeping push/PR/merge/delete-branch human-only."

## User Scenarios & Testing

### User Story 1 - Run the current workflow stage with one command (Priority: P1)

As a developer, I can run `node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json` to execute exactly the current runnable workflow stage and save local diagnostics.

**Why this priority**: This is the minimum end-to-end user flow on top of Spec 043.

**Independent Test**: Use a fake process adapter and state file; verify one stage runs, diagnostics are recorded, the next stage is recomputed, and no human-only command executes.

**Acceptance Scenarios**:

1. **Given** a new workflow state, **When** `run` is invoked, **Then** the implement prompt is generated, the configured Codex runner is invoked, diagnostics are stored, and next stage is review.
2. **Given** a failed execution, **When** `run` completes, **Then** diagnostics are stored but no stage result is recorded and the workflow does not advance.

---

### User Story 2 - Continue safely until blocked (Priority: P2)

As a developer, I can opt into `--until-blocked` to continue across safe runnable stages until the workflow reaches a stop condition.

**Why this priority**: It supports the future Codex implement → Claude review → Codex fix → Claude re-review loop while keeping human gates.

**Independent Test**: Use fake adapters returning staged outputs; verify the loop stops on failure, human-merge-decision, missing config, or max-step limit.

**Acceptance Scenarios**:

1. **Given** successful implement and review outputs, **When** `--until-blocked` runs, **Then** each safe runnable stage executes in order.
2. **Given** the workflow reaches human-merge-decision, **When** `--until-blocked` is active, **Then** the command stops before invoking any CLI.
3. **Given** max steps is reached, **When** additional stages remain, **Then** the command stops with a max-step reason.

---

### User Story 3 - Show clear local run status (Priority: P2)

As a developer, I can read the console output to understand the current stage, selected agent, execution result, next stage, and output paths.

**Why this priority**: End-to-end orchestration is only useful if humans can audit what happened.

**Independent Test**: Invoke the CLI with fake state/adapter through module tests and verify returned summaries contain stage, agent, output state, next stage, and paths.

**Acceptance Scenarios**:

1. **Given** a successful stage run, **When** the command completes, **Then** output includes stage, agent, output state, next stage, execution record path, and result path.
2. **Given** a failed stage run, **When** the command completes, **Then** output includes diagnostics path and explains the failure stop reason.

## Edge Cases

- Human merge decision is current: stop without spawning.
- Missing CLI config: stop without spawning.
- Failed run: store diagnostics, do not record stage result, stop.
- `--until-blocked` with a bad or absent max step value: use a safe default.
- Max steps reached: stop even if more runnable stages remain.
- Weird feature ids: all output remains under `.agent-workflow/runs/<feature-id>/`.

## Requirements

### Functional Requirements

- **FR-001**: CLI MUST add `run --state <state.json>`.
- **FR-002**: `run` MUST execute one stage by default.
- **FR-003**: `run --until-blocked` MUST continue until failure, human-merge-decision, missing config, or max-step limit.
- **FR-004**: Runner MUST include a max-step guard.
- **FR-005**: Console/run summaries MUST include current stage, selected agent, execution result, next stage, and output paths.
- **FR-006**: The command MUST use existing prompt templates and runner architecture.
- **FR-007**: The command MUST preserve path containment and failed-run safety from Spec 043.
- **FR-008**: Tests MUST use fake process adapters and MUST NOT call real Codex/Claude services.
- **FR-009**: The command MUST NOT execute human-merge-decision, push, PR creation, PR ready, PR merge, branch deletion, or other remote-mutating operations.
- **FR-010**: Product `src/` files MUST NOT change.

### Key Entities

- **Workflow Run Summary**: One local command invocation containing steps, stop reason, final next stage, and persisted state path.
- **Workflow Run Step**: One attempted stage execution with stage, agent, output state, record paths, and next stage.
- **Stop Reason**: `single-stage-complete`, `failure`, `human-merge-decision`, `missing-agent`, or `max-steps`.

## Success Criteria

### Measurable Outcomes

- **SC-001**: One-stage `run` executes exactly one fake stage in tests.
- **SC-002**: `--until-blocked` executes multiple safe stages and stops before human-merge-decision.
- **SC-003**: Failed runs do not advance workflow stage.
- **SC-004**: Missing config and human-merge-decision stop before process spawn.
- **SC-005**: Full validation passes.

## Assumptions

- Agent CLIs remain locally installed/configured outside the repository.
- Human approval remains required for push, PR creation, PR ready, merge, and branch deletion.
