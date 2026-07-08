# Quickstart: Agent Workflow Run Command

Run one stage:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
```

Run until blocked:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked --max-steps 6
```

The command prints current stage, selected agent, result, next stage, and output paths.

Human-only operations remain manual:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion
