# Feature Specification: Agent Review Orchestration

**Feature Branch**: `042-agent-review-orchestration`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Create Spec 041 for a safe local AI agent workflow orchestrator."

## User Scenarios & Testing

### User Story 1 - Generate the next safe agent prompt (Priority: P1)

A developer working through a Claude/Codex implementation-review-fix loop can provide a small local workflow state file and generate the next prompt for the correct stage without manually reconstructing branch, validation, scope, and safety instructions.

**Why this priority**: This is the minimum useful slice. It reduces coordination mistakes while preserving human control.

**Independent Test**: Create a minimal workflow state and run the local script. The generated prompt identifies the feature, branch, base branch, validation commands, scope constraints, and no-push/no-merge rules.

**Acceptance Scenarios**:

1. **Given** a new workflow state with no recorded agent outputs, **When** the developer asks for the next prompt, **Then** the script generates an implement prompt.
2. **Given** a workflow state with an implementation result recorded, **When** the developer asks for the next prompt, **Then** the script generates a review prompt.

---

### User Story 2 - Record agent outputs locally (Priority: P2)

A developer can save pasted agent output or a local result file into a gitignored run directory so the next prompt can be generated from the recorded workflow history.

**Why this priority**: The workflow needs durable local memory without adding a shared service, database, network process, or status file that competes with git/PRs.

**Independent Test**: Record a result for a feature and verify the saved output path is under `.agent-workflow/runs/<feature-id>/` and that the workflow state points to that local file.

**Acceptance Scenarios**:

1. **Given** a review output containing `Changes Requested`, **When** it is recorded, **Then** the next prompt is a fix prompt.
2. **Given** a review or re-review output containing `Approved`, **When** it is recorded, **Then** the next prompt is a final verification prompt.
3. **Given** a fix result has been recorded, **When** the next prompt is requested, **Then** the next prompt is a re-review prompt.

---

### User Story 3 - Preserve human approval gates (Priority: P3)

A developer can use generated prompts that clearly distinguish human-only operations from agent-executable work and prevent the local script from performing remote-mutating operations.

**Why this priority**: The tool is meant to help coordination, not replace human approval for push, PR, ready-for-review, merge, or branch deletion.

**Independent Test**: Inspect generated prompts and script behavior. Prompts label remote-mutating commands as human-only, and the script contains no code path that executes push, PR creation, merge, branch deletion, network, or external AI commands.

**Acceptance Scenarios**:

1. **Given** any generated prompt, **When** it is inspected, **Then** it includes no-push/no-merge rules and validation commands.
2. **Given** a workflow has reached final verification, **When** the next step is generated, **Then** the script returns a human merge decision prompt rather than executing remote commands.

## Edge Cases

- Missing optional fields such as expected commit should render as `not provided`, not break prompt generation.
- Result text that contains both `Changes Requested` and `Approved` should prefer `Changes Requested` so the workflow remains conservative.
- Feature IDs must be sanitized before creating run paths.
- Run output paths must remain under `.agent-workflow/runs/`.
- The local workflow must not modify the primary working tree when run from a separate worktree.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST support workflow stages: implement, review, fix, re-review, final verification, and human merge decision.
- **FR-002**: The system MUST store versioned prompt templates under `tools/agent-workflow/templates/`.
- **FR-003**: The system MUST store run records under `.agent-workflow/runs/<feature-id>/`.
- **FR-004**: The `.agent-workflow/` directory MUST be gitignored.
- **FR-005**: Generated prompts MUST include feature id/name, current branch, base branch, expected commit when available, validation commands, scope constraints, review decision format, and no-push/no-merge safety rules.
- **FR-006**: The script MUST be deterministic and require no network access.
- **FR-007**: The script MUST NOT invoke Claude, Codex, ChatGPT, Anthropic, OpenAI API, GitHub API, or any external AI tool automatically.
- **FR-008**: The script MUST NOT run `git push`, `gh pr create`, `gh pr merge`, branch deletion, or other remote mutation commands.
- **FR-009**: The script MAY print suggested remote-mutating commands only when they are clearly labeled as human-only.
- **FR-010**: The workflow MUST support recording an agent result from pasted text or from a local result file path.
- **FR-011**: The workflow MUST choose the next prompt type from recorded result history using the conservative stage rules in the user stories.
- **FR-012**: The workflow MUST preserve a human approval gate before push, PR creation, PR ready, merge, and branch deletion.
- **FR-013**: The feature MUST NOT add paid API calls, autonomous agent networking, background automation, credential storage, product UI changes, GitHub provider/cache behavior changes, or unrelated product feature changes.

### Key Entities

- **Workflow State**: Local JSON-compatible object describing feature id/name, branch, base branch, expected commit, validation commands, scope constraints, worktree safety notes, and recorded agent results.
- **Prompt Template**: Versioned Markdown file for one workflow stage.
- **Run Record**: Gitignored local file containing an agent output or generated prompt for a specific feature workflow.
- **Workflow Result**: Recorded agent output plus stage, agent label, decision, and local output path.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A new workflow state generates an implement prompt without requiring network access.
- **SC-002**: Recording an implementation output causes the next generated prompt to be a review prompt.
- **SC-003**: Recording a `Changes Requested` review output causes the next generated prompt to be a fix prompt.
- **SC-004**: Recording a fix output causes the next generated prompt to be a re-review prompt.
- **SC-005**: Recording an `Approved` review or re-review output causes the next generated prompt to be a final verification prompt.
- **SC-006**: All generated prompts include no-push/no-merge safety rules and validation commands.
- **SC-007**: All run output paths are under `.agent-workflow/runs/`.
- **SC-008**: Tests verify the script does not call network or external AI tools and does not include autonomous remote mutation behavior.

## Assumptions

- The first implementation is developer-only and local to the repository.
- Existing git branches and PRs remain the source of truth for coordination.
- The tool does not need a product UI, background service, database, or external API.
- Developers will manually paste or save agent outputs when they want the workflow to advance.
