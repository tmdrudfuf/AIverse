# Quickstart: Role-Based E2E Agent Orchestration

## Prerequisites

- A supported CLI is available for the Implementer role.
- A supported CLI is available for the Reviewer role.
- By default, Codex CLI is installed and available as `codex` for the Implementer role.
- By default, Claude CLI is installed and available as `claude` for the Reviewer role.
- The default Claude Reviewer supports non-interactive prompt mode with `claude --dangerously-skip-permissions -p "<prompt>"`.
- The workflow state file points to a local feature branch and contains no secrets.
- The Reviewer should be different from the Implementer whenever possible.

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
  "stageAgents": {
    "implement": "implementer",
    "review": "reviewer",
    "fix": "implementer",
    "re-review": "reviewer",
    "final-verification": "implementer"
  },
  "results": []
}
```

`stageAgents` is optional. When omitted, the same default role mapping is used. Existing state files that map directly to `codex` or `claude` still work.

To swap assignments when the default Implementer is unavailable, configure local runner IDs and remap stages:

```json
{
  "agentRunners": {
    "claude-implementer": {
      "identity": "Implementer (Claude CLI)",
      "command": "claude",
      "args": ["--dangerously-skip-permissions", "-p", "{{prompt}}"],
      "inputMode": "argument"
    },
    "codex-reviewer": {
      "identity": "Reviewer (Codex CLI)",
      "command": "codex",
      "args": ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"],
      "inputMode": "stdin"
    }
  },
  "stageAgents": {
    "implement": "claude-implementer",
    "review": "codex-reviewer",
    "fix": "claude-implementer",
    "re-review": "codex-reviewer",
    "final-verification": "claude-implementer"
  }
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

- Default Implementer stages receive prompts through Codex CLI stdin.
- Default Reviewer stages receive prompts through `claude --dangerously-skip-permissions -p`.
- `Changes Requested` findings are preserved for the next Implementer fix prompt.
- Failed or ambiguous review output does not advance the workflow.
- The workflow stops before `human-merge-decision`.
- No push, PR, merge, branch deletion, credential storage, or remote mutation occurs automatically.
