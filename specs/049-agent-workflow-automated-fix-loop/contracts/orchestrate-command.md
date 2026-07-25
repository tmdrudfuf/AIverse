# Contract: Agent Workflow Orchestrate Command

## Command

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --timeout-ms 300000 --max-fix-cycles 2
```

Optional:

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --dry-run
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --skip-validation
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --validation-command "npm test"
```

## Dry-Run Output

The preview prints:

- feature
- branch
- current stage
- Implementer and Reviewer identities
- command previews
- validation commands
- max fix cycles
- planned stages
- prompt artifact paths
- `Will spawn: false`

Dry-run must not spawn agents, run validation, mutate workflow state, or write execution/result artifacts.

## Real Run Output

The command prints:

- feature
- branch
- Implementer
- Reviewer
- current/final stage
- validation status
- review decision
- fix cycle count
- next action
- artifact paths
- final decision

## Terminal Decisions

- `Ready for human merge decision`
- `Blocked`
- `Failed`

## Safety Behavior

- Remote-mutating runner configs are rejected before spawn.
- Push, PR creation/edit/readiness/approval, merge, and remote deletion remain human-only.
- Validation failures prevent review.
- Only explicit Reviewer `Approved` reaches final verification.
