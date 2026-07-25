# Data Model: Runtime Role Selection

## Role Roster

- `state.roleRoster?: string[]` — optional array of agent IDs eligible for automatic Reviewer derivation.
- Default when absent: `["codex", "claude"]`.
- Deduplicated; order does not affect resolution outcome (resolution is a set-difference against the requested Implementer, not an ordinal pick).

## Effective Roles (resolver output)

```js
{
  ok: true,
  roles: { implementer: "claude", reviewer: "codex" },
  source: "cli-override", // "cli-override" | "state" | "default" | "resume"
  diagnostics: [],
}
```

Failure shape:

```js
{
  ok: false,
  roles: null,
  source: "cli-override", // or "resume-conflict"
  diagnostics: [
    "Requested implementer 'unknown-agent' is not configured.",
    "Available eligible agents: codex, claude.",
  ],
}
```

## Display Roles (for CLI output and state persistence)

```json
{
  "implementer": { "agentId": "claude", "displayName": "Claude Code CLI" },
  "reviewer": { "agentId": "codex", "displayName": "OpenAI Codex CLI" },
  "source": "cli-override"
}
```

`displayName` is the existing `identity` string from the resolved agent runner config (`resolveAgentConfig(state, agentId).identity`); no new identity strings are introduced.

## State Fields (additive only)

Top-level, updated on every `orchestrate` invocation that (re)resolves roles for the current run:

- `state.latestResolvedRoles: { implementer: string, reviewer: string }`
- `state.latestRoleResolutionSource: "cli-override" | "state" | "default" | "resume"`

Under `state.orchestration` (the existing per-run bookkeeping object), set once when a run starts and preserved for the run's lifetime:

- `state.orchestration.resolvedImplementerId: string`
- `state.orchestration.resolvedReviewerId: string`
- `state.orchestration.roleResolutionSource: "cli-override" | "state" | "default"`

These mirror the existing `state.orchestration.implementerId`/`reviewerId`/`implementerIdentity`/`reviewerIdentity` fields, which continue to be set every call (unchanged) for display purposes; `resolvedImplementerId`/`resolvedReviewerId` are the new *pinned* values consulted on resume.

## Run Identity Boundary

A run is considered **in progress** (resumable, pinned) when `state.orchestration.startedAt` and `state.orchestration.resolvedImplementerId`/`resolvedReviewerId` are already present and `state.orchestration.currentStage` is not a terminal stage (`human-merge-decision`, `blocked`).

A run is considered **new** (free to re-resolve roles) when any of the above is absent — including a fresh state file, or a state file whose `orchestration` object was intentionally reset for a new attempt.

## Backward Compatibility

- Old state files with no `roleRoster`, `latestResolvedRoles`, `latestRoleResolutionSource`, `orchestration.resolvedImplementerId`, `orchestration.resolvedReviewerId`, or `orchestration.roleResolutionSource` remain fully readable; all of these fields are optional and default safely (roster defaults to `["codex","claude"]`; pinning is simply not engaged, so role resolution behaves exactly as before `--implementer` existed).
- BOM-tolerant state loading (`readState`) is unchanged and continues to strip a leading UTF-8 BOM before `JSON.parse`.
