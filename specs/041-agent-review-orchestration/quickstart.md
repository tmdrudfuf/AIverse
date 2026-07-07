# Quickstart: Agent Review Orchestration

## 1. Create a local state file

Create `.agent-workflow/example-state.json` locally. This folder is gitignored.

```json
{
  "featureId": "041-agent-review-orchestration",
  "featureName": "Agent Review Orchestration",
  "currentBranch": "codex/agent-review-orchestration",
  "baseBranch": "main",
  "expectedCommit": "not provided",
  "validationCommands": [
    "npm test",
    "npx tsc --noEmit",
    "npm run build",
    "git diff --check"
  ],
  "scopeConstraints": [
    "Local scripts/templates/docs only.",
    "Do not push.",
    "Do not open or merge PRs.",
    "Do not call external AI or network APIs."
  ],
  "results": []
}
```

## 2. Generate the next prompt

```powershell
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json
```

## 3. Record an agent result

From a file:

```powershell
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage implement --agent Claude --result-file .\claude-output.txt
```

From pasted text:

```powershell
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage review --agent Codex --result-text "Changes Requested - fix the safety guard."
```

## 4. Write the next prompt to the run directory

```powershell
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json --write
```

## Human-Gated Steps

The workflow may suggest these commands, but it must never execute them:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion

All such suggestions are labeled `HUMAN-ONLY`.
