# Contract: E2E Agent Orchestration

## `runWorkflowAgent(state, options)`

Runs exactly one workflow stage with the configured agent.

### Inputs

- `state`: workflow state with optional runner configuration and review metadata.
- `options.stage`: stage override.
- `options.agentId`: agent override.
- `options.processAdapter`: injectable fake process adapter for tests.
- `options.cwd`: repository root for run records.

### Required Behavior

- Reject `human-merge-decision`.
- Resolve stage-to-agent mapping from state or defaults.
- Reject remote-mutating commands before subprocess execution.
- Generate the stage prompt from existing templates.
- For `inputMode: "stdin"`, pass the prompt through process input.
- For `inputMode: "argument"`, replace `{{prompt}}` or `{prompt}` arguments with the generated prompt.
- Write execution diagnostics under `.agent-workflow/runs/<feature-id>/`.
- Record stage result only for successful executions.
- Append review findings only for successful `Changes Requested` review/re-review outputs.

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

Automated tests must use fake process adapters and must not invoke real Codex or Claude services.
