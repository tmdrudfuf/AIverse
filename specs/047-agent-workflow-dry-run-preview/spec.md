# Feature Specification: Agent Workflow Dry Run Preview

**Feature Branch**: `codex/agent-workflow-dry-run-preview-smoke`

**Created**: 2026-07-09

**Status**: Draft

**Input**: User description: "Create Spec 047 production-code E2E smoke test for the Codex -> Claude orchestration workflow. Add a small CLI dry-run/preview improvement to tools/agent-workflow, with focused tests."

## User Scenarios & Testing

### User Story 1 - Preview the Next Workflow Stage Safely (Priority: P1)

An AIverse maintainer can preview what `tools/agent-workflow` would run for the current workflow stage before spawning Codex, Claude, or any other configured runner.

**Why this priority**: This is the smallest production-code tooling change that exercises the real Codex -> Claude workflow while preserving safety gates and avoiding product app changes.

**Independent Test**: Run the workflow CLI in dry-run mode against a local workflow state and verify the output reports the current stage, selected agent, command preview, prompt path, run directory, and next expected step without invoking the configured runner.

**Acceptance Scenarios**:

1. **Given** a workflow state at the implement stage, **When** the maintainer runs the workflow command with dry-run preview enabled, **Then** the CLI prints the current stage, selected agent identity, safe command preview, prompt path, run directory, and next expected step without spawning an agent process.
2. **Given** a workflow state at a review stage configured for Claude, **When** dry-run preview runs, **Then** the CLI shows that Claude would receive a prompt argument preview without running Claude.
3. **Given** a workflow state that would resolve to human-merge-decision, **When** dry-run preview runs, **Then** the CLI reports that the workflow is at the human gate and does not try to invoke any agent.

### Edge Cases

- The configured stage agent is missing.
- The configured runner command would be rejected by the existing safety boundary.
- The state file contains an unusual but valid feature id.
- The preview is requested with a stage override.
- The preview is requested with an explicit agent override.

## Requirements

### Functional Requirements

- **FR-001**: The workflow CLI MUST provide a dry-run preview for the `run` command that does not spawn Codex, Claude, or any configured agent process.
- **FR-002**: The dry-run preview MUST show the current or overridden workflow stage.
- **FR-003**: The dry-run preview MUST show the selected agent identity and command preview when a runnable stage resolves to an agent.
- **FR-004**: The dry-run preview MUST show the generated prompt path and run directory that would be used for the stage.
- **FR-005**: The dry-run preview MUST show the next expected step without recording a stage result or advancing workflow state.
- **FR-006**: The dry-run preview MUST respect existing human-only safety gates and never auto-run human-merge-decision.
- **FR-007**: The dry-run preview MUST reject unsafe or remote-mutating runner configurations before presenting them as runnable.
- **FR-008**: Automated tests MUST use fake or injected adapters and MUST NOT call live Codex or Claude services.
- **FR-009**: The feature MUST NOT modify product app `src/` files, external API integrations, credential handling, push/PR/merge automation, or branch deletion behavior.

### Key Entities

- **Dry Run Preview**: A local CLI output describing what a workflow run would do without spawning an agent or mutating workflow stage results.
- **Workflow State**: Existing local state that determines feature id, branch, stage, runner configuration, validation evidence, and review findings.
- **Runner Preview**: A display-safe representation of the selected agent command and prompt delivery mode.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Dry-run preview can be verified with one CLI command and no live agent subprocess calls.
- **SC-002**: Focused tests prove dry-run preview does not call the process adapter.
- **SC-003**: Focused tests prove human-merge-decision remains a stop condition.
- **SC-004**: Focused tests prove unsafe runner configurations are rejected before any spawn attempt.
- **SC-005**: The full validation suite passes before the production-code smoke task is considered ready for live Codex -> Claude orchestration.

## Assumptions

- The preview feature extends the existing `tools/agent-workflow` CLI and runner abstractions rather than creating a parallel workflow.
- The first implementation slice is limited to a single dry-run preview behavior and focused tests.
- The live Codex -> Claude run for this feature will be manually triggered after the spec, plan, and tasks are reviewed.
- `.agent-workflow/` remains gitignored and all run records remain local.
