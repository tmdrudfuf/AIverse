# Quickstart: Agent Runner Configuration and Real CLI Usage Guide

## 1. Copy an Example State

```powershell
New-Item -ItemType Directory -Force .agent-workflow
Copy-Item tools/agent-workflow/examples/codex-claude-state.json .agent-workflow/example-state.json
```

Edit `.agent-workflow/example-state.json` for your feature branch and expected commit. Do not add credentials or tokens.

## 2. Check Local CLI Availability

```powershell
node tools/agent-workflow/cli.js diagnose --state .agent-workflow/example-state.json
node tools/agent-workflow/cli.js detect-agent --state .agent-workflow/example-state.json --agent codex
node tools/agent-workflow/cli.js detect-agent --state .agent-workflow/example-state.json --agent claude
```

## 3. Preview the Current Stage

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --dry-run
```

Verify the selected stage, agent, command, prompt path, run directory, and next expected step.

## 4. Run One Stage

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
```

## 5. Run Until Blocked

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked --max-steps 6
```

The workflow stops on failure, missing config, max steps, or before human merge decision.

## 6. Inspect Logs

```powershell
Get-ChildItem .agent-workflow/runs -Recurse
```

## 7. Human-Only Merge Step

Push, PR creation, ready-for-review, merge, and branch deletion remain manual. Do not configure an agent runner to execute them.
