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

**Validation**: `validation.status` mirrors the **full** validation phase only (`passed`/`failed`/`timed-out`/`interrupted`), or `skipped` when the run used `--skip-validation` (an additive `orchestration.validationSkipped` flag distinguishes this from `not-run`, which means validation simply has not happened yet). Under the Spec 055 `focused-final-full` strategy, a focused-only pass is never reported as aggregate `"passed"` — see [Focused Validation Review Loop](#focused-validation-review-loop) for the two-phase breakdown (`validation.focused`/`validation.full`).

**Findings**: integrates Spec 052 finding lifecycle tracking (`state.findingHistory`) directly — `opened`, `resolved`, `carriedForward`, `remainingBlocking`, `remainingNonBlocking`, and a per-finding `openedReviewAttempt`/`resolvedReviewAttempt`. `remainingBlocking` always matches the orchestrator's own `activeBlockingFindings` count.

**Commit provenance**: this workflow reviews the live branch/working-tree diff rather than persisting an implementation commit SHA, so `commits.implementationCommit`/`reviewedCommit` remain `null` by design — never fabricated. `commits.reviewedTarget`/`fullValidationTarget` (Spec 055) record the exact tree state (`{ commit, dirty, dirtyHash }`) the Reviewer approved and the exact tree state `final-verification` validated; `commits.exactCommitMatch` is `true`/`false` once both exist, `"unknown"` otherwise — never fabricated, and never a positive mismatch verdict just because one side lacks target evidence (see [Focused Validation Review Loop](#focused-validation-review-loop)). `commits.currentBranchHead` reports the live `git rev-parse HEAD` **only** for a summary written by a real `orchestrate` run (which already has live git context from that run itself, at zero marginal process cost); the read-only `summary` CLI command never spawns a process — including git — so it always reports `currentBranchHead` as `null` rather than add a new subprocess call just for this field.

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

## Focused Validation Review Loop

Large changes with many independent-review fix cycles (Spec 054 needed 17 rounds) pay the full validation suite's cost after *every* fix, even when a focused, targeted test run would have been enough evidence to continue iterating. This feature lets `validate`/`revalidate` run a smaller, explicitly configured command list during implementation and fix cycles, while keeping `final-verification` — the sole gate for merge readiness — always running the complete list. No new orchestration stages are introduced; only which command list a given `validate`/`revalidate`/`final-verification` occurrence uses.

### Strategies

- **`full-every-cycle`** (default, and the only strategy prior to this feature): every `validate`/`revalidate`/`final-verification` occurrence runs the same full command list. Explicit backward compatibility — a state file or invocation that specifies nothing behaves exactly as before this feature existed.
- **`focused-final-full`** (opt-in): `validate`/`revalidate` run the configured focused command list; `final-verification` always runs the full command list, regardless of strategy. A focused-only pass can **never** satisfy `humanGate.ready` — only a passing `final-verification` against the exact tree the Reviewer approved can.

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/example-state.json `
  --implementer claude `
  --validation-strategy focused-final-full `
  --focused-validation-command "node --test tools/agent-workflow/validationPolicy.test.ts" `
  --focused-validation-command "node --test tools/agent-workflow/orchestrateCommand.test.ts" `
  --full-validation-command "npm test" `
  --full-validation-command "npx tsc --noEmit" `
  --full-validation-command "npm run build" `
  --full-validation-command "git diff --check"
```

Equivalent state configuration (`state.validationPolicy`):

```json
{
  "validationPolicy": {
    "strategy": "focused-final-full",
    "focusedCommands": ["node --test tools/agent-workflow/validationPolicy.test.ts"],
    "fullCommands": ["npm test", "npx tsc --noEmit", "npm run build", "git diff --check"]
  }
}
```

CLI flags take precedence over state for a single invocation and never rewrite the state file's configured policy, matching the existing `--implementer`/`--validation-command` precedent. The legacy repeatable `--validation-command` flag and `state.validationCommands` field remain valid full-command-list sources when the new flags/fields are absent.

### Fallback When No Focused Commands Are Configured

If `focused-final-full` is selected but no focused commands are configured (by flag or state), `validate`/`revalidate` fall back to running the **full** command list for that occurrence. Validation is never silently skipped and no subset is silently guessed.

### Final Full Validation Failure Is Fix-Capable, Not a Hard Block

If `final-verification` fails, or passes but modifies the tracked working tree (e.g. a formatter, generated snapshot, or build artifact under version control changes), the prior Approved decision is not treated as final. The run routes back to `fix` (reusing the existing `fix -> revalidate -> re-review` loop) instead of hard-blocking immediately, up to a dedicated `fullValidationFixCycleCount` ceiling — capped by the same `--max-fix-cycles` value, but tracked **separately** from the Reviewer-requested `fixCycleCount`, so a defect the full suite found can never silently consume the Reviewer's own fix-cycle budget, or vice versa. Exceeding the ceiling hard-blocks with a distinct reason ("Maximum full-validation fix cycles reached"). A fresh focused validation pass and a fresh Reviewer Approved decision are always required before `final-verification` runs again.

Plain `validate`/`revalidate` failures (not reached via this recovery path) keep today's hard-block behavior unchanged.

### Exact-Head Integrity

Every validation and review record additively carries a `target: { commit, dirty, dirtyHash }` — the exact `HEAD` commit, whether the tree was dirty, and (only when dirty) a deterministic `sha256`-derived hash of the uncommitted diff. `humanGate.ready`/`validation.finalReadinessSatisfied` require **both** the latest `final-verification` target and the latest Approved review's target to be present *and* to match exactly; a genuine mismatch withholds readiness, and so does missing target evidence on either side (e.g. old runs that predate this feature) — exact-match evidence is a requirement this feature introduces, so absent evidence is never read as a free pass. Old run directories remain fully readable; they simply report `finalReadinessSatisfied: false`/`exactCommitMatch: "unknown"` rather than a confident `true`. This check is not only a run-summary concern: `orchestrate` itself consults the same `isFinalValidationSatisfied` function before advancing to `human-merge-decision`, so a resumed run supplying an Approved review record that predates target tracking is routed to `fix` instead — the orchestration-level decision and the run summary can never disagree about whether exact-match evidence is missing.

### `--force-full-validation`

Elevates the very next `validate`/`revalidate` occurrence in this invocation to the full command list (`triggerReason: "manual-request"`), regardless of strategy. It never skips a stage, never touches `fixCycleCount`, and never marks anything ready by itself.

### `--skip-validation` Interaction

Skipping applies to every validation occurrence (focused and full alike) in that invocation and marks `validationSkipped: true`; `humanGate.ready` requires `validation.status === "passed"`, and skipped validation is reported as `"skipped"`, never `"passed"` — a skipped run can never become merge-ready. A skipped `final-verification` also cannot reach `human-merge-decision` at the orchestration-decision level (it blocks instead, with a clear reason) — the top-level orchestration decision/CLI exit code and the run-summary's `humanGate.ready` can never disagree about whether skipping permits readiness.

### High-Risk Change Flag

`state.validationPolicy.requiresFullValidation: true` forces every `validate`/`revalidate` occurrence to run the full command list for that run, overriding `focused-final-full`'s normal focused mapping — an explicit escape hatch for changes to shared/high-risk infrastructure (build config, TypeScript config, command safety code, process spawning, state schema). No automatic changed-path inference is implemented; a heuristic that silently under-covers a risky change would provide false safety.

### Dry-Run

`orchestrate --dry-run` previews the resolved strategy, both command lists, and which phase would run next, without executing anything:

```text
Validation strategy: focused-final-full
Focused validation commands: node --test tools/agent-workflow/validationPolicy.test.ts
Final full validation commands: npm test; npx tsc --noEmit; npm run build; git diff --check
Next validation phase: focused (strategy=focused-final-full)
```

### Run Summary Integration

`validation` in `run-summary.json`/`.md` reports the strategy and a per-phase breakdown alongside the existing flat `commands[]` array (each entry gains an additive `phase` field):

```json
{
  "validation": {
    "strategy": "focused-final-full",
    "status": "passed",
    "focused": { "status": "passed", "attempts": 5 },
    "full": { "status": "passed", "attempts": 1 },
    "finalReadinessSatisfied": true
  }
}
```

The aggregate `validation.status` mirrors the **full** phase only — a focused-only pass is never reported as `"passed"`. `schemaVersion` remains `1`; every field above is additive to the Spec 054 model.

### Resume

Attempt counts, the configured strategy, and per-occurrence targets persist in `state.validationRuns`/`state.reviewRuns`/`state.validationPolicy` across invocations. Re-invoking `orchestrate` on a state file already at a terminal stage (`human-merge-decision` or `blocked`) never re-enters the stage loop at all (existing guard, unmodified), so a completed run's full-validation evidence is never redundantly re-executed just by invoking the command again.

### Backward Compatibility

A state file with no `validationPolicy` resolves to `strategy: "full-every-cycle"` with commands resolved exactly as before this feature existed. A `validationRuns`/`reviewRuns` record with no `phase`/`target` field is interpreted as `phase: "full"` with target evidence absent (never fabricated) — old run directories remain fully *readable*, but since this feature introduces exact-match target evidence as a new readiness requirement, a run lacking that evidence reports `finalReadinessSatisfied: false` rather than a confident `true`; it is not silently granted the new, stricter guarantee retroactively. `run-summary.json`'s `validation.strategy` reflects the actually-resolved strategy for the invocation (persisted via `orchestration.effectiveValidationStrategy` once validation runs), not just whatever happens to be configured in `state.validationPolicy` — so a CLI-only `--validation-strategy` override is never misreported as `full-every-cycle`.

## Agent Workflow Performance and Review Convergence

Spec 056 addresses two measured bottlenecks from the Spec 055 merge: `tools/agent-workflow`'s own test suite was the slowest thing in this repository (`orchestrateCommand.test.ts` alone accounted for ~99% of `npm test`'s wall time), and independent review took five rounds to converge for Spec 055 (seventeen for Spec 054) even though the underlying defects could plausibly have been found together in one comprehensive pass.

### Measured Baseline and Bottleneck

A corrected baseline (after discovering and excluding a stray, gitignored harness worktree that Vitest's default file discovery was silently double-counting — see `vitest.config.ts`) measured on `main` before this feature: `orchestrateCommand.test.ts` **417.73s / 81 tests / 1 file**; full `npm test` **406.47s / 654 tests / 42 files**. Source-level analysis found the dominant cost was not the well-known per-test `git init` sequence but **repeated real `collectGitContext()` calls** — up to ~13 real `git` subprocesses per call, invoked several times per end-to-end orchestration test.

### Test Dependency Seams

`collectGitContext` (in `reviewCommand.js`) already accepted an injectable `gitAdapter` (`{ run(args, cwd), verify(ref, cwd) }`); this feature threads that same option through every remaining call site in `orchestrateCommand.js` (~14 sites, including the `runOrchestration` stage loop), and adds `tools/agent-workflow/testDependencies.js`:

- `createFakeGitAdapter(config)` — implements every distinct `git` invocation pattern `collectGitContext` issues, deterministically, with no real subprocess. Supports `setState(...)` mid-test to simulate a tree mutation between two `collectGitContext` calls (e.g. after a fix cycle).
- `createFakeCommandRunner(sequence)` — the promoted, shared form of the test-local scripted process adapter already used throughout `orchestrateCommand.test.ts`, with deterministic success/failure/timeout/interruption and spawn/kill tracking.
- `createFakeClock(startIso)` — monotonically increasing ISO timestamps for deterministic snapshots.

None of these are reachable from `cli.js` or any production entry point — they are wired in only via the `gitAdapter`/`processAdapter` options `orchestrateCommand.js`/`reviewCommand.js` already accept for dependency injection.

### Fake vs. Real Coverage Split

Tests whose assertions do not depend on real diff/status content (role selection and swapping, question-loop progression, structured-review-outcome parsing, run-summary shape, budget arithmetic, the new Part B/C/D modules) use `createFakeGitAdapter()` with a plain `mkdtempSync` directory — no `git init` at all. The following remain on a **real** Git repository and the real process adapter, because their assertions genuinely depend on it:

- Unsafe-command rejection before spawn
- Exact Git target/`dirtyHash` computation
- Fix-cycle / final-validation tree-diff detection (anything asserting on `getDiffSignature`/`getAnswerStageEditSignature` actually changing after a real filesystem mutation)
- Real timeout SIGTERM→SIGKILL cleanup
- Interruption cleanup
- State persistence and resume
- BOM-tolerant state loading
- Dry-run no-write guarantees
- Real command exit-status handling (e.g. a real `npm --version` invocation)
- Human-gate enforcement

### Shared Fixture Strategy

Tests that still need a real repository no longer each run `git init`/`symbolic-ref`/`config` ×2/`add`/`commit` (6 subprocesses). Instead, one base fixture (one commit, one tracked file) is created lazily, once per test-process run, and cached; every test that needs a real repository gets an `fs.cpSync` recursive copy of it into its own fresh `mkdtemp` directory. Per-test isolation is identical to before — each test mutates only its own copy — but the repeated `git init` subprocess cost is paid once per file, not once per test. Tests remain single-file-sequential (no `test.concurrent` introduced); the base fixture is read-only after creation, so concurrent copies of it are safe by construction.

### Performance Results

| | Before (corrected baseline) | After | Change |
|---|---|---|---|
| `orchestrateCommand.test.ts` | 417.73s / 81 tests | 155.03s / 88 tests | **-62.9%** (target <120s not fully reached) |
| `npm test` (full suite) | 406.47s / 654 tests / 42 files | ~162s / 758 tests / 47 files | **~-60%** (target <180s met) |

No test was removed to reach these numbers; the standalone file gained 7 net-new smoke tests and the full suite gained 5 new module test files, all counted above. The remaining gap on the standalone file is the retained real-Git integration subset itself: those tests still pay for several real `collectGitContext` calls as the orchestration loop progresses through multiple stages, which is inherent to proving real diff-detection behavior — not incidental setup cost that can be optimized away without weakening that coverage. Closing it further would mean reducing `collectGitContext`'s own internal `git`-plumbing call count (e.g. consolidating `rev-parse`/`status` invocations), a wider-blast-radius production change (affecting every consumer of `gitContext`, including Reviewer-facing prompt content) explicitly deferred by this feature — see `specs/056-agent-workflow-performance-convergence/clarifications.md` Q6/Q28.

```powershell
npx vitest run tools/agent-workflow/orchestrateCommand.test.ts --reporter=verbose
```

Vitest's own `--reporter=verbose` per-test timing is the supported way to find slow tests going forward; no new dependency or production-code instrumentation was added for this.

### Comprehensive First-Pass Review

The independent-review prompt (`templates/independent-review.md`, `templates/orchestrate-final-review.md`) now explicitly instructs the Reviewer to continue past the first valid finding, search for related occurrences of the same defect pattern, and return every material blocking finding found in that single pass — while still permitting a genuine zero-finding `Approved` decision. A concise workflow checklist (correctness, state transitions, resume behavior, target provenance, validation readiness, structured review parsing, finding lifecycle, timeout/interruption handling, unsafe-command rejection, dry-run no-write behavior, backward compatibility, run-summary accuracy, the human remote-mutation boundary, tests for failure paths) is included rather than re-embedding full historical spec text.

### Changed-File Inventory

Before every review, `reviewCoverage.js#buildChangedFileInventory` computes a deterministic `{ path, status, additions, deletions, highRisk }[]` from the `git diff --stat`/`--numstat`/`status --porcelain` data `collectGitContext` already gathers. Line counts are exact, from `git diff --numstat`, which unlike `--stat`'s human-readable bar graph never truncates a long path or scales its counts for a large diff; a `gitContext` that only supplies `--stat` data (every pre-Spec-056-round-2 test fixture) falls back to the approximate bar-derived counts unchanged. A file is classified high-risk when it is one of this workflow's own state-machine/safety modules under `tools/agent-workflow/`, or its net line-change meets a configurable threshold (default 40). This inventory is included in both review prompts and is the deterministic basis the workflow cross-checks a Reviewer's self-reported coverage counts against.

### Review Completeness

`reviewCoverage.js#computeReviewCompleteness` computes `complete` / `incomplete` / `invalid` independent of the Markdown/structured `decision`:

- `invalid` — the Reviewer process timed out, failed to execute, or was interrupted, or returned a malformed/unsupported structured review.
- `incomplete` — the Reviewer engaged with the `reviewCoverage` schema and reported an *explicit* negative signal: `stoppedEarly: true`, `checklistCompleted: false`, or inspected counts that fall short of the deterministic inventory's totals (capped, never trusted beyond the deterministic total).
- `complete` — everything else, **including** a legacy plain-Markdown review with no structured JSON at all, and a structured review that never adopted the `reviewCoverage` extension.

This last point matters: an early implementation attempt treated *absence* of `reviewCoverage` itself as `incomplete`, which broke 44 of the 81 pre-existing `orchestrateCommand.test.ts` tests (none of which could report a field this feature had not yet introduced) — see `clarifications.md` Q7. Absence of new evidence is not evidence of an incomplete review; only an explicit negative signal gates completeness. An `incomplete` review is never treated as `Approved` regardless of its decision heading, and retries the same review stage (preserving any findings already recorded) up to `reviewBudget.maxIncompleteReviewRetries`.

### Consolidated Fix Cycles and the Finding Ledger

When a review returns multiple blocking findings, the Implementer prompt for the following fix cycle already includes the complete unresolved blocking set (Spec 052's existing finding-lifecycle machinery, `findingLifecycle.js`); this feature adds `reviewConvergence.js` as a read layer on top of that history, without duplicating finding-ID assignment or resume persistence:

- `classifyFindingsForAttempt` labels every reported blocking finding as `new` (never seen before), `previously-known` (an already-open carryover), or `reopened` (a fresh ID that content-matches — by file/location or summary — a previously *resolved* entry; Spec 052 deliberately rejects literal ID reuse for a resolved finding, so a genuine reopening necessarily arrives under a new ID).
- `updateConvergenceMetrics` accumulates `firstReviewBlockingFindings` (captured once, from round 1), `newBlockingFindingsAfterFirstReview` (the central convergence metric — new + reopened findings discovered in any later round), `reopenedFindings`, and `resolvedFindingsVerified`.
- `buildFindingLedger` merges `findingHistory` with tracked reopened counts into the `{ id, severity, blocking, summary, location, firstDetectedReviewAttempt, status, resolutionTarget, resolutionNote, reopenedCount }` shape.

### Review Budgets

```json
{
  "reviewBudget": {
    "maxReviewAttempts": 3,
    "maxAutomaticFixCycles": 2,
    "maxIncompleteReviewRetries": 1,
    "maxReviewerQuestionCycles": 1
  }
}
```

`--max-fix-cycles` keeps its original meaning (maximum automatic Implementer fix cycles). `reviewBudget.maxAutomaticFixCycles` mirrors it by default so the two never silently diverge; an explicit `state.reviewBudget.maxAutomaticFixCycles` or `--max-automatic-fix-cycles` CLI override takes precedence over the mirrored default. `reviewBudget.maxReviewAttempts` (total independent Reviewer attempts) and `reviewBudget.maxIncompleteReviewRetries` are purely additive — no pre-Spec-056 equivalent existed. `reviewBudget.maxReviewerQuestionCycles` mirrors the existing `state.maxQuestionCycles` ceiling.

```powershell
node tools/agent-workflow/cli.js orchestrate `
  --state .agent-workflow/spec-056-state.json `
  --implementer claude `
  --max-fix-cycles 2 `
  --max-review-attempts 3 `
  --max-incomplete-review-retries 1 `
  --max-reviewer-question-cycles 1
```

Exhausting any ceiling stops the run with `stopReason: "review-convergence-failed"` — never `humanGate.ready: true`, never a silently-raised limit, never a discarded finding. The new checks are ordered strictly **after** every pre-existing budget check in the orchestration loop, so a default-configuration run's stop reason and message are byte-for-byte unchanged from before this feature; the new ceilings only ever fire for a genuinely new scenario (an explicit `reviewBudget` override stricter than `--max-fix-cycles`, or `maxReviewAttempts`/`maxIncompleteReviewRetries` themselves, which had no prior equivalent).

### P3 / Non-Blocking Findings

P0/P1/P2 findings are blocking by default; P3 is non-blocking by default and never by itself starts another fix/re-review cycle (this was already true before this feature — `blockingFindings`/`nonBlockingFindings` are separate arrays the Reviewer itself populates). Any finding in a high-risk category (false readiness, remote mutation, unsafe command execution, credential exposure, state/resume corruption, incorrect exact-head provenance, validation bypass, review-parser approval bugs, data loss, human-gate weakening) remains blocking regardless of its reported severity — `reviewConvergence.js#isEffectivelyBlocking` overrides a P3 label for these categories when computing convergence telemetry.

### Resume

`orchestration.reviewAttempts`, `orchestration.reviewConvergenceMetrics`, `orchestration.reviewConvergenceReopenedCounts`, and `orchestration.incompleteReviewRetries` persist across invocations exactly like every other orchestration counter; resuming a paused run continues accumulating them rather than resetting or recomputing history. A human raising a `reviewBudget` ceiling and resuming continues from the persisted ledger and attempt counts — the workflow itself never raises its own budget.

### Dry-Run

`orchestrate --dry-run` additionally previews the resolved `reviewBudget`, current budget usage (`reviewAttempts`, `automaticFixCycles`, `incompleteReviewRetries`), the deterministic changed-file inventory, the open blocking-finding count, and the next review action — with the same zero-spawn/zero-validation/zero-state-write/zero-artifact-write guarantee as every other dry-run in this workflow.

### Run Summary Integration

```json
{
  "performance": {
    "reviewDurationMs": 1320000,
    "focusedValidationDurationMs": 42000,
    "fullValidationDurationMs": 118000,
    "reviewAttempts": 2
  },
  "reviewConvergence": {
    "firstReviewBlockingFindings": 4,
    "newBlockingFindingsAfterFirstReview": 0,
    "reopenedFindings": 0,
    "resolvedFindingsVerified": 4,
    "automaticFixCycles": 1,
    "status": "converged"
  }
}
```

`run-summary.md` renders matching "Review Convergence" and "Performance" sections. `schemaVersion` stays `1` — both objects are additive, mirroring Spec 055's precedent. An old run-summary/state predating this feature has no `reviewConvergenceMetrics` at all and reports `reviewConvergence.status: "not-started"` rather than a fabricated value.

### Human Gate

`humanGate.ready` now additionally requires `review.completenessStatus === "complete"` — a complete Approved review with zero open blocking findings, alongside the existing full-validation-passed and exact-target-match requirements from Spec 055. `reviewConvergence.status` only reports `"converged"` when `humanGate.ready` is itself `true`; every other case (`in-progress`, `budget-exhausted`, `incomplete-review`, `blocked`, `not-started`) is computed by the same shared `reviewConvergence.js#computeConvergenceStatus` function the orchestration loop's own stop decision uses, so the two can never disagree (mirroring Spec 055's `isFinalValidationSatisfied` "single shared computation" precedent).

### Deferred Scope

Incremental (diff-only) review, provider-specific token counting, distributed test execution, remote CI orchestration, automatic test selection from changed files, automatic (self-)modification of review budgets, any remote PR/merge operation, and consolidating `collectGitContext`'s internal `git`-plumbing calls are explicitly out of scope for this feature — see `specs/056-agent-workflow-performance-convergence/clarifications.md` Q28.
