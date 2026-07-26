# Data Model: Review Run Summary and Audit Trail

## Schema Version

`schemaVersion: 1` (integer). Any future incompatible change to the normalized model increments this; the renderer and CLI command must key off it rather than assume the latest shape.

## Run Status (`run.status`)

| Value | Meaning | Precondition |
|---|---|---|
| `planned` | No orchestration has started yet (`orchestration.startedAt` absent). | Used only when `summary`/`buildRunSummary` is pointed at a state file with no run history at all. |
| `running` | Reserved for a future concurrent-inspection use case; not reachable from a single synchronous `runOrchestration` invocation today (the function only returns once the loop has stopped). | Documented for completeness/schema stability; current builder never emits it. |
| `blocked` | `orchestration.currentStage === "blocked"`. | `orchestration.terminalState === "blocked"`. |
| `failed` | A validation command failed. | `stopReason === "validation-failed"`. |
| `interrupted` | The last relevant execution record has `interrupted: true` or a non-null `signal` that is not a timeout. | Derived from the record that caused `markBlocked`. |
| `timed-out` | The last relevant execution record has `timedOut: true`. | Derived from the record that caused `markBlocked`. |
| `completed` | Reserved for a future non-human-gated terminal state; not reachable today (every successful path ends at the human merge gate). | Documented for schema stability. |
| `awaiting-human-decision` | `orchestration.currentStage === "human-merge-decision"`. | `orchestration.terminalState === "human-merge-decision"`. |

`failed`/`interrupted`/`timed-out` are all specializations of `blocked` chosen when the blocking reason's root cause is unambiguous from persisted state; when it is not (e.g. a generic "execution failed" reason with no further structured detail), `blocked` alone is used rather than guessing.

## Stop Reason (`run.stopReason`)

Populated only when `run.status !== "awaiting-human-decision"`. One of: `validation-failed`, `changes-requested-limit-reached`, `reviewer-questions-unresolved`, `structured-review-invalid`, `review-decision-unknown`, `timeout`, `interrupted`, `unsafe-runner`, `role-resolution-failed`, `command-failed`, `state-invalid`, `manual-stop`. Mapped deterministically from `orchestration.reason` (a fixed set of exact strings already produced by `markBlocked(...)` call sites) plus `latestReviewDecision`/`latestStructuredReviewStatus`; never inferred from unstructured log text when a structured reason already exists. `null` when the run reached `human-merge-decision`.

## Roles (`roles`)

```json
{
  "implementer": { "agentId": "claude", "displayName": "Claude Code CLI" },
  "reviewer": { "agentId": "codex", "displayName": "OpenAI Codex CLI" },
  "source": "cli-override"
}
```

Sourced from `orchestration.resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource` (pinned per Spec 053) when present; falls back to `latestResolvedRoles`/`latestRoleResolutionSource`, then to `orchestration.implementerId`/`reviewerId`/`*Identity` display fields, then to `"unknown"`/`null` source if no role information exists at all (never fabricated).

## Execution (`execution`)

```json
{
  "stagesAttempted": ["implement", "validate", "review"],
  "stagesCompleted": ["implement", "validate"],
  "currentStage": "review",
  "stopReason": null
}
```

`stagesAttempted`/`stagesCompleted` are derived, in persisted array order, from `state.orchestrationRuns` (implement/fix/answer-questions), `state.reviewRuns` (review/re-review/final-review, using the new `stage` field with `"unknown"` fallback), and `state.validationRuns` (validate/revalidate/final-verification) — never from the per-invocation ephemeral `steps` list, so resumed runs neither lose nor duplicate history.

## Stage Timeline (`stageTimeline[]`)

```json
{
  "stage": "review",
  "role": "reviewer",
  "agentId": "codex",
  "status": "completed",
  "attempt": 1,
  "artifactPaths": ["review-independent-review-result.md"],
  "result": "Changes Requested"
}
```

One entry per durable record across `orchestrationRuns`/`reviewRuns`/`validationRuns`, in the chronological order those arrays already preserve. `attempt` is the 1-based occurrence count of that exact stage name within the run so far. Stages that never occurred in this run are simply absent from the array (never fabricated as `"not applicable"` placeholders, to keep the array itself the source of truth for "did this happen").

## Validation Summary (`validation`)

```json
{
  "status": "passed",
  "commands": [
    { "command": "npm test", "status": "passed", "exitCode": 0, "durationMs": 42000, "artifactPath": "..." }
  ]
}
```

