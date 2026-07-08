# Data Model: Codex Claude E2E Orchestration

## Workflow State Extension

Existing workflow state remains the source of truth. This feature uses optional fields that are ignored by older flows when absent.

### Fields

- `repositoryPath`: absolute or project-root path included in generated review prompts.
- `taskScope`: concise feature/spec/task scope for review.
- `changedFiles`: array of changed file paths or diff-scope entries.
- `validationEvidence`: array of validation result strings.
- `reviewFindings`: array of successful review findings.

### Validation Rules

- Missing optional fields render as explicit "not provided" or empty-list text in prompts.
- `reviewFindings` is appended only for successful review or re-review executions that produce `Changes Requested`.
- Failed executions never append review findings.

## Runner Configuration

### Codex Implementation Runner

- `agentId`: `codex`
- `identity`: `OpenAI Codex CLI`
- `command`: `codex`
- `args`: `[]`
- `inputMode`: `stdin`

### Claude Review Runner

- `agentId`: `claude`
- `identity`: `Claude Code CLI`
- `command`: `claude`
- `args`: `["-p", "{{prompt}}"]`
- `inputMode`: `argument`

### Validation Rules

- Runner commands are checked for remote-mutating patterns before subprocess execution.
- `human-merge-decision` never receives a runner.
- Timeout values fall back to the existing default if invalid.

## Review Result

### Fields

- `stage`: `review` or `re-review`
- `agent`: reviewer identity
- `decision`: `Approved`, `Changes Requested`, or `Unknown`
- `findings`: full successful review text when the decision is `Changes Requested`
- `path`: local run-record path

### Validation Rules

- `Approved` and `Changes Requested` are mutually exclusive clear decisions.
- Output containing both decisions is `Unknown`.
- Output without a clear decision is `Unknown`.
