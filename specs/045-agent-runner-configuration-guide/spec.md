# Feature Specification: Agent Runner Configuration and Real CLI Usage Guide

**Feature Branch**: `045-agent-runner-configuration-guide`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Make the agent workflow runner easier to configure and actually use with real Codex CLI / Claude Code CLI locally, without weakening any safety gates."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Preview a Real Runner Stage Safely (Priority: P1)

A developer wants to confirm which workflow stage, agent, command, prompt path, and run directory would be used before starting a real local agent CLI.

**Why this priority**: Dry-run visibility is the safest bridge from prompt generation to real CLI execution because it prevents accidental process launches while validating configuration.

**Independent Test**: Use a local workflow state file and run the dry-run command; verify the output includes stage, selected agent, command, prompt path, run directory, next expected step, and does not spawn the configured process.

**Acceptance Scenarios**:

1. **Given** a valid workflow state with configured runners, **When** the developer requests a dry run, **Then** the command shows the stage, selected agent, command, prompt path, run directory, and next expected step without spawning the agent CLI.
2. **Given** the workflow is already at human merge decision, **When** the developer requests a dry run, **Then** the command reports that the stage is human-only and does not prepare an agent spawn.

---

### User Story 2 - Diagnose Local Codex and Claude CLI Readiness (Priority: P2)

A developer wants a single diagnostics command that explains whether Codex and Claude runner commands are configured, available, missing, or unsafe.

**Why this priority**: Real local usage fails early without clear diagnostics. A readable diagnosis lets developers fix missing CLI installs or unsafe config without guessing.

**Independent Test**: Run diagnostics with fake adapters for available, missing, unsafe, and missing-config runners; verify readable output and safe exit behavior.

**Acceptance Scenarios**:

1. **Given** configured Codex and Claude runners, **When** diagnostics run, **Then** each runner reports command path/name, availability, and configured status.
2. **Given** a runner command is remote-mutating, **When** diagnostics run, **Then** the command is reported unsafe and no subprocess is spawned for that runner.
3. **Given** a runner is missing from configuration, **When** diagnostics run, **Then** the missing configuration is reported clearly.

---

### User Story 3 - Follow a Real Local Usage Guide (Priority: P3)

A developer wants committed example state/config files and a README flow for installing/checking CLIs, configuring the workflow state, running one stage, running until blocked, inspecting logs, and performing the merge step manually.

**Why this priority**: Documentation and examples make the workflow repeatable for Codex + Claude coordination without storing credentials or weakening human gates.

**Independent Test**: Follow the quickstart using example files; verify the examples contain no secrets, all runtime output paths point under `.agent-workflow/`, and the human-only merge step remains manual.

**Acceptance Scenarios**:

1. **Given** a fresh checkout, **When** the developer reads the examples, **Then** they can copy a state file and see how Codex/Claude runners and stage agents are configured.
2. **Given** a completed final-verification stage, **When** the guide reaches merge, **Then** the guide instructs a human to run merge-related commands manually and no runner command executes them.

---

### Edge Cases

- Configured runner command is empty or missing.
- Configured runner command attempts a forbidden remote-mutating operation.
- Codex or Claude CLI is not installed locally.
- CLI detection times out or exits non-zero.
- Dry-run is requested for `human-merge-decision`.
- Workflow state uses an unusual feature id; prompt and run paths still remain under `.agent-workflow/runs/<feature-id>/`.
- Runtime state contains no custom runner config and relies on defaults.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow CLI MUST provide a dry-run mode that reports the current stage, selected agent, command that would run, prompt path, run directory, and next expected step without spawning an agent CLI.
- **FR-002**: The dry-run mode MUST write or identify the generated prompt under `.agent-workflow/runs/<feature-id>/` while preserving existing path containment rules.
- **FR-003**: The workflow CLI MUST provide diagnostics that report Codex and Claude runner availability, configured command, missing configuration, and unsafe command rejection.
- **FR-004**: Diagnostics MUST reject unsafe commands before subprocess execution.
- **FR-005**: CLI output MUST make missing CLI, unsafe command, timeout, and failed execution states understandable without exposing credentials or implying stage success.
- **FR-006**: The feature MUST include committed example state/config files for Codex and Claude runner usage with no credentials, tokens, API keys, or secrets.
- **FR-007**: The README/quickstart MUST document installing/checking local CLIs, configuring state, dry-running, running one stage, running until blocked, inspecting logs, and keeping merge/push/PR actions human-only.
- **FR-008**: The feature MUST preserve all existing safety gates: `human-merge-decision` never auto-runs, failed runs do not advance workflow, remote-mutating commands are rejected before spawn, and run paths remain under `.agent-workflow/runs/<feature-id>/`.
- **FR-009**: Tests MUST use fake or stub process adapters and MUST NOT call real Codex or Claude services.
- **FR-010**: The feature MUST NOT modify product `src/` code.

### Key Entities

- **Runner Diagnostic**: A readable report for one configured agent runner, including agent id, identity, command, configured status, safety status, availability, and any failure message.
- **Dry Run Summary**: A preview of one workflow stage, selected agent, command, prompt path, run directory, next expected step, and whether execution is blocked.
- **Example Workflow State**: A committed local template showing safe runner and stage-agent configuration without secrets.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A developer can dry-run the current stage and see all required preview fields in one command without spawning any process.
- **SC-002**: Diagnostics identify available, missing, missing-config, and unsafe runner states using fake adapters in automated tests.
- **SC-003**: Example files and README instructions enable the one-stage and until-blocked local workflow without adding credentials or modifying gitignored runtime logs.
- **SC-004**: Existing runner safety regression tests continue to pass, including failed-run no-advance, human-only stage refusal, unsafe command refusal, and run path containment.

## Assumptions

- Codex and Claude CLI installation methods may vary by machine; this feature documents verification commands and does not install CLIs.
- Existing default runner ids remain `codex` and `claude`.
- Developers may customize command paths in the workflow state when CLIs are installed outside PATH.
- The guide can use committed example JSON templates while actual `.agent-workflow/` state and logs remain gitignored.
