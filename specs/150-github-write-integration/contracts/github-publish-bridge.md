# Contract: GitHub Write Integration API

Server-only Next.js API routes, Node.js runtime. Same trust boundary as `specs/149-real-execution-server-bridge/contracts/real-execution-bridge.md` (loopback-only, same-origin — reuses `isTrustedRuntimeBridgeRequest` from `RuntimeBridgeOrigin.ts`).

## `GET /api/github-publish/status`

**Response 200**:
```json
{ "authorized": true }
```

## `GET /api/github-publish/preview?workingDirectory=...`

**Response 200**:
```json
{
  "changedFiles": ["src/foo.ts", "README.md"],
  "plannedCommitMessage": "AIverse maintenance update: 2 files changed",
  "hasAnythingToPublish": true
}
```

## `POST /api/github-publish/publish`

**Request body**:
```json
{ "workingDirectory": "C:/path/to/registered/project" }
```

`workingDirectory` MUST be independently re-checked server-side (exists, is readable, is a real git repository with a configured `origin` remote) before anything runs — the same existing-path-safety checks Spec 149's `isWorkingDirectoryUsable` already applies, reused here.

**Response 200** (always 200; the real outcome is in `status`, mirroring Spec 149's own convention):
```json
{
  "attemptId": "string",
  "status": "published" | "refused" | "failed",
  "refusalReason": "nothing_to_publish" | "no_remote" | "not_authorized" | "already_running" | null,
  "branchName": "string | null",
  "commitMessage": "string | null",
  "pullRequestUrl": "string | null",
  "evidence": { "stdoutSummary": "string", "stderrSummary": "string", "failureStep": "branch" | "commit" | "push" | "pull_request" | null }
}
```

This call is synchronous from the caller's point of view: it resolves once the attempt reaches a terminal status.

## Safety invariants (apply to every route above)

- No route in this contract ever runs `gh pr merge`, `gh pr ready`, `git push --force`, or any branch-deletion command, regardless of outcome (FR-003) — enforced by construction (the server never accepts a client-supplied command) and, as defense in depth, by reusing the existing `isSafeCommandLine` denylist.
- `POST /api/github-publish/publish` refuses (never pushes) when: GitHub write access is not authorized; the project has no configured remote; another attempt is already active for the same project; or there is nothing to publish.
- Every terminal outcome is written to a durable audit file (see data-model.md `PublishAuditRecord`) before the response is returned.
