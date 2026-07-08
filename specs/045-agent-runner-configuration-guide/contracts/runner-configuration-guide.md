# Contract: Agent Runner Configuration and Real CLI Usage Guide

## CLI Commands

### Dry Run

```powershell
node tools/agent-workflow/cli.js run --state <state.json> --dry-run [--stage <stage>] [--agent <id>]
```

Expected behavior:

- Reads workflow state.
- Determines the current or requested stage.
- Stops without spawn if the stage is `human-merge-decision`.
- Resolves the selected agent when runnable.
- Writes the generated prompt under `.agent-workflow/runs/<feature-id>/`.
- Prints stage, agent, command, prompt path, run directory, and next expected step.
- Does not mutate workflow results or execution records.

### Diagnostics

```powershell
node tools/agent-workflow/cli.js diagnose --state <state.json>
node tools/agent-workflow/cli.js detect-agent --state <state.json> --agent <id>
```

Expected behavior:

- Reports configured and missing runners.
- Reports command path/name and configured args.
- Rejects unsafe commands before subprocess execution.
- Uses safe version checks only for safe configured commands.
- Does not run workflow stages.
- Does not write stage results.

## Safety Contract

- No command may run `human-merge-decision`.
- No command may execute `git push`, `gh pr create`, `gh pr ready`, `gh pr merge`, branch deletion, or other configured remote-mutating commands.
- No command stores credentials or requires repository-stored API keys.
- Tests must use fake process adapters and must not invoke real Codex or Claude services.