`status` values: `passed`, `failed`, `timed-out`, `interrupted`, `skipped`, `not-run`. `skipped` means validation was explicitly bypassed via `--skip-validation` (recorded from the run options, not inferred); `not-run` means validation was expected (not skipped) but the run stopped before any validation command executed (e.g. blocked earlier). Overall `status` is `passed` only if every attempted command's status is `passed` and none were skipped-when-required or not-run-when-expected.

## Review Summary (`review`)

```json
{
  "finalDecision": "Approved",
  "structuredReviewStatus": "valid",
  "reviewerAgentId": "codex",
  "reviewAttempts": 2,
  "questionCycles": 1,
  "fixCycles": 1,
  "blockingFindingCount": 0,
  "nonBlockingFindingCount": 0,
  "exactReviewedCommitMatch": true
}
```

`finalDecision` is the outcome of the *last* entry in `state.reviewRuns` (`Approved`/`Changes Requested`/`Unknown`, the existing three-way convention — never a fourth invented value, and never `Unknown` reported as `Approved`). `reviewAttempts` is `state.reviewRuns.length`. `questionCycles`/`fixCycles` come directly from `state.questionCycle`/`state.fixCycleCount`.

## Findings (`findings`)

```json
{
  "opened": 1,
  "resolved": 1,
  "carriedForward": 0,
  "remainingBlocking": 0,
  "remainingNonBlocking": 0,
  "items": [
    { "findingId": "F1", "severity": "P1", "summary": "...", "status": "resolved", "kind": "blocking", "openedReviewAttempt": 1, "resolvedReviewAttempt": 2, "artifactPaths": ["..."] }
  ]
}
```

Directly derived from `state.findingHistory` (Spec 052): `opened = findingHistory.length`; `resolved` = count with `currentStatus === "resolved"`; `carriedForward` = count with `currentStatus === "still_open"`; `remainingBlocking`/`remainingNonBlocking` = open (`new`/`still_open`) counts split by `kind`. `remainingBlocking` matches the already-persisted `orchestration.activeBlockingFindings.length` exactly (cross-checked, not recomputed independently, to avoid the two ever disagreeing).

## Commit Provenance (`commits`)

```json
{
  "implementationCommit": null,
  "reviewedCommit": null,
  "currentBranchHead": "abc123...",
  "exactCommitMatch": "unknown"
}
```

This workflow's review prompts are built from the working tree/branch diff at review time (`collectGitContext`), not from a persisted implementation commit SHA recorded in state; the summary reports `implementationCommit`/`reviewedCommit`/`exactCommitMatch` as `null`/`"unknown"` rather than fabricating a match, unless/until a future feature persists explicit commit SHAs into state. This is a deliberate, documented "unknown, not false success" choice (spec.md FR-013). `currentBranchHead` is populated only when `buildRunSummary` is called by a real `orchestrate` run, which passes it in from git context that run already collected for its own purposes (`options.currentBranchHead`); the read-only `summary` CLI command never spawns a process (including git) under any invocation, so it always reports `currentBranchHead: null` rather than add a new subprocess call solely for this field.

## Human Gate (`humanGate`)

```json
{
  "required": true,
  "action": "merge-decision",
  "ready": true,
  "state": "ready-for-merge-decision"
}
```

`state` values: `not-ready`, `ready-for-commit`, `ready-for-push-decision`, `ready-for-pr-decision`, `ready-for-merge-decision`, `completed-without-remote-action`. This workflow only ever reaches `not-ready` or `ready-for-merge-decision` today (it has no persisted evidence of a commit/push/PR having happened from inside `orchestrate`); the other enum values exist for schema stability and future extension, not because this feature fabricates evidence for them.

## Artifacts (`artifacts[]`)

Relative paths (from the run directory) to the significant detailed artifacts referenced by the stage timeline / review / finding sections, deduplicated and sorted by (stage attempt order, then path) for determinism — never by filesystem enumeration order.

## Warnings (`warnings[]`)

Free-text but structurally consistent (`{ code, message }`) entries for: missing optional artifact, malformed optional artifact, summary-write failure (reported here when `summary` command itself hits an I/O error reading a *referenced* artifact for existence-checking, not for the state file itself, which already went through `readState`).

## Backward Compatibility

- Every field derivation tolerates absence: no `orchestration` object → `run.status: "planned"`; no `reviewRuns` → empty review/finding sections with explicit `"unknown"`/`0` values, never fabricated activity.
- Reading an old state file for `buildRunSummary`/`summary` never calls `writeState`; read-only inspection cannot mutate old state or old run directories.
- Legacy two-agent (`codex`/`claude`) and pre-Spec-053 single-agent state files remain summarizable; role source falls back through the chain described above down to `"unknown"` rather than assuming any specific vendor.
