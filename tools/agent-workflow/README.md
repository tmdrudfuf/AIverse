# Agent Workflow Orchestration

This is a local, developer-only helper for role-based implementation-review-fix loops. It generates the next prompt from a small local state file and records pasted agent outputs under `.agent-workflow/runs/<feature-id>/`.

The workflow roles are **Implementer** and **Reviewer**. They are logical roles, not specific vendors, models, or products.

Default assignment:

- Implementer = Codex CLI
- Reviewer = Claude CLI

Fallback assignment is allowed when the default Implementer is unavailable due to rate limits, quota, maintenance, or local CLI issues. For example:

- Implementer = Claude CLI
- Reviewer = Codex CLI

Golden rule: the reviewer should be different from the implementer whenever possible. Do not let an agent review its own implementation unless there is no reasonable alternative.

Future agents may fill either role, including Codex CLI, Claude CLI, Gemini CLI, OpenAI CLI, Qwen CLI, and future local agents. The workflow should not depend on a specific vendor.

It does not call Claude, Codex, ChatGPT, Anthropic, OpenAI, GitHub, or any network API unless a human explicitly runs a configured local CLI stage. It does not push, create PRs, mark PRs ready, merge PRs, or delete branches.

Security warning: the built-in Codex and Claude runners are configured for unrestricted local execution. They may modify or delete files, execute arbitrary local commands, and use network access through the local CLI. Use these defaults only in a trusted development environment. Remote GitHub actions remain separately human-gated by the workflow and are not treated as safe automated steps.

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
  "results": [],
  "stageAgents": {
    "implement": "implementer",
    "review": "reviewer",
    "fix": "implementer",
    "re-review": "reviewer",
    "final-verification": "implementer"
  }
}
```

`stageAgents` is optional. When absent, the default role mapping above is used. Existing state files that explicitly map stages to `codex` or `claude` still work because those agent IDs remain supported aliases.

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
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage review --agent Reviewer --result-text "Changes Requested - fix the boundary test."
```

From a local file:

```powershell
node tools/agent-workflow/cli.js record --state .agent-workflow/example-state.json --stage implement --agent Implementer --result-file .\implementer-output.txt
```

## Stage Rules

- New workflow: implement prompt.
- After implementation result: review prompt.
- After review/re-review result containing `Changes Requested`: fix prompt.
- After fix result: re-review prompt.
- After review/re-review result containing `Approved`: final verification prompt.
- After final verification: human merge decision prompt.

If a result contains both `Changes Requested` and `Approved`, the workflow treats it as `Unknown`.

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
node tools/agent-workflow/cli.js detect-agent --agent implementer
node tools/agent-workflow/cli.js detect-agent --agent reviewer
```

The detection command reports whether the configured command appears executable. The default role aliases probe Codex CLI for `implementer` and Claude CLI for `reviewer`. The legacy `codex` and `claude` agent IDs remain available.

Built-in runner defaults use full local access:

```text
implementer, codex: codex --sandbox danger-full-access --ask-for-approval never exec
reviewer, claude: claude --dangerously-skip-permissions -p {{prompt}}
```

Codex receives prompts through stdin. Claude receives prompts through the `-p` argument. Custom `agentRunners` in a state file retain precedence over these built-in defaults.

## Configure Role Assignments

To swap the default roles, override `stageAgents` and, if needed, `agentRunners` in the local state file:

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

The role names are conventional; the runner IDs are local configuration keys. Keep implement and review assignments different whenever possible.

## Run a Workflow Stage Through a Local CLI

```powershell
node tools/agent-workflow/cli.js run-agent --state .agent-workflow/example-state.json --stage implement --agent implementer --timeout-ms 300000
```

The runner:

- generates the stage prompt with the existing workflow templates,
- sends it to the configured CLI through stdin,
- captures stdout, stderr, exit code, signal, timeout/interruption state, duration, agent identity, and stage,
- writes JSON execution records under `.agent-workflow/runs/<feature-id>/`,
- appends the local result to the workflow state.

The canonical workflow is:

```text
Implementer
-> local validation
-> Reviewer
-> Implementer fixes review findings
-> local validation
-> Reviewer re-review
-> human approval
-> remote actions such as push, PR, or merge
```

`human-merge-decision` is never run through an agent CLI. Remote-mutating commands remain human-only and are refused before subprocess execution.

## Run the Workflow Command

Run exactly the current stage:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json
```

Preview the current stage without spawning an agent or advancing state:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --dry-run
```

Continue across safe runnable stages until blocked:

```powershell
node tools/agent-workflow/cli.js run --state .agent-workflow/example-state.json --until-blocked --max-steps 6
```

The command prints the current stage, selected agent, execution result, next stage, and output paths. Dry-run preview prints the selected stage, selected agent, command preview, prompt path, run directory, and next expected step without spawning an agent. It stops before `human-merge-decision` and never executes push, PR, merge, or branch deletion commands.

## Get an Independent Review of the Current Working Tree

Instead of hand-writing a review prompt, ask the workflow to build one automatically from the actual repository state and run the configured Reviewer:

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/example-state.json
```

This command:

- inspects the repository: current branch, base branch (default `main`, override with `--base <branch>`), merge base, staged changes, unstaged changes, and commits on the branch not yet on the base branch;
- builds a self-contained review prompt (`templates/independent-review.md`) that includes the changed-file summary, bounded diffs, reported validation evidence, `AGENTS.md`, `CLAUDE.md` (when present), and the active feature spec (`specs/<featureId>/spec.md`, or `specPath` in state if set);
- resolves the configured **Reviewer** (`stageAgents.review`, defaulting to the Reviewer role) and runs it;
- classifies the result as `Approved`, `Changes Requested`, `Unknown`, `Execution Failed`, or `Timed Out` - ambiguous output is never treated as approval;
- writes the prompt, a JSON execution record, and the raw Reviewer output under `.agent-workflow/runs/<feature-id>/`, and appends a summary to `state.reviewRuns`;
- prints the decision and a concise next action. It never commits, pushes, opens a PR, or merges.

If the resolved Implementer and Reviewer are configured identically, the command prints a warning that independent review is not guaranteed, but still runs:

```text
Warning: Implementer and Reviewer resolve to the same runner.
Independent review is not guaranteed.
```

Preview what would run without spawning the Reviewer:

```powershell
node tools/agent-workflow/cli.js run-review --state .agent-workflow/example-state.json --dry-run
```

Dry-run prints the resolved Implementer/Reviewer, the sanitized command, the intended prompt path, the run directory, and a repository context summary (branch, base, merge base, and which change categories are non-empty) without spawning any process.

Optional state fields used by `run-review` (all optional, existing state files remain valid without them):

```json
{
  "specPath": "specs/047-agent-workflow-dry-run-preview/spec.md",
  "reviewRuns": []
}
```

`specPath` overrides automatic spec discovery. `reviewRuns` is populated automatically after each real run with `{ outcome, reviewerId, sameRunner, recordedAt, promptPath, executionPath, resultPath }`.
