# Quickstart: Agent Workflow Automated Fix Loop

## Example State

Create `.agent-workflow/049-state.json`:

```json
{
  "featureId": "049-agent-workflow-automated-fix-loop",
  "featureName": "Agent Workflow Automated Fix Loop",
  "repositoryPath": "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
  "currentBranch": "codex/agent-workflow-automated-fix-loop",
  "baseBranch": "main",
  "specPath": "specs/049-agent-workflow-automated-fix-loop/spec.md",
  "taskScope": "Implement the orchestrate command and tests from Spec 049.",
  "results": [],
  "validationCommands": [
    "npm test",
    "npx tsc --noEmit",
    "npm run build",
    "git diff --check"
  ],
  "maxFixCycles": 2
}
```

## Dry Run

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/049-state.json --dry-run --max-fix-cycles 2
```

Expected:

- resolved Implementer and Reviewer
- planned stages
- validation command list
- prompt and run directory paths
- `Will spawn: false`
- state file unchanged

## Real Local Loop

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/049-state.json --timeout-ms 300000 --max-fix-cycles 2
```

Expected approval path:

```text
implement -> validate -> review -> final-verification -> human-merge-decision
```

Expected fix path:

```text
implement -> validate -> review -> fix -> revalidate -> re-review -> final-verification -> human-merge-decision
```

Expected bounded failure:

```text
review -> Changes Requested -> fix -> re-review -> Changes Requested -> blocked
```

## Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

## Human Responsibilities

The workflow automates local implementation and review. Push, PR creation, readiness, approval, and merge remain human-only.
