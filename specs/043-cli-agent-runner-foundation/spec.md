# Feature Specification: CLI Agent Runner Foundation

**Feature Branch**: `043-cli-agent-runner-foundation`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Add a local-only CLI runner layer so `tools/agent-workflow` can execute configured agent CLIs for workflow stages."

## User Scenarios & Testing

### User Story 1 - Detect local agent CLIs (Priority: P1)

As a developer coordinating Codex and Claude, I can check whether configured agent CLIs are installed before attempting a workflow run.

**Why this priority**: The runner must fail safely and clearly when a local CLI is not installed rather than guessing or invoking an unavailable command.

**Independent Test**: Use an injected process adapter that simulates installed and missing CLIs; verify detection records command, identity, executable status, exit code, and display-safe error text.

**Acceptance Scenarios**:

1. **Given** a configured Codex CLI command is executable, **When** detection runs, **Then** the result reports the Codex runner as installed and includes version output when available.
2. **Given** a configured Claude CLI command is missing, **When** detection runs, **Then** the result reports it as unavailable without throwing or writing unsafe state.

---

### User Story 2 - Execute a generated prompt through a configured local CLI (Priority: P1)

As a developer, I can run the next workflow prompt through a configured local agent CLI and store the execution record locally.

**Why this priority**: This is the foundation for the future Codex implement → Claude review → Codex fix → Claude re-review loop.

**Independent Test**: Use a fake process adapter to execute an implement prompt; verify stdout, stderr, exit code, duration, agent identity, stage, and run-record path are captured under `.agent-workflow/runs/<feature-id>/`.

**Acceptance Scenarios**:

1. **Given** the next stage is `implement`, **When** the Codex runner executes successfully, **Then** a local execution record is written under `.agent-workflow/runs/<feature-id>/` and the workflow result list records the stage and agent identity.
2. **Given** the CLI exits non-zero, **When** the runner finishes, **Then** the execution record captures the non-zero exit code and output without fabricating approval.
3. **Given** the CLI returns empty output, **When** the runner finishes, **Then** the execution record marks the output as empty and leaves the decision unknown.

---

### User Story 3 - Preserve human gates and local-only safety (Priority: P1)

As a developer, I can trust that runner tooling will not push, create PRs, merge, delete branches, or run the human merge decision stage automatically.

**Why this priority**: The workflow exists to coordinate agents while keeping humans in control of repository-changing operations.

**Independent Test**: Attempt to run a human-merge-decision stage and remote-mutating command configs; verify the runner refuses before spawning a process.

**Acceptance Scenarios**:

1. **Given** the next stage is `human-merge-decision`, **When** an agent run is requested, **Then** the runner refuses and does not spawn any CLI.
2. **Given** an agent config command is `git` with push args or `gh` with PR mutation args, **When** an agent run is requested, **Then** the runner refuses before spawning.
3. **Given** a feature id is `.`, `..`, empty, or unusual, **When** a run is recorded, **Then** the run record remains under `.agent-workflow/runs/<feature-id>/` using the existing safe path containment behavior.

---

### User Story 4 - Handle timeout and interruption outcomes (Priority: P2)

As a developer, I can see when an agent CLI timed out or was interrupted, and the workflow remains in a safe local state.

**Why this priority**: Local CLI runs can hang or be interrupted; the tool should capture that outcome instead of leaving ambiguous state.

**Independent Test**: Use a fake process adapter that returns timeout and interruption results; verify records capture the outcome and no unsafe paths or decisions are produced.

**Acceptance Scenarios**:

1. **Given** a CLI exceeds the timeout, **When** the process adapter reports a timeout, **Then** the execution record includes `timedOut: true`, duration, exit information, and captured stderr/stdout.
2. **Given** a CLI is interrupted, **When** the adapter reports an interrupted signal, **Then** the execution record captures the signal and keeps the workflow result decision unknown unless output explicitly contains a review decision.

## Edge Cases

- Missing CLI command: record a detection failure and do not spawn workflow execution.
- Non-zero exit code: record output and exit code; do not infer approval.
- Timeout: terminate where the process adapter supports it; record timeout and keep local state valid.
- Human merge decision: never invoke a configured agent CLI.
- Path containment: `.`, `..`, empty, and unusual feature ids must not escape `.agent-workflow/runs/`.
- Remote-mutating command configs: reject before spawn.

## Requirements

### Functional Requirements

- **FR-001**: The runner MUST support provider-neutral runner configs for OpenAI Codex CLI and Claude Code CLI.
- **FR-002**: The runner MUST detect whether configured CLIs are installed and executable.
- **FR-003**: The runner MUST execute generated workflow prompts through subprocesses with `shell: false`.
- **FR-004**: The runner MUST capture stdout, stderr, exit code, duration, agent identity, and workflow stage.
- **FR-005**: The runner MUST write execution records only under `.agent-workflow/runs/<feature-id>/`.
- **FR-006**: The runner MUST preserve existing path-containment guarantees for `.`, `..`, empty, and unusual feature ids.
- **FR-007**: The runner MUST support timeout handling.
- **FR-008**: The runner MUST capture cancellation/termination signals where practical.
- **FR-009**: The runner MUST handle CLI not installed, non-zero exit, timeout, malformed/empty output, and interrupted execution.
- **FR-010**: The runner architecture MUST remain extensible and MUST NOT hardcode the whole workflow to Codex/Claude names only.
- **FR-011**: The existing six-stage workflow MUST remain unchanged: implement, review, fix, re-review, final-verification, human-merge-decision.
- **FR-012**: The human-merge-decision stage MUST never invoke an agent CLI automatically.
- **FR-013**: The runner MUST reject push, PR creation, PR ready, PR merge, branch deletion, and other remote-mutating command configs before spawning.
- **FR-014**: The feature MUST NOT add external AI SDK/API integration, require API keys, store credentials/tokens/secrets, or modify product `src/` code.
- **FR-015**: Tests MUST use fake/stub CLI executables or injected process adapters and MUST NOT call real Codex or Claude services.

### Key Entities

- **Agent Runner Config**: Provider-neutral description of an agent CLI command, arguments, identity, and prompt input mode.
- **Agent Detection Result**: Local detection outcome for a configured CLI.
- **Agent Execution Record**: JSON run record containing prompt stage, agent identity, command metadata, stdout, stderr, exit code, signal, timeout/interruption flags, duration, and output state.
- **Process Adapter**: Injectable adapter used by the runner to avoid real process execution in tests.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Detection reports installed/unavailable runner status without network or SDK calls.
- **SC-002**: A fake Codex implement run writes a complete execution record under `.agent-workflow/runs/<feature-id>/`.
- **SC-003**: A fake Claude review run containing `Changes Requested` records the decision and causes the next stage to become fix.
- **SC-004**: Human merge decision run attempts are refused before process spawn.
- **SC-005**: Remote-mutating command configs are refused before process spawn.
- **SC-006**: Timeout, non-zero exit, empty output, and interrupted execution are recorded deterministically.
- **SC-007**: `npm test`, `npx tsc --noEmit`, `npm run build`, and `git diff --check` pass.

## Assumptions

- Real agent CLI flag details may evolve, so defaults use simple stdin prompt delivery and can be overridden by local state config.
- Local developers remain responsible for installing and authenticating their CLIs outside the repository.
- The runner may invoke installed CLIs only when a human runs the local command; it does not run in the background.
