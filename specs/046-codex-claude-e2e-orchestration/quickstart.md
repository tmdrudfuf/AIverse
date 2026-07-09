# Quickstart: Codex Claude E2E Orchestration

## Prerequisites

- Codex CLI is installed and available as `codex`.
- Claude Code CLI is installed and available as `claude`.
- Claude supports non-interactive prompt mode with `claude -p "<prompt>"`.
- The workflow state file points to a local feature branch and contains no secrets.

## Example State Shape

```json
{
  "featureId": "046-codex-claude-e2e-orchestration",
  "featureName": "Codex Claude E2E Orchestration",
  "repositoryPath": "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
  "currentBranch": "codex/example-feature",
  "baseBranch": "main",
  "expectedCommit": "HEAD_SHA_HERE",
  "taskScope": "Spec/task scope under review",
  "changedFiles": ["tools/agent-workflow/agentRunner.js"],
  "validationEvidence": ["npm test passed"],
  "scopeConstraints": ["Do not modify unrelated files."],
  "results": []
}
```

## Local Validation Flow

1. Generate the implementation prompt:

   ```powershell
   node tools/agent-workflow/cli.js next --state .agent-workflow/example-state.json
   ```

2. Run one local workflow stage:

   ```powershell
   node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
   ```

3. Run until blocked or human gate:

   ```powershell
   node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked
   ```

4. Inspect local run records under:

   ```text
   .agent-workflow/runs/<feature-id>/
   ```

   Note 2026-07-09: Live local workflow runs record smoke-test evidence under `.agent-workflow/runs/<feature-id>/`.

## Expected Outcomes

- Codex implementation stages receive prompts through stdin.
- Claude review stages receive prompts through `claude -p`.
- `Changes Requested` findings are preserved for the next Codex fix prompt.
- Failed or ambiguous review output does not advance the workflow.
- The workflow stops before `human-merge-decision`.
- No push, PR, merge, branch deletion, credential storage, or remote mutation occurs automatically.
