# Feature Specification: Agent Workflow Automated Fix Loop

**Feature Branch**: `codex/agent-workflow-automated-fix-loop`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Implement an automated Implementer -> validation -> Reviewer -> fix -> re-review loop for local agent workflow orchestration, bounded by a configured fix-cycle limit and stopped before human-only remote actions."

## User Scenarios & Testing

### User Story 1 - Run the Complete Local Loop With One Command (Priority: P1)

An AIverse maintainer can start a single local workflow command that runs the Implementer, validates the result, runs the Reviewer, and stops at the human merge decision when the Reviewer approves.

**Why this priority**: This removes manual copy/paste between local CLIs while preserving the human gate for push, PR, readiness, approval, and merge.

**Independent Test**: Use deterministic mock runners and validation commands to verify `orchestrate` performs implement, validation, review, final validation, and stops at `human-merge-decision` without invoking remote mutation.

**Acceptance Scenarios**:

1. **Given** a workflow state for an active feature, **When** the maintainer runs `orchestrate`, **Then** the workflow runs the configured Implementer, records artifacts, runs validation, runs the configured Reviewer, and if approved performs final validation before stopping at `human-merge-decision`.
2. **Given** `orchestrate --dry-run`, **When** the maintainer previews the loop, **Then** the command prints resolved roles, planned stages, validation commands, artifact paths, max fix cycles, and `Will spawn: false` without mutating state or writing execution/result artifacts.

### User Story 2 - Apply Bounded Fix Cycles From Actionable Findings (Priority: P1)

An AIverse maintainer can let the workflow feed verified actionable Reviewer findings back to the Implementer for focused fixes, repeating validation and re-review until approval or the configured fix-cycle limit is reached.

**Why this priority**: Review automation is useful only if Changes Requested can be handled without manual prompt assembly, while still avoiding infinite or blind loops.

**Independent Test**: Use mock Reviewer output with structured blocking findings to verify one fix cycle reaches approval, multiple Changes Requested decisions stop at the configured limit, and non-actionable Changes Requested output blocks without running the Implementer fix.

**Acceptance Scenarios**:

1. **Given** the Reviewer returns `Changes Requested` with actionable blocking findings, **When** fix cycles remain, **Then** the workflow runs a focused Implementer fix prompt containing the original Reviewer output and extracted finding fields, validates again, and runs re-review.
2. **Given** the Reviewer repeatedly returns `Changes Requested`, **When** the configured maximum fix cycles is reached, **Then** the workflow records `blocked` with the reason and does not loop indefinitely.
3. **Given** the Reviewer returns `Changes Requested` without actionable findings, **When** the workflow evaluates the result, **Then** it stops conservatively and preserves the raw Reviewer output.

### User Story 3 - Stop Safely on Failures and Resume From Completed Stages (Priority: P2)

An AIverse maintainer gets conservative, resumable behavior when validation fails, a runner times out, a runner exits non-zero, the branch changes, or a previous run was interrupted.

**Why this priority**: Automated loops must not fabricate approval, duplicate already-completed work, or lose artifacts when interrupted.

**Independent Test**: Use mock runners and validation commands to verify validation failure prevents review, Implementer/Reviewer timeout prevents advancement, unsafe runners are rejected before spawn, BOM state files load, and a second `orchestrate` invocation resumes from the next safe stage.

**Acceptance Scenarios**:

1. **Given** validation fails after implementation or fix, **When** orchestration runs, **Then** the Reviewer is not invoked and validation artifacts identify the failed command.
2. **Given** Implementer or Reviewer times out, exits non-zero, or produces an unknown decision, **When** orchestration runs, **Then** the workflow records a conservative terminal state and never advances to approval.
3. **Given** a previous orchestration run completed implementation and validation, **When** the maintainer reruns `orchestrate`, **Then** it resumes at the next safe stage instead of repeating completed stages.

### Edge Cases

