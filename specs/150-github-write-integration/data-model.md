# Data Model: GitHub Write Integration

## GitHubWriteAuthorization

Not a stored record — a live-derived fact, read fresh on every request.

| Field | Type | Source |
|---|---|---|
| `authorized` | boolean | `gh auth status` exits 0 and reports the `repo` scope, checked server-side only |

## PublishAttempt

Held in an in-memory registry (`GitHubPublishRegistry`) keyed by the project's normalized working directory, for the lifetime of one in-flight attempt.

| Field | Type | Notes |
|---|---|---|
| `attemptId` | string | Generated when the attempt starts. |
| `workingDirectory` | string | The registered project's real local path. |
| `status` | `"running" \| "published" \| "refused" \| "failed"` | `refused` covers FR-006's named reasons; the attempt never pushed anything. |
| `refusalReason` | `"nothing_to_publish" \| "no_remote" \| "not_authorized" \| null` | Only set when `status` is `refused`. |
| `branchName` | string \| null | Set once the branch is created (even if a later step fails, so a partial attempt is reported honestly per User Story 3 scenario 3). |
| `commitMessage` | string \| null | The generated message actually used, once committed. |
| `pullRequestUrl` | string \| null | Set only once `gh pr create` genuinely succeeds. |
| `startedAt` / `completedAt` | ISO timestamp | |
| `evidence` | object | `{ stdoutSummary, stderrSummary, failureStep }` — `failureStep` names which step (`branch`/`commit`/`push`/`pull_request`) failed, when `status` is `failed`. |

### State transitions

```text
(request received)
  ├─ not authorized (FR-004) ───────────────────────────▶ refused: not_authorized
  ├─ no configured remote ──────────────────────────────▶ refused: no_remote
  ├─ another attempt already active for this project ───▶ refused: already_running (reuses Spec 149's existing concept at this boundary)
  └─ (otherwise) ──▶ running
                       ├─ branch created, nothing to commit and nothing ahead ─▶ refused: nothing_to_publish
                       ├─ any step (branch/commit/push/pull_request) throws ──▶ failed (evidence.failureStep names it; branchName/commitMessage reflect whatever completed before the failure)
                       └─ pull request opened successfully ──────────────────▶ published
```

## PublishAuditRecord

One flat JSON file per terminal attempt, at `.agent-workflow/github-publishes/<attemptId>.json`, mirroring `.agent-workflow/real-runs/<runId>.json`.

| Field | Type |
|---|---|
| `attemptId`, `workingDirectory`, `status`, `refusalReason`, `branchName`, `commitMessage`, `pullRequestUrl`, `startedAt`, `completedAt`, `evidence` | Same as `PublishAttempt` above, at its terminal state. |

## PublishPreview

Not stored — computed fresh on each `GET /api/github-publish/preview` request (User Story 2).

| Field | Type | Notes |
|---|---|---|
| `changedFiles` | string[] | From `git status --porcelain` in the project's working directory. |
| `plannedCommitMessage` | string | The same generator `GitHubPublishSequence` would use if triggered now. |
| `hasAnythingToPublish` | boolean | `false` when there are no uncommitted changes and the current branch has nothing ahead of the default branch. |

## Relationship to existing entities

- `workingDirectory` is the same project-path concept Spec 149 already established (no server-side project-id, per that spec's own data-model.md) — this feature reuses it as its own concurrency key and audit identifier the same way.
- This feature does not read or depend on Spec 149's `RunAuditRecord` at all; the two stay decoupled per research.md Decision 4 — a publish attempt looks only at the project's current git state, not at which prior real run produced it.
