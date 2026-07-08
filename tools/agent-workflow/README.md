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

## Detect Local Agent CLIs

```powershell
node tools/agent-workflow/cli.js detect-agent --agent codex
node tools/agent-workflow/cli.js detect-agent --agent claude
```

The detection command reports whether the configured command appears executable. It does not call GitHub, OpenAI, Anthropic, or any SDK/API.

Use a workflow state file when you have custom command paths or stage mappings:

```powershell
node tools/agent-workflow/cli.js detect-agent --state .agent-workflow/example-state.json --agent codex
node tools/agent-workflow/cli.js diagnose --state .agent-workflow/example-state.json
```

Diagnostics reports configured command names, missing config, unsafe command rejection, and local availability. Unsafe commands are rejected before a subprocess is spawned.

## Configure Real Local Runners

Copy the committed example state into the gitignored runtime directory:

```powershell
New-Item -ItemType Directory -Force .agent-workflow
Copy-Item tools/agent-workflow/examples/codex-claude-state.json .agent-workflow/example-state.json
```

The example uses command names expected on PATH:

- `codex` for OpenAI Codex CLI
- `claude` for Claude Code CLI

If your CLIs are installed somewhere else, edit the local `.agent-workflow/example-state.json` command fields. Do not commit local state files, API keys, tokens, or credentials.

## Run a Workflow Stage Through a Local CLI

```powershell
node tools/agent-workflow/cli.js run-agent --state .agent-workflow/example-state.json --stage implement --agent codex --timeout-ms 300000
```

The runner:

- generates the stage prompt with the existing workflow templates,
- sends it to the configured CLI through stdin,
- captures stdout, stderr, exit code, signal, timeout/interruption state, duration, agent identity, and stage,
- writes JSON execution records under `.agent-workflow/runs/<feature-id>/`,
- appends the local result to the workflow state.

`human-merge-decision` is never run through an agent CLI. Remote-mutating commands remain human-only and are refused before subprocess execution.

## Run the Workflow Command

Preview the current stage without spawning an agent:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --dry-run
```

Run exactly the current stage:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
```

Continue across safe runnable stages until blocked:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked --max-steps 6
```

The command prints the current stage, selected agent, execution result, next stage, and output paths. It stops before `human-merge-decision` and never executes push, PR, merge, or branch deletion commands.

If a command times out, exits non-zero, is interrupted, or returns empty output, the workflow records execution diagnostics but does not record a stage result or advance the workflow.

## Inspect Logs

```powershell
Get-ChildItem .agent-workflow/runs -Recurse
```

Execution logs and generated prompts stay under `.agent-workflow/runs/<feature-id>/`, which is gitignored.

## Human-Only Merge Step

When the workflow reaches `human-merge-decision`, inspect the final verification output and perform remote-mutating commands yourself if appropriate. The runner never executes:

- `git push`
- `gh pr create`
- `gh pr ready`
- `gh pr merge`
- branch deletion
