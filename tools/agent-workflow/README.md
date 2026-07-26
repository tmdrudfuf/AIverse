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

Probe an Implementer/Reviewer pair by role instead of by agent ID:

```powershell
node tools/agent-workflow/cli.js detect-agent --implementer claude
node tools/agent-workflow/cli.js detect-agent --implementer claude --state .agent-workflow/example-state.json
```

This resolves the other configured agent (`codex`) as Reviewer the same way `orchestrate --implementer` does, and prints both detection results in one JSON object with a `roleSource` field. `--state` is optional here; without it, detection uses the built-in default roster and runners.

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

`--implementer <agent-id>` also works here: for an Implementer-role stage (`implement`, `fix`, `final-verification`) it selects that agent; for a Reviewer-role stage (`review`, `re-review`) it selects the automatically-derived opposite agent for that stage. An explicit `--agent` still takes precedence when both are supplied. See [Runtime Role Selection](#runtime-role-selection) below for the full resolution rules.

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
- writes the prompt, a JSON execution record, the raw Reviewer output, and a structured review JSON artifact when valid under `.agent-workflow/runs/<feature-id>/`, and appends a summary to `state.reviewRuns`;
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

Dry-run prints the resolved Implementer/Reviewer, the role source, the sanitized command, the intended prompt path, the run directory, and a repository context summary (branch, base, merge base, and which change categories are non-empty) without spawning any process.

`--implementer <agent-id>` is also supported: it sets which agent plays Implementer for context in the generated prompt and, when `--agent` is not also supplied, auto-derives the Reviewer the same way `orchestrate --implementer` does. When both `--implementer` and `--agent` are supplied, `--agent` remains the authoritative Reviewer override (existing behavior).

Optional state fields used by `run-review` (all optional, existing state files remain valid without them):

```json
{
  "specPath": "specs/047-agent-workflow-dry-run-preview/spec.md",
  "reviewRuns": []
}
```

`specPath` overrides automatic spec discovery. `reviewRuns` is populated automatically after each real run with `{ outcome, reviewerId, sameRunner, recordedAt, promptPath, executionPath, resultPath }`.

### Structured Review Handoff

Reviewer output remains human-readable Markdown. Reviewers that support structured handoff also include exactly one fenced JSON payload under `## Structured Review`:

````markdown
# Review Decision: Changes Requested

## Blocking Findings

- Severity: P1
  File: tools/agent-workflow/example.js
  Location: 42-48
  Problem: Unsafe command reaches process spawn.
  Impact: Remote-mutating commands could bypass safety validation.
  Recommendation: Validate the normalized command before spawn.

## Non-Blocking Improvements

(none)

## Validation Performed

npm test

## Final Recommendation

Request changes.

## Structured Review

```json
{
  "schemaVersion": 1,
  "decision": "changes_requested",
  "summary": "One blocking safety issue was found.",
  "blockingFindings": [
    {
      "id": "P1-001",
      "severity": "P1",
      "filePath": "tools/agent-workflow/example.js",
      "location": "42-48",
      "summary": "Unsafe command reaches process spawn.",
      "reason": "The configured command is replaced before safety validation.",
      "recommendation": "Validate the normalized configured command before creating the process invocation."
    }
  ],
  "nonBlockingFindings": [],
  "questions": []
}
```
````

Structured schema rules:

- `schemaVersion` must be `1`; unsupported versions are rejected.
- `decision` must be `approved`, `changes_requested`, or `questions`.
- Finding `severity` must be `P0`, `P1`, `P2`, or `P3`.
- Finding IDs must be unique within one review artifact.
- Blocking findings must include actionable details and a recommendation.
- `approved` requires no blocking findings and no questions.
- `changes_requested` requires blocking findings and no questions.
- `questions` requires one or more valid questions and no blocking findings.
- The workflow preserves supplied fields and does not invent missing reviewer information.

Conflict and fallback behavior:

- No structured block: existing Markdown-only decision and finding extraction remain available.
- Valid structured block with matching Markdown decision: the structured decision is used.
- Valid structured block with Markdown decision `Unknown`: the structured decision is used.
- Markdown and structured decisions conflict: the result is `Unknown`.
- Malformed, duplicated, unsupported, or invalid structured content: the result is `Unknown`.
- Invalid structured data is never treated as approval and does not start a blind fix cycle.

When the structured block is valid, a separate JSON artifact is written beside the raw Markdown result, and review run records include additive fields such as `structuredReviewStatus`, `structuredReviewDecision`, `structuredReviewPath`, and `structuredReviewDiagnostics`. Existing state files and old run records without these fields remain readable.

### Finding Lifecycle Tracking

Structured Review schema version 1 also supports optional lifecycle metadata for re-review cycles:

```json
{
  "findingLifecycle": [
    {
      "findingId": "P1-001",
      "status": "resolved",
      "explanation": "The re-review confirmed the missing guard now covers committed branch changes."
    }
  ]
}
```

Lifecycle statuses are `new`, `still_open`, and `resolved`.

Initial reviews do not need lifecycle metadata. When no prior structured finding history exists, current structured findings are recorded as new. Later decision-producing re-reviews must classify every previous finding exactly once. Previous finding IDs must be reused only for the same underlying issue, new finding IDs must not collide with prior IDs, and approval is rejected while any prior blocking finding remains `still_open`.

Invalid lifecycle data stops conservatively. Examples include missing classifications, duplicate classifications, unknown IDs, previous findings marked `new`, new findings marked `resolved`, still-open findings omitted from current findings, resolved findings still present as current blockers, or incompatible severity/summary/recommendation changes under a reused ID.

Markdown-only initial reviews keep the legacy fallback behavior. Markdown-only re-reviews cannot safely classify previous structured findings, so the workflow blocks instead of inferring resolution from prose.

When lifecycle normalization is applicable, the workflow writes a normalized `*-finding-lifecycle.json` artifact under `.agent-workflow/runs/<feature-id>/` and stores additive state fields such as:

```json
{
  "reviewSequence": 2,
  "findingHistory": [],
  "latestFindingLifecycleStatus": "valid",
  "latestFindingLifecyclePath": ".agent-workflow/runs/<feature-id>/...",
  "latestFindingLifecycleDiagnostics": []
}
```

Fix prompts use only active open blocking findings (`new` or `still_open`). Resolved findings remain in history and artifacts for human inspection but are excluded from active fix instructions.

### Reviewer Question Loop

A Reviewer may ask one structured clarification round before issuing a final decision. The loop is conditional and bounded:

```text
review -> questions -> answer-questions -> final-review -> Approved or Changes Requested
```

Questions are appropriate when the Reviewer needs evidence or clarification before deciding. If the Reviewer already knows a code or documentation change is required, it should return `changes_requested` instead.

A question review uses the same Markdown plus structured review format:

```json
{
  "schemaVersion": 1,
  "decision": "questions",
  "summary": "Clarification is needed before final decision.",
  "blockingFindings": [],
  "nonBlockingFindings": [],
  "questions": [
    {
      "id": "Q1",
      "question": "Which validation result covers the timeout path?",
      "reason": "The review artifact does not show evidence for this behavior."
    }
  ]
}
```

Question validation rules:

- Each question requires unique `id`, non-empty `question`, and non-empty `reason`.
- Questions must not request secrets, credentials, command execution, remote mutation, validation bypass, safety-rule bypass, or unrelated work.
- Mixed states such as `approved` with questions, `changes_requested` with questions, or `questions` with blocking findings are invalid and classify as `Unknown`.

The Implementer answers questions in an `answer-questions` stage. This stage is clarification-only: the prompt instructs the Implementer not to edit files, commit, reinterpret the stage as a fix request, or perform remote mutation. If a change is needed, the final Reviewer should return `changes_requested`, and the existing fix loop handles the modification.

The answer output may include human-readable Markdown plus one `## Structured Answers` JSON block:

```json
{
  "schemaVersion": 1,
  "answers": [
    {
      "questionId": "Q1",
      "answer": "The timeout path is covered by orchestrateCommand.test.ts.",
      "evidence": [
        "tools/agent-workflow/orchestrateCommand.test.ts"
      ]
    }
  ]
}
```

Answer validation rules:

- Every known question ID must receive exactly one answer.
- Duplicate answers, unknown question IDs, missing answers, and empty answers are invalid.
- Evidence is optional and preserved only when supplied.

After valid answers, `final-review` asks the Reviewer for a final independent decision. In Spec 051, a second `questions` decision blocks safely instead of starting another round.

Additional state fields may be populated additively:

```json
{
  "latestReviewerQuestionStatus": "valid",
  "latestReviewerQuestions": [],
  "latestReviewerQuestionPath": ".agent-workflow/runs/<feature-id>/...",
  "latestReviewerQuestionDiagnostics": [],
  "latestImplementerAnswerStatus": "valid",
  "latestImplementerAnswers": {},
  "latestImplementerAnswerPath": ".agent-workflow/runs/<feature-id>/...",
  "latestImplementerAnswerDiagnostics": [],
  "questionCycle": 1,
  "maxQuestionCycles": 1
}
```

Resume behavior uses `state.orchestration.currentStage`. A run interrupted at `answer-questions` resumes by answering the saved questions; a run interrupted at `final-review` resumes by using the saved answers and does not repeat the answer stage.

## Run the Automated Implement-Review-Fix Loop

Run the complete local loop with one command:

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --timeout-ms 300000 --max-fix-cycles 2
```

The workflow automates local implementation and review. Push, PR creation, readiness, approval, merge, and remote deletion remain human-only.

Default flow:

```text
implement -> validate -> review -> final-verification -> human-merge-decision
```

Changes Requested flow:

```text
implement -> validate -> review -> fix -> revalidate -> re-review -> final-verification -> human-merge-decision
```

Question flow:

```text
implement -> validate -> review -> answer-questions -> final-review -> final-verification -> human-merge-decision
```

Bounded failure flow:

```text
review -> Changes Requested -> fix -> re-review -> Changes Requested -> blocked
```

The loop stops conservatively when validation fails, a runner times out or exits non-zero, the Reviewer returns `Unknown`, a `Changes Requested` result has no actionable findings, a fix cycle produces no repository diff, the branch changes during orchestration, or the configured fix-cycle limit is reached.

When a valid structured `changes_requested` review is present, fix prompts use the structured blocking findings, preserving finding IDs, severity, file path, location, summary, reason, and recommendation. When structured data is absent, the loop falls back to the existing Markdown finding extraction. When structured data is invalid, unsupported, or conflicting, the loop blocks conservatively.

Question requests do not consume fix-cycle count. Fix cycles begin only after the final Reviewer returns valid `changes_requested`.

Preview without spawning agents, running validation, writing execution/result artifacts, or advancing state:

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --dry-run --max-fix-cycles 2
```

Dry-run prints the feature, branch, current stage, resolved Implementer/Reviewer, command previews, validation commands, max fix cycles, planned stages, prompt paths, run directory, next expected stage, and `Will spawn: false`.
It also previews conditional `answer-questions` and `final-review` prompt paths without claiming that the question loop will definitely execute.
It also notes that previous findings may be supplied to re-review and that a lifecycle artifact may be generated after a decision-producing review.

Useful flags:

- `--max-fix-cycles <n>` limits fix/re-review cycles. Default: `2`.
- `--timeout-ms <ms>` applies to local agent and validation subprocesses.
- `--skip-validation` skips validation stages for controlled smoke tests only.
- `--validation-command <command>` can be repeated to override validation commands.
- `--implementer <agent-id>` picks the Implementer for this run and auto-resolves the Reviewer. See [Runtime Role Selection](#runtime-role-selection).

State is persisted after each completed stage in the existing state file. On rerun, `orchestrate` resumes from `state.orchestration.currentStage`, so completed implementation or validation stages are not repeated unless the state says they are still pending.

Additional state fields populated by `orchestrate` include:

```json
{
  "orchestration": {
    "currentStage": "human-merge-decision",
    "maxFixCycles": 2,
    "decision": "Ready for human merge decision",
    "nextExpectedAction": "human approval before push, PR, readiness, approval, merge, or remote deletion."
  },
  "orchestrationRuns": [],
  "validationRuns": [],
  "fixCycleCount": 0,
  "latestReviewDecision": "Approved"
}
```

Validation defaults remain:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Each validation command records stdout, stderr, exit code, signal, timeout/interruption state, duration, status, and artifact path under `.agent-workflow/runs/<feature-id>/`.

## Runtime Role Selection

`--implementer <agent-id>` lets you choose the Implementer for one execution without editing the state file. The workflow automatically resolves the other configured agent as Reviewer, so `--reviewer` is never required for the current two-agent configuration:

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --implementer claude
```

resolves:

```text
Resolved roles
Implementer: Claude Code CLI (claude)
Reviewer: OpenAI Codex CLI (codex)
Role source: CLI override
```

and

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --implementer codex
```

resolves the opposite pair (Implementer=Codex, Reviewer=Claude).

Supported on `orchestrate`, `run`, `run-review`, and `detect-agent`. Not added to `next`, `record`, or `run-agent`, which never resolve a Reviewer role; `--implementer` is silently ignored there.

### Resolution Priority

1. `--implementer` CLI override (this execution only).
2. State-configured roles (`stageAgents.implement`/`stageAgents.review`).
3. Existing defaults (Implementer = Codex CLI, Reviewer = Claude CLI).

A CLI override never rewrites `stageAgents`/`agentRunners` in the state file. Run it as many times as you like with different `--implementer` values; the configured file is untouched.

### Automatic Reviewer Resolution

For the default two-agent roster (`codex`, `claude`), the workflow always picks "the other one." For a larger roster (opt in with `state.roleRoster: ["codex", "claude", "gemini", ...]`), it either preserves a distinct, valid, configured Reviewer (`stageAgents.review`) or rejects with an ambiguity diagnostic — it never guesses nondeterministically, and it never assigns the same agent to both roles.

### Validation Before Spawn

Before any process spawns, `--implementer` is rejected when:

- the requested agent does not exist in the merged `agentRunners` configuration,
- the requested agent is configured with `enabled: false`,
- the requested or auto-derived agent has no valid or safe runner configuration (the existing Spec 045 remote-mutation checks run against the actual resolved command and arguments, not just the agent name),
- no distinct Reviewer candidate can be resolved,
- more than one Reviewer candidate exists and no distinct configured Reviewer could be preserved.

Every rejection names the requested Implementer and lists the available eligible agents, and leaves any persisted state role configuration unchanged.

### Resume Behavior

Once a non-dry-run `orchestrate` run has resolved roles, those roles are pinned into `state.orchestration` (`resolvedImplementerId`, `resolvedReviewerId`, `roleResolutionSource`) and reused for the rest of that run — a resume (re-running `orchestrate` on the same state file while it is not yet at `human-merge-decision`/`blocked`) never recalculates roles from current defaults, edited `stageAgents`, or a missing `--implementer`. A resume with no `--implementer`, or with one matching the pinned Implementer, continues normally. A resume with a **conflicting** `--implementer` is rejected before any process spawns:

```text
Existing run roles: Implementer=claude, Reviewer=codex.
Requested resume override: Implementer=codex.
Rejected before spawn because runtime roles are already fixed for this run.
```

A state file with no `orchestration.startedAt` (a fresh state, or one reset for a new attempt) is treated as a new run and is free to resolve roles again from `--implementer`/state/defaults; a completed run's pinned roles never leak into an unrelated later run.

Top-level state also gains `latestResolvedRoles: { implementer, reviewer }` and `latestRoleResolutionSource` after every `orchestrate` invocation, for auditability.

### Dry-Run

```powershell
node tools/agent-workflow/cli.js orchestrate --state .agent-workflow/example-state.json --implementer claude --dry-run
```

```text
Dry run: true
...
Resolved roles
Implementer: Claude Code CLI (claude)
Reviewer: OpenAI Codex CLI (codex)
Role source: CLI override
...
Will spawn agents: no
Will mutate state: no
Will run validation: no
Will perform remote mutation: no
Will spawn: false
```

Dry-run performs full role and runner-safety validation and reports the same diagnostic a real run would produce on failure, but never spawns a process, writes state, writes a run artifact, or runs a validation command.

### CLI Parsing Notes

- `--implementer value` (space-separated) is the only supported form, consistent with every other flag in this CLI; `--implementer=value` is not supported.
- Repeating `--implementer` with the same value normalizes to that value.
- Repeating `--implementer` with different values is rejected before spawn.
- `--implementer` with no value (end of the command line, or immediately followed by another flag) is rejected before spawn.

### Multi-Agent Extension Point

`state.roleRoster` (optional array of agent IDs) extends the roster beyond the default `["codex", "claude"]` for maintainers running more than two configured agents. With exactly two eligible agents, resolution is always exact. With three or more, `--implementer` requires a distinct, valid, configured Reviewer to already exist in `stageAgents.review`, or it rejects rather than guessing.

Remote mutation (`git push`, `gh pr create`/`ready`/`merge`, branch deletion, and equivalents) remains human-only regardless of role selection; no runner becomes safe merely because it was selected through `--implementer`.

## Run Summaries and Audit Trail

Every non-dry-run `orchestrate` invocation writes a normalized, versioned run summary once it reaches the natural end of its internal loop (approved and awaiting the human merge decision, blocked for any reason, timed out, etc.):

```text
.agent-workflow/runs/<feature-id>/run-summary.json
.agent-workflow/runs/<feature-id>/run-summary.md
```

`run-summary.json` is the normalized source of truth (`schemaVersion: 1`); `run-summary.md` is a deterministic Markdown rendering of the exact same model, produced by `tools/agent-workflow/runSummaryRenderer.js` — there is only one summary-generation code path, not two. Both files are derived entirely from already-persisted workflow evidence (`state.orchestration`, `state.orchestrationRuns`, `state.reviewRuns`, `state.validationRuns`, `state.findingHistory`); nothing is fabricated, and unknown/absent evidence is reported as such rather than as false success.

At the end of a real `orchestrate` run, the CLI prints a pointer:

```text
Run summary
Markdown: .agent-workflow/runs/<feature-id>/run-summary.md
JSON: .agent-workflow/runs/<feature-id>/run-summary.json
Status: awaiting-human-decision
Reviewer decision: Approved
Validation: passed
```

### Schema (`schemaVersion: 1`)

See `specs/054-review-run-summary-audit-trail/contracts/run-summary-schema.md` for the full shape and its enforced invariants. Top-level sections: `run` (status/stopReason/timing), `roles`, `execution` (stages attempted/completed), `stageTimeline[]`, `validation`, `review`, `findings`, `commits`, `humanGate`, `artifacts[]`, `warnings[]`.

**Run status** (`run.status`) is one of: `planned`, `running`, `blocked`, `failed`, `interrupted`, `timed-out`, `completed`, `awaiting-human-decision`. A run that reaches the human merge boundary is always `awaiting-human-decision` — never a status implying a push/PR/merge occurred.

**Stop reason** (`run.stopReason`, populated only when `status` is not `awaiting-human-decision`): `validation-failed`, `changes-requested-limit-reached`, `reviewer-questions-unresolved`, `structured-review-invalid`, `review-decision-unknown`, `timeout`, `interrupted`, `unsafe-runner`, `role-resolution-failed`, `command-failed`, `state-invalid`, `manual-stop`. Derived from the same small set of exact `orchestration.reason` strings the orchestrator already produces (never inferred from free-form log prose) plus the structured `latestReviewDecision`/validation-record `status` fields already in state.

**Human gate** (`humanGate`): `ready` is computed independently from `review.finalDecision === "Approved"`, `review.structuredReviewStatus !== "invalid"` (Markdown-only Approved reviews with an *absent* structured block remain valid — only genuinely malformed structured data blocks readiness), `validation.status === "passed"`, and `findings.remainingBlocking === 0` — it is not simply copied from `run.status`, so a future state-machine bug that reached `human-merge-decision` without actually satisfying those conditions would still be caught and reported as `ready: false`.

**Roles**: sourced from the Spec 053 pinned fields (`orchestration.resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource`), falling back to `latestResolvedRoles`/`latestRoleResolutionSource`, then to legacy `orchestration.implementerId`/`reviewerId`, then to an explicit `null` source rather than a fabricated default. A resumed run reports its original pinned roles, never newly recalculated ones.

**Stage timeline** (`stageTimeline[]`): reconstructed by replaying the same fixed stage-transition rules the orchestrator itself uses, driven by the `stage`/`status`/`outcome` fields already recorded in `state.orchestrationRuns` (implement/fix/answer-questions), `state.reviewRuns` (review/re-review/final-review — an additive `stage` field distinguishes these), and `state.validationRuns` (validate/revalidate/final-verification). Because these are durable, append-only arrays, resuming a run never duplicates a stage that already ran and never loses history from an earlier invocation.

**Validation**: `validation.status` reflects the most recent validation attempt (`passed`/`failed`/`timed-out`/`interrupted`), or `skipped` when the run used `--skip-validation` (an additive `orchestration.validationSkipped` flag distinguishes this from `not-run`, which means validation simply has not happened yet).

**Findings**: integrates Spec 052 finding lifecycle tracking (`state.findingHistory`) directly — `opened`, `resolved`, `carriedForward`, `remainingBlocking`, `remainingNonBlocking`, and a per-finding `openedReviewAttempt`/`resolvedReviewAttempt`. `remainingBlocking` always matches the orchestrator's own `activeBlockingFindings` count.

**Commit provenance**: this workflow reviews the live branch/working-tree diff rather than persisting an implementation commit SHA, so `commits.implementationCommit`/`reviewedCommit`/`exactCommitMatch` are `null`/`"unknown"` by design — never fabricated as a match. `commits.currentBranchHead` reports the live `git rev-parse HEAD` **only** for a summary written by a real `orchestrate` run (which already has live git context from that run itself, at zero marginal process cost); the read-only `summary` CLI command never spawns a process — including git — so it always reports `currentBranchHead` as `null` rather than add a new subprocess call just for this field.

**Secrets**: raw command stdout/stderr, full Reviewer/Implementer output, and environment values are never copied into either summary artifact — only command text, status, exit code, duration, and artifact *paths* (the full text remains in the existing detailed audit artifacts referenced by path).

### Dry-Run

`orchestrate --dry-run` writes no summary artifacts (matching every other dry-run guarantee) and instead previews the paths that a real run would write:

```text
Run summary artifacts:
  Would write: .agent-workflow/runs/<feature-id>/run-summary.json
  Would write: .agent-workflow/runs/<feature-id>/run-summary.md
  Actual writes: no
```

### Inspect a Run Summary (Read-Only)

```powershell
node tools/agent-workflow/cli.js summary --state .agent-workflow/example-state.json
node tools/agent-workflow/cli.js summary --state .agent-workflow/example-state.json --format json
```

`summary` recomputes the model directly from the supplied state file every time (the same pure `buildRunSummary` function `orchestrate` uses to write the cached artifact) rather than reading back the cached `run-summary.json` — so it can never disagree with a stale file, and it works unchanged for state files created before this feature existed. It never spawns a process, runs validation, mutates state, or writes any artifact, under any input, including old/legacy state.

### Backward Compatibility

Old state files and run directories remain fully readable. Missing Spec 052/053/054 fields degrade to explicit `null`/`"unknown"`/empty values rather than crashes or fabricated activity; a missing or malformed optional artifact (e.g. a validation log referenced by a stale path) produces a `warnings[]` entry, not a crash, and downgrades `humanGate.ready` when the missing evidence was required for readiness. Reading a state file for `summary`/`buildRunSummary` never writes back to it.
