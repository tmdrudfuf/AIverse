# Agent Workflow Orchestration

This is a local, developer-only helper for Claude/Codex implementation-review-fix loops. It generates the next prompt from a small local state file and records pasted agent outputs under `.agent-workflow/runs/<feature-id>/`.

It does not call Claude, Codex, ChatGPT, Anthropic, OpenAI, GitHub, or any network API. It does not push, create PRs, mark PRs ready, merge PRs, or delete branches.

## Minimal State

Create a gitignored local state file such as `.agent-workflow/example-state.json`:

```json
{
  "featureId": "042-agent-review-orchestration",
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

## Generate the Next Prompt

```powershell
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json
```

Write the generated prompt to `.agent-workflow/runs/<feature-id>/`:

```powershell
node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json --write
```

## Record an Agent Result

From pasted text:

```powershell
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage review --agent Codex --result-text "Changes Requested - fix the boundary test."
```

From a local file:

```powershell
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage implement --agent Claude --result-file .\claude-output.txt
```

## Stage Rules

- New workflow: implement prompt.
- After implementation result: review prompt.
- After review/re-review result containing `Changes Requested`: fix prompt.
- After fix result: re-review prompt.
- After review/re-review result containing `Approved`: final verification prompt.
- After final verification: human merge decision prompt.

If a result contains both `Changes Requested` and `Approved`, the workflow treats it as `Changes Requested`.

## Human-Gated Steps

Generated prompts may include suggested commands, but they are labeled `HUMAN-ONLY` and must be run manually:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion

The script never executes these commands.
