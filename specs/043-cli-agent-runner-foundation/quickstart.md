# Quickstart: CLI Agent Runner Foundation

## Detect configured CLIs

```powershell
node tools/agent-workflow/cli.js detect-agent --agent codex
node tools/agent-workflow/cli.js detect-agent --agent claude
```

## Run the next workflow stage with a configured agent

```powershell
node tools/agent-workflow/cli.js run-agent --state .agent-workflow/example-state.json --agent codex --stage implement --timeout-ms 300000
```

The command writes a JSON execution record under:

```text
.agent-workflow/runs/<feature-id>/
```

## Human-gated operations

The runner must never execute:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion

Run these manually only after human approval.
