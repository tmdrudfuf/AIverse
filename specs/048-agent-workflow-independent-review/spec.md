# Feature Specification: Agent Workflow Independent Review

**Feature Branch**: `codex/agent-workflow-dry-run-preview-smoke`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description: "Implement the next incremental improvement to tools/agent-workflow: make independent review of the current working tree runnable through one simple workflow command, without requiring the user to manually create or paste a long Claude review prompt."

## User Scenarios & Testing

### User Story 1 - Request an Independent Review With One Command (Priority: P1)

An AIverse maintainer wants a review of whatever is currently in the working tree (staged, unstaged, and committed-but-unmerged branch changes) without hand-writing a review prompt or manually gathering diffs, instructions, and spec context.

**Why this priority**: This is the smallest change that removes the remaining manual step (prompt authoring) from the Implementer -> Reviewer loop and is safe to exercise against the real repository because it is read-only aside from local run records.

**Independent Test**: Run `tools/agent-workflow/cli.js run-review` against a local workflow state pointed at this repository and verify it automatically builds a review prompt from the actual git state, runs the configured Reviewer, classifies the outcome conservatively, records artifacts under `.agent-workflow/runs/<feature-id>/`, and prints a concise decision and next action.

**Acceptance Scenarios**:

1. **Given** a workflow state with no overrides, **When** the maintainer runs `run-review`, **Then** the command resolves the default Reviewer (Claude CLI), gathers staged/unstaged/committed diffs and repository instructions, runs the Reviewer, and prints one of `Approved`, `Changes Requested`, `Unknown`, `Execution Failed`, or `Timed Out`.
2. **Given** `run-review --dry-run`, **When** the maintainer runs it, **Then** the command prints the resolved Implementer/Reviewer, sanitized command, prompt path, run directory, and a repository context summary without spawning the Reviewer process.
3. **Given** a state where the resolved Implementer and Reviewer are configured identically, **When** `run-review` runs (dry-run or real), **Then** the command prints a prominent warning that independent review is not guaranteed, without silently hiding the condition.
4. **Given** Reviewer output that does not contain an explicit `# Review Decision: Approved` or `# Review Decision: Changes Requested` heading, **When** the result is classified, **Then** the outcome is `Unknown`, never a fabricated approval.
5. **Given** a Reviewer runner configuration that would be remote-mutating (e.g. `gh pr merge`), **When** `run-review` resolves the Reviewer, **Then** the command rejects it before any subprocess is spawned.

### Edge Cases

- No staged, unstaged, or committed-ahead-of-base changes (clean working tree).
- Only staged changes, only unstaged changes, or only committed branch changes.
- No merge base can be found against the configured base branch.
- The active feature spec cannot be located automatically (no `specPath` override, no matching `specs/<featureId>` directory).
- `CLAUDE.md` does not exist in the repository.
- The Reviewer process times out, is interrupted, or exits non-zero.

## Requirements

### Functional Requirements

- **FR-001**: The workflow CLI MUST provide a `run-review` command that automatically gathers repository context (current branch, base branch, merge base, staged diff, unstaged diff, committed-branch diff, changed-file summary) without requiring a hand-written prompt.
- **FR-002**: The generated review prompt MUST include repository path, branch/base/merge-base info, changed-file summary, bounded diffs, reported validation evidence, `AGENTS.md` instructions, `CLAUDE.md` instructions when present, the active feature spec when discoverable, and the Implementer/Reviewer identities.
- **FR-003**: Diff and file content included in the prompt MUST be bounded in size (line and character limits) rather than embedding unbounded raw output.
- **FR-004**: The prompt MUST require the Reviewer to independently inspect the actual repository rather than trusting only the generated summary, and MUST require exactly one `# Review Decision: Approved` or `# Review Decision: Changes Requested` heading followed by `Blocking Findings`, `Non-Blocking Improvements`, `Validation Performed`, and `Final Recommendation` sections.
- **FR-005**: Result classification MUST only treat an explicit approved decision as `Approved`; ambiguous, mixed, timed-out, or failed output MUST classify as `Unknown`, `Execution Failed`, or `Timed Out` as appropriate, never as a fabricated approval.
- **FR-006**: The command MUST resolve the configured logical Reviewer (respecting `stageAgents`/`agentRunners` overrides and legacy `codex`/`claude` runner ids) and MUST reject unsafe or remote-mutating runner configurations before spawning any process.
- **FR-007**: The command MUST compare the resolved Implementer and Reviewer configurations and print a prominent warning when they resolve to the same runner, without failing the run.
- **FR-008**: The command MUST support a dry-run/preview mode that performs the same repository inspection and prompt build but never spawns the Reviewer process, and never writes run artifacts.
- **FR-009**: The command MUST store the prompt, a JSON execution record, and the raw Reviewer output under the existing `.agent-workflow/runs/<feature-id>/` run-record system, and append a summary entry to workflow state.
- **FR-010**: The command MUST NOT push, create or update pull requests, mark pull requests ready, merge, delete branches, or otherwise mutate git state; it is read-only with respect to the repository other than local run records.
- **FR-011**: The feature MUST NOT modify product app `src/` files and MUST reuse the existing state model, extending it only with the minimum optional fields needed (`specPath`, `reviewRuns`).

### Key Entities

- **Repository Context**: Automatically gathered current branch, base branch, merge base, staged/unstaged/committed diffs, and changed-file summary for the working tree.
- **Independent Review Prompt**: A generated, logical-role-terminology prompt built from repository context, workflow state, and repository instructions, using `templates/independent-review.md`.
- **Review Run Record**: A local artifact set (prompt, execution record, raw output) plus a `state.reviewRuns` entry describing the outcome, reviewer id, and whether the Implementer/Reviewer were the same runner.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can request an independent review of the current working tree with a single command and no hand-written prompt.
- **SC-002**: Focused tests prove dry-run performs zero Reviewer subprocess calls.
- **SC-003**: Focused tests prove unsafe/remote-mutating Reviewer configurations are rejected before any spawn attempt.
- **SC-004**: Focused tests prove ambiguous or failed/timed-out Reviewer output never classifies as `Approved`.
- **SC-005**: Focused tests prove staged-only, unstaged-only, committed-branch-plus-working-tree, and no-change scenarios are each correctly reflected in the gathered repository context.
- **SC-006**: The full validation suite passes before this feature is considered ready for live Implementer -> Reviewer orchestration.

## Assumptions

- The feature extends `tools/agent-workflow` rather than creating a parallel review system, and reuses existing runner resolution, safety checks, and run-record helpers.
- Git itself (read-only plumbing commands) may be invoked directly to gather repository context, including during dry-run preview; only spawning the configured Reviewer/Implementer CLI is suppressed during dry-run.
- The live Implementer -> Reviewer run for this feature is manually triggered after implementation and validation, consistent with prior increments.
- `.agent-workflow/` remains gitignored and all run records remain local.
