# Feature Specification: Codex Claude E2E Orchestration

**Feature Branch**: `codex/codex-claude-e2e-orchestration`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Implement the first real end-to-end Codex <-> Claude CLI orchestration slice for AIverse."

## User Scenarios & Testing

### User Story 1 - Run a Grounded Claude Review After Codex Implementation (Priority: P1)

An AIverse maintainer can run the local agent workflow so Codex performs the implementation stage and Claude performs an independent review stage using the generated workflow prompt, without any automatic push, PR, merge, or branch deletion.

**Why this priority**: This is the first real vertical slice that proves the Codex-to-Claude handoff can happen locally while preserving the existing human gate.

**Independent Test**: Use fake process adapters to run implement then review stages and verify Codex receives an implementation prompt, Claude receives a `-p` review prompt, review output is parsed, and the workflow stops before human-only actions.

**Acceptance Scenarios**:

1. **Given** a workflow state for a feature branch, **When** the implement stage runs, **Then** the Codex runner receives the generated implementation prompt and local execution diagnostics are recorded.
2. **Given** a successful implementation result, **When** the review stage runs, **Then** the Claude runner is invoked with arguments beginning with `-p` and a grounded review prompt.
3. **Given** Claude returns `Approved`, **When** the review result is recorded, **Then** the workflow advances toward final verification and remains local-only.
4. **Given** Claude returns `Changes Requested`, **When** the review result is recorded, **Then** the findings remain available in workflow state and run records for the next Codex fix stage.

---

### User Story 2 - Fail Safely on Unavailable or Unsafe Runners (Priority: P2)

An AIverse maintainer gets a clear local failure when Codex or Claude cannot be executed safely, and the workflow does not advance from failed or ambiguous agent output.

**Why this priority**: Real CLI orchestration is only useful if failures cannot be mistaken for approvals and unsafe commands never spawn.

**Independent Test**: Use fake process adapters to simulate missing Claude, unsafe runner commands, malformed review output, and remote-mutating configurations.

**Acceptance Scenarios**:

1. **Given** Claude is unavailable, **When** the review stage runs, **Then** the execution is recorded as a failure and no review decision is recorded.
2. **Given** a runner is configured as a remote-mutating command, **When** the stage attempts to run, **Then** the command is rejected before subprocess execution.
3. **Given** Claude emits ambiguous review text, **When** the review stage completes, **Then** the decision remains unknown and the workflow does not advance as approved.

### Edge Cases

- Claude output includes both `Approved` and `Changes Requested`.
- Claude output includes neither accepted decision.
- The runner command is safe but the CLI is missing or exits non-zero.
- The feature id contains unusual characters.
- A review finding contains detailed text that must be preserved for the fix prompt without triggering remote actions.

## Requirements

### Functional Requirements

- **FR-001**: The workflow MUST resolve Codex as the implementation runner and Claude as the review runner by default.
- **FR-002**: The Claude review runner MUST invoke Claude non-interactively with arguments beginning with `-p`.
- **FR-003**: The review prompt MUST include repository path, branch, expected HEAD commit, task/spec scope, changed files or diff scope, validation evidence, no-file-modification instruction, no remote-mutation instruction, and required `Approved` / `Changes Requested` result format.
- **FR-004**: The workflow MUST parse review decisions conservatively and treat malformed or ambiguous review output as unknown.
- **FR-005**: The workflow MUST preserve `Changes Requested` findings in local workflow state and run records for the subsequent Codex fix stage.
- **FR-006**: Failed, timed-out, interrupted, unavailable, or unsafe CLI executions MUST NOT record approval or advance the workflow stage.
- **FR-007**: Unsafe or remote-mutating runner commands MUST be rejected before subprocess execution.
- **FR-008**: The workflow MUST NOT automatically push, open or update PRs, mark PRs ready, merge, delete branches, or perform remote mutation.
- **FR-009**: Automated tests MUST use fake or injected process adapters and MUST NOT call live Codex or Claude services.
- **FR-010**: The slice MUST remain local-only and store execution records only under `.agent-workflow/runs/<feature-id>/`.

### Key Entities

- **Workflow State**: Local JSON state describing the active feature, branch, runner configuration, results, validation evidence, and review findings.
- **Runner Configuration**: Local agent execution settings including identity, command, args, input mode, and timeout.
- **Review Result**: A successful Claude review decision plus optional findings preserved for Codex fix prompts.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fake end-to-end implement-to-review run records exactly one Codex implement result and one Claude review result without spawning real CLIs.
- **SC-002**: Claude review invocations use an argument list beginning with `-p` in tests and expose the generated review prompt to that argument.
- **SC-003**: `Approved`, `Changes Requested`, and ambiguous review outputs are each covered by automated tests with deterministic outcomes.
- **SC-004**: Unsafe runner configurations are rejected before the fake adapter records any subprocess call.
- **SC-005**: The complete validation suite passes before the local commit.

## Assumptions

- PR #35 remains unmerged and is not required for this slice because this work does not change `detectAgentCli`.
- Codex remains the implementation agent and Claude remains the review agent for the default stage mapping.
- The first real local run remains human-triggered; this feature does not start a live Codex or Claude run automatically.
- Final verification and human merge decision remain separate, human-gated steps.
