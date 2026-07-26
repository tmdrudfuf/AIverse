# Contract: Run Summary Schema (`schemaVersion: 1`)

This is the normalized shape produced by `buildRunSummary(state, options)` in `tools/agent-workflow/runSummary.js`, serialized verbatim as `run-summary.json` and rendered (without adding new facts) as `run-summary.md` by `runSummaryRenderer.js`. See `../data-model.md` for the field-by-field derivation rules; this contract is the shape itself.

```json
{
  "schemaVersion": 1,
  "run": {
    "runId": "run-2026-07-26T00:00:00.000Z",
    "featureId": "054-review-run-summary-audit-trail",
    "status": "awaiting-human-decision",
    "stopReason": null,
    "startedAt": "2026-07-26T00:00:00.000Z",
    "completedAt": "2026-07-26T00:05:00.000Z",
    "durationMs": 300000
  },
  "roles": {
    "implementer": { "agentId": "claude", "displayName": "Claude Code CLI" },
    "reviewer": { "agentId": "codex", "displayName": "OpenAI Codex CLI" },
    "source": "cli-override"
  },
  "execution": {
    "stagesAttempted": ["implement", "validate", "review", "final-verification"],
    "stagesCompleted": ["implement", "validate", "review", "final-verification"],
    "currentStage": "human-merge-decision"
  },
  "stageTimeline": [
    { "stage": "implement", "role": "implementer", "agentId": "claude", "status": "completed", "attempt": 1, "artifactPaths": ["..."], "result": null },
    { "stage": "validate", "role": null, "agentId": null, "status": "passed", "attempt": 1, "artifactPaths": ["..."], "result": null },
    { "stage": "review", "role": "reviewer", "agentId": "codex", "status": "completed", "attempt": 1, "artifactPaths": ["..."], "result": "Approved" },
    { "stage": "final-verification", "role": null, "agentId": null, "status": "passed", "attempt": 1, "artifactPaths": ["..."], "result": null }
  ],
  "validation": {
    "status": "passed",
    "commands": [
      { "command": "npm test", "status": "passed", "exitCode": 0, "durationMs": 42000, "artifactPath": "..." }
    ]
  },
  "review": {
    "finalDecision": "Approved",
    "structuredReviewStatus": "valid",
    "reviewerAgentId": "codex",
    "reviewAttempts": 1,
    "questionCycles": 0,
    "fixCycles": 0,
    "blockingFindingCount": 0,
    "nonBlockingFindingCount": 0,
    "exactReviewedCommitMatch": "unknown"
  },
  "findings": {
    "opened": 0,
    "resolved": 0,
    "carriedForward": 0,
    "remainingBlocking": 0,
    "remainingNonBlocking": 0,
    "items": []
  },
  "commits": {
    "implementationCommit": null,
    "reviewedCommit": null,
    "currentBranchHead": null,
    "exactCommitMatch": "unknown"
  },
  "humanGate": {
    "required": true,
    "action": "merge-decision",
    "ready": true,
    "state": "ready-for-merge-decision"
  },
  "artifacts": ["implement-claude-result.md", "review-independent-review-result.md"],
  "warnings": []
}
```

## Invariants (enforced by tests, not merely documented)

1. `humanGate.ready === true` implies `review.finalDecision === "Approved"`, `validation.status === "passed"`, and `findings.remainingBlocking === 0`. The converse is not required (all three can hold with `ready: false` if, e.g., the run is not yet at the human gate).
2. `run.status === "awaiting-human-decision"` implies `humanGate.state === "ready-for-merge-decision"` or `humanGate.ready === false` with an explanatory warning — never a status implying a remote action (push/PR/merge) occurred.
3. `review.finalDecision` is never `"Approved"` when `review.structuredReviewStatus !== "valid"`.
4. `run.stopReason` is `null` if and only if `run.status === "awaiting-human-decision"`.
5. Every path in `artifacts[]` and every `stageTimeline[].artifactPaths` entry is relative to the run directory (never absolute, never containing `..`).
6. `run-summary.json` and `run-summary.md` never disagree on `run.status`, `review.finalDecision`, `humanGate.ready`, or the finding aggregate counts, for the same input state.
7. Re-running `buildRunSummary` on unchanged state produces byte-identical JSON except for fields that are not timestamp/duration fields — i.e., ordering and content are stable.
