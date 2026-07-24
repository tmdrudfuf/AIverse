# Contract: Role-Based E2E Agent Orchestration

The workflow is organized around logical roles:

- Implementer: runs `implement`, `fix`, and `final-verification` stages.
- Reviewer: runs `review` and `re-review` stages.

Default assignment is Implementer = Codex CLI and Reviewer = Claude CLI. Fallback assignment may swap these or use another supported CLI when the default Implementer is unavailable. The reviewer should be different from the implementer whenever possible.

## `runWorkflowAgent(state, options)`

Runs exactly one workflow stage with the configured agent.

### Inputs

- `state`: workflow state with optional runner configuration and review metadata.
- `options.stage`: stage override.
- `options.agentId`: agent override, typically a role runner such as `implementer` or `reviewer`.
- `options.processAdapter`: injectable fake process adapter for tests.
- `options.cwd`: repository root for run records.

### Required Behavior

- Reject `human-merge-decision`.
- Resolve stage-to-role/agent mapping from state or defaults.
- Reject remote-mutating commands before subprocess execution.
- Generate the stage prompt from existing templates.
- For `inputMode: "stdin"`, pass the prompt through process input.
- For `inputMode: "argument"`, replace `{{prompt}}` or `{prompt}` arguments with the generated prompt.
- Write execution diagnostics under `.agent-workflow/runs/<feature-id>/`.
- Record stage result only for successful executions.
- Append review findings only for successful `Changes Requested` Reviewer outputs.

## Review Prompt Contract

The review prompt must include:

- repository path
- branch
- expected HEAD commit
- task/spec scope
- changed files or diff scope
- validation evidence
- no-file-modification instruction
- no commit/push/PR/merge/remote-mutation instruction
- required result format: `Approved` or `Changes Requested`

## Safety Contract

The workflow must never execute:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion
- remote-mutating equivalents

Automated tests must use fake process adapters and must not invoke real CLI agents.

## Extensibility Contract

The workflow must not depend on a specific vendor. Supported runners may include Codex CLI, Claude CLI, Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents, provided they can be represented by local runner configuration and pass the safety checks.
