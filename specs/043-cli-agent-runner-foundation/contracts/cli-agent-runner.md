# Contract: CLI Agent Runner

## Default Runner IDs

- `codex`: OpenAI Codex CLI
- `claude`: Claude Code CLI

## Stage Defaults

```json
{
  "implement": "codex",
  "review": "claude",
  "fix": "codex",
  "re-review": "claude",
  "final-verification": "codex"
}
```

`human-merge-decision` has no default runner and must never execute automatically.

## State Extension

Workflow state may include:

```json
{
  "agentRunners": {
    "codex": {
      "agentId": "codex",
      "identity": "OpenAI Codex CLI",
      "command": "codex",
      "args": [],
      "inputMode": "stdin",
      "timeoutMs": 300000
    }
  },
  "stageAgents": {
    "implement": "codex",
    "review": "claude"
  }
}
```

## Execution Contract

`run-agent`:

1. Loads workflow state.
2. Determines or accepts a workflow stage.
3. Refuses `human-merge-decision`.
4. Resolves agent config.
5. Rejects remote-mutating command configs.
6. Generates the stage prompt.
7. Runs the configured CLI through subprocess adapter.
8. Writes a JSON execution record under `.agent-workflow/runs/<feature-id>/`.
9. Appends a workflow result to state.

## Safety Contract

The runner must refuse command configs matching these human-only operations:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion
- remote branch deletion
