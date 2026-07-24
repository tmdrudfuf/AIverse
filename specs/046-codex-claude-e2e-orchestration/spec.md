# Feature Specification: Role-Based E2E Agent Orchestration

**Feature Branch**: `codex/codex-claude-e2e-orchestration`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Implement the first real end-to-end CLI agent orchestration slice for AIverse."

## User Scenarios & Testing

### User Story 1 - Run a Grounded Review After Implementation (Priority: P1)

An AIverse maintainer can run the local agent workflow so the Implementer performs the implementation stage and a different Reviewer performs an independent review stage using the generated workflow prompt, without any automatic push, PR, merge, or branch deletion.

**Why this priority**: This is the first real vertical slice that proves the Implementer-to-Reviewer handoff can happen locally while preserving the existing human gate.

**Independent Test**: Use fake process adapters to run implement then review stages and verify the configured Implementer receives an implementation prompt, the configured Reviewer receives a review prompt, review output is parsed, and the workflow stops before human-only actions.

**Acceptance Scenarios**:

1. **Given** a workflow state for a feature branch, **When** the implement stage runs, **Then** the Implementer runner receives the generated implementation prompt and local execution diagnostics are recorded.
2. **Given** a successful implementation result, **When** the review stage runs, **Then** the Reviewer runner is invoked according to its configured prompt delivery mode and receives a grounded review prompt.
3. **Given** the Reviewer returns `Approved`, **When** the review result is recorded, **Then** the workflow advances toward final verification and remains local-only.
4. **Given** the Reviewer returns `Changes Requested`, **When** the review result is recorded, **Then** the findings remain available in workflow state and run records for the next Implementer fix stage.

---

### User Story 2 - Fail Safely on Unavailable or Unsafe Runners (Priority: P2)

An AIverse maintainer gets a clear local failure when the configured Implementer or Reviewer cannot be executed safely, and the workflow does not advance from failed or ambiguous agent output.

**Why this priority**: Real CLI orchestration is only useful if failures cannot be mistaken for approvals and unsafe commands never spawn.

**Independent Test**: Use fake process adapters to simulate a missing Reviewer CLI, unsafe runner commands, malformed review output, and remote-mutating configurations.

**Acceptance Scenarios**:

1. **Given** the configured Reviewer is unavailable, **When** the review stage runs, **Then** the execution is recorded as a failure and no review decision is recorded.
2. **Given** a runner is configured as a remote-mutating command, **When** the stage attempts to run, **Then** the command is rejected before subprocess execution.
3. **Given** the Reviewer emits ambiguous review text, **When** the review stage completes, **Then** the decision remains unknown and the workflow does not advance as approved.

### Edge Cases

- Reviewer output includes both `Approved` and `Changes Requested`.
- Reviewer output includes neither accepted decision.
- The runner command is safe but the CLI is missing or exits non-zero.
- The feature id contains unusual characters.
- A review finding contains detailed text that must be preserved for the fix prompt without triggering remote actions.

## Requirements

### Functional Requirements

- **FR-001**: The workflow MUST resolve logical roles for each stage: Implementer for `implement`, `fix`, and `final-verification`; Reviewer for `review` and `re-review`.
- **FR-002**: The default role assignment MUST be Implementer = Codex CLI and Reviewer = Claude CLI.
- **FR-003**: The review prompt MUST include repository path, branch, expected HEAD commit, task/spec scope, changed files or diff scope, validation evidence, no-file-modification instruction, no remote-mutation instruction, and required `Approved` / `Changes Requested` result format.
- **FR-004**: The workflow MUST parse review decisions conservatively and treat malformed or ambiguous review output as unknown.
- **FR-005**: The workflow MUST preserve `Changes Requested` findings in local workflow state and run records for the subsequent Implementer fix stage.
- **FR-006**: Failed, timed-out, interrupted, unavailable, or unsafe CLI executions MUST NOT record approval or advance the workflow stage.
- **FR-007**: Unsafe or remote-mutating runner commands MUST be rejected before subprocess execution.
- **FR-008**: The workflow MUST NOT automatically push, open or update PRs, mark PRs ready, merge, delete branches, or perform remote mutation.
- **FR-009**: Automated tests MUST use fake or injected process adapters and MUST NOT call live CLI agents.
- **FR-010**: The slice MUST remain local-only and store execution records only under `.agent-workflow/runs/<feature-id>/`.
- **FR-011**: The workflow MUST document that the Reviewer should be different from the Implementer whenever possible and must not review its own implementation unless there is no reasonable alternative.
- **FR-012**: The workflow MUST allow fallback role assignments, including swapping the default CLIs when the default Implementer is unavailable.
- **FR-013**: The workflow MUST remain extensible to future CLI agents, including Codex CLI, Claude CLI, Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents.

### Key Entities

- **Workflow State**: Local JSON state describing the active feature, branch, runner configuration, results, validation evidence, and review findings.
- **Role Assignment**: Local stage-to-agent mapping that assigns an Implementer and Reviewer to workflow stages.
- **Runner Configuration**: Local agent execution settings including identity, command, args, input mode, and timeout.
- **Review Result**: A successful Reviewer decision plus optional findings preserved for Implementer fix prompts.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A fake end-to-end implement-to-review run records exactly one Implementer result and one Reviewer result without spawning real CLIs.
- **SC-002**: Default Reviewer invocations use the configured Claude CLI prompt-argument mode in tests and expose the generated review prompt to that argument.
- **SC-003**: `Approved`, `Changes Requested`, and ambiguous review outputs are each covered by automated tests with deterministic outcomes.
- **SC-004**: Unsafe runner configurations are rejected before the fake adapter records any subprocess call.
- **SC-005**: The complete validation suite passes before the local commit.

## Assumptions

- PR #35 remains unmerged and is not required for this slice because this work does not change `detectAgentCli`.
- Codex CLI remains the default Implementer and Claude CLI remains the default Reviewer, but these are default role assignments rather than permanent architecture.
- If the default Implementer becomes unavailable due to rate limits, quota, maintenance, or local CLI issues, the assignments may be swapped.
- The first real local run remains human-triggered; this feature does not start a live CLI agent run automatically.
- Final verification and human merge decision remain separate, human-gated steps.
