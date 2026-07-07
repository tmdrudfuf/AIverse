# Contract: Local Agent Workflow State

The workflow state is a JSON object read by `tools/agent-workflow/cli.js`.

## Minimal State

```json
{
  "featureId": "041-agent-review-orchestration",
  "featureName": "Agent Review Orchestration",
  "currentBranch": "codex/agent-review-orchestration",
  "baseBranch": "main",
  "validationCommands": [
    "npm test",
    "npx tsc --noEmit",
    "npm run build",
    "git diff --check"
  ],
  "scopeConstraints": [
    "Do not push.",
    "Do not open or merge PRs.",
    "Do not call external AI or network APIs."
  ],
  "results": []
}
```

## Next Prompt Contract

Given the minimal state above, `next` returns an implement prompt.

Given the latest result has `stage: "implement"`, `next` returns a review prompt.

Given the latest review or re-review result contains `Changes Requested`, `next` returns a fix prompt.

Given the latest result has `stage: "fix"`, `next` returns a re-review prompt.

Given the latest review or re-review result contains `Approved` and does not contain `Changes Requested`, `next` returns a final verification prompt.

Given the latest result has `stage: "final-verification"`, `next` returns a human merge decision prompt.

## Result Recording Contract

`record` accepts pasted text or a local result file path, writes the result under `.agent-workflow/runs/<feature-id>/`, and appends a `WorkflowResult` entry to the state.

The script must reject any run root that would place outputs outside `.agent-workflow/runs/`.

## Safety Contract

The script must never execute remote-mutating commands. It may print them only under a `HUMAN-ONLY` label.
