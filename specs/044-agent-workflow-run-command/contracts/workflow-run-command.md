# Contract: Workflow Run Command

## CLI

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked --max-steps 6
```

## Stop Reasons

- `single-stage-complete`: one-stage default completed successfully.
- `failure`: an execution returned non-`ok` output state.
- `human-merge-decision`: next stage is human-only.
- `missing-agent`: no runner config exists for a runnable stage.
- `max-steps`: loop guard reached.

## Safety

The command must never execute human-merge-decision or any remote-mutating operation. It must use existing Spec 043 runner safety checks.
