# Data Model: Role-Based E2E Agent Orchestration

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

Runner configurations describe concrete CLI agents. Role assignments decide which runner fills each workflow role.

### Default Implementer Runner

- `agentId`: `implementer`
- `identity`: `Implementer (Codex CLI)`
- `command`: `codex`
- `args`: `["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"]`
- `inputMode`: `stdin`

### Default Reviewer Runner

- `agentId`: `reviewer`
- `identity`: `Reviewer (Claude CLI)`
- `command`: `claude`
- `args`: `["--dangerously-skip-permissions", "-p", "{{prompt}}"]`
- `inputMode`: `argument`

### Backward-Compatible Runner Aliases

- `codex`: OpenAI Codex CLI using stdin and the same full local-access flags as the default Implementer.
- `claude`: Claude Code CLI using `["--dangerously-skip-permissions", "-p", "{{prompt}}"]`.

Existing workflow state files that refer directly to `codex` or `claude` continue to work. New state files should prefer role-oriented runner IDs or local IDs that describe the assignment.

## Role Assignment

### Default Stage Mapping

- `implement`: `implementer`
- `review`: `reviewer`
- `fix`: `implementer`
- `re-review`: `reviewer`
- `final-verification`: `implementer`

### Fallback Assignment

If the default Implementer is unavailable due to rate limits, quota, maintenance, or local CLI issues, a local state file may swap assignments. Example: Implementer = Claude CLI and Reviewer = Codex CLI.

The reviewer should be different from the implementer whenever possible. Do not let an agent review its own implementation unless there is no reasonable alternative.

Future CLI agents may fill either role, including Codex CLI, Claude CLI, Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents.

### Validation Rules

- Runner commands are checked for remote-mutating patterns before subprocess execution.
- `human-merge-decision` never receives a runner.
- Timeout values fall back to the existing default if invalid.
- Role assignments must resolve to configured runner IDs.

## Review Result

### Fields

- `stage`: `review` or `re-review`
- `agent`: Reviewer identity
- `decision`: `Approved`, `Changes Requested`, or `Unknown`
- `findings`: full successful review text when the decision is `Changes Requested`
- `path`: local run-record path

### Validation Rules

- `Approved` and `Changes Requested` are mutually exclusive clear decisions.
- Output containing both decisions is `Unknown`.
- Output without a clear decision is `Unknown`.