- Same runner is configured for Implementer and Reviewer.
- Branch changes during orchestration.
- Working tree gains unrelated changes after a failed fix.
- Fix cycle produces no diff.
- Reviewer output includes a decision but no actionable findings.
- Validation passes before a fix but fails after the fix.
- State file contains a UTF-8 BOM.
- Runner configuration is remote-mutating.
- Prompt template is missing.

## Requirements

### Functional Requirements

- **FR-001**: The CLI MUST provide `orchestrate --state <state.json> [--dry-run] [--timeout-ms <ms>] [--max-fix-cycles <n>] [--skip-validation] [--validation-command <command>]`.
- **FR-002**: The orchestration state machine MUST support `implement`, `validate`, `review`, `fix`, `revalidate`, `re-review`, `final-verification`, `human-merge-decision`, and `blocked`.
- **FR-003**: The command MUST persist workflow state after each completed stage with enough artifact paths and timestamps to resume safely.
- **FR-004**: Implementer prompts MUST include repository path, branch, active Spec/task context, current stage, exact scope, validation requirements, safety constraints, previous verified findings when applicable, and structured final-output instructions.
- **FR-005**: Fix prompts MUST include the original Reviewer output or a lossless structured subset and MUST instruct the Implementer to fix only verified findings without unrelated changes.
- **FR-006**: Reviewer execution MUST reuse the independent review prompt path, git context collection, role resolution, safety checks, subprocess behavior, artifact writing, and conservative result parsing.
- **FR-007**: Only `Approved` Reviewer output MAY advance toward final verification. `Unknown`, timeout, interrupted, execution failure, and malformed output MUST stop conservatively.
- **FR-008**: `Changes Requested` MAY advance to a fix cycle only when actionable findings are present and the configured fix-cycle limit has not been reached.
- **FR-009**: Validation MUST run after implementation, after every fix, and once more after approval unless explicitly skipped, and MUST record command, exit code, stdout, stderr, duration, and result artifact path.
- **FR-010**: Failed validation MUST prevent Reviewer execution or approval advancement.
- **FR-011**: The loop MUST never continue indefinitely and MUST stop at `blocked` when max fix cycles are exhausted.
- **FR-012**: Dry-run MUST not spawn agents, run validation, mutate workflow progress, or create execution/result artifacts.
- **FR-013**: Remote-mutating runner configurations MUST remain rejected before any subprocess spawn.
- **FR-014**: The workflow MUST never push, create or edit PRs, mark PRs ready, approve PRs, merge, delete remote branches, or mutate GitHub state.
- **FR-015**: The command MUST stop conservatively on branch changes, unsafe runner configs, malformed state, missing templates, no-change fix cycles, and same-runner warnings must be visible.

### Key Entities

- **Orchestration Run**: A resumable sequence of local stages and terminal status for one feature.
- **Validation Run**: A recorded command execution with stdout, stderr, exit code, duration, status, and artifact path.
- **Review Finding**: A conservative extraction of an actionable blocking issue from Reviewer output, preserving file/location/problem/impact/recommendation when present.
- **Fix Cycle**: One Reviewer Changes Requested decision, one focused Implementer fix attempt, validation, and re-review.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can execute the direct approval path with one command and reach `human-merge-decision` without manual prompt copying.
- **SC-002**: Automated tests cover direct approval, one fix cycle, max-cycle exhaustion, validation failure, Implementer timeout, Reviewer timeout, unsafe runner rejection, dry-run, resume, role swap, BOM state, and non-actionable findings.
- **SC-003**: Failed validation, unknown review, timeout, and non-actionable Changes Requested never result in `Approved` or `human-merge-decision`.
- **SC-004**: Every real command execution produces local artifacts under `.agent-workflow/runs/<feature-id>/` and state references to those artifacts.
- **SC-005**: The full validation suite passes before the feature is committed.

## Assumptions

- The feature remains local-only and extends `tools/agent-workflow`.
- The default validation command list is `npm test`, `npx tsc --noEmit`, `npm run build`, and `git diff --check`.
- `.agent-workflow/` remains gitignored.
- The automated loop may create and modify local files through configured local agent CLIs, but remote GitHub actions remain human-only.
