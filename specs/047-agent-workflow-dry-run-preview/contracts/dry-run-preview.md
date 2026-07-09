# Contract: Agent Workflow Run Dry-Run Preview

## Command

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --dry-run
```

Optional existing flags may be combined when safe:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --stage review --agent claude --dry-run
```

## Expected Output

The command prints a deterministic preview containing:

- `Dry run: true`
- `Current stage: <stage>`
- `Selected agent: <agent id or human gate>`
- `Command: <display-safe command preview>`
- `Prompt path: <path>`
- `Run directory: <path>`
- `Next expected step: <stage or human-merge-decision>`
- `Will spawn: false`

## Safety Behavior

- Must not invoke Codex, Claude, or any configured process adapter.
- Must not record a stage result.
- Must not append an execution record.
- Must not push, create PRs, mark PRs ready, merge, delete branches, or perform remote mutation.
- Must reject unsafe configured runner commands before showing them as runnable.
- Must stop at `human-merge-decision`.

## Failure Behavior

- Missing stage agent configuration returns a clear error and non-zero exit.
- Unsafe runner configuration returns a clear error and non-zero exit before subprocess execution.
- Invalid state path follows existing CLI state-file error behavior.
