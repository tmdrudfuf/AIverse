# Data Model: Real Execution Server Bridge

## RealExecutionEnablementState

Not a stored record — a live-derived fact, read fresh on every request. The Implementer (Claude) and Reviewer (Codex) gates are independent by existing design (`AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` / `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN`); enabling one must never enable the other.

| Field | Type | Source |
|---|---|---|
| `implementerEnabled` | boolean | `process.env.AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN === "1"`, read server-side only |
| `reviewerEnabled` | boolean | `process.env.AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN === "1"`, read server-side only |

## RealRun

Held in an in-memory registry (`RuntimeBridgeRunRegistry`) keyed by the run's own normalized `workingDirectory` — there is no server-side project-id concept (Spec 137's project registry has no server-side counterpart); the resolved local path a registered project is bound to already uniquely and stably identifies it, so it doubles as the concurrency key, with no separate `projectId` needed at this boundary. Held for the lifetime of one in-flight run; terminal runs are written to a `RunAuditRecord` file and then may be dropped from memory.

| Field | Type | Notes |
|---|---|---|
| `runId` | string | Generated when the run starts; opaque to the caller. |
| `role` | `"implementer" \| "reviewer"` | Which runtime role this run is for. |
| `status` | `"running" \| "completed" \| "failed" \| "timed_out" \| "cancelled" \| "refused"` | `refused` covers FR-002 (not enabled) and FR-011 (project path mismatch/missing) — the run never spawned a process. |
| `startedAt` | ISO timestamp | Set when the process is spawned (or immediately, for `refused`). |
| `completedAt` | ISO timestamp \| null | Set when the run reaches a terminal status. |
| `evidence` | object | `{ exitCode, signal, stdoutSummary, stderrSummary, terminationReason, timedOut, cancelled }` — shape reuses the existing `ImplementerRuntimeEvidence`/reviewer-equivalent fields already defined in `ImplementerRuntimeTypes.ts` so the browser-side mapping is a direct pass-through, not a translation. |

### State transitions

```text
(request received)
  ├─ enablement disabled ─────────────────────────────▶ refused
  ├─ working directory missing/unsafe (FR-011) ─────────▶ refused
  ├─ another run already active for this working directory ──▶ refused
  └─ safety validation fails ───────────────────────────▶ refused
  (otherwise) ──▶ running
                   ├─ process exits 0, no timeout/cancel ▶ completed
                   ├─ process exits non-zero ─────────────▶ failed
                   ├─ timeout elapsed ──────────────────────▶ timed_out
                   └─ operator-requested cancel ────────────▶ cancelled
```

`running` is the only non-terminal status. Every other status is terminal and, once reached, is immediately written as a `RunAuditRecord`.

## RunAuditRecord

One flat JSON file per terminal run, at `.agent-workflow/real-runs/<runId>.json` (directory created on first write; mirrors the existing `.agent-workflow/runs/<featureId>/` convention already used elsewhere in this repository, minus the project subfolder since there is no server-side project id to name it with — `workingDirectory` inside the record identifies the project instead).

| Field | Type | Notes |
|---|---|---|
| `runId`, `role`, `status`, `startedAt`, `completedAt`, `evidence` | — | Same as `RealRun` above, at its terminal state. |
| `command` | string | The resolved command line that was (or would have been) run, for operator inspection. |
| `workingDirectory` | string | The registered project's local path this run executed against; identifies which project this record belongs to. |

## Relationship to existing entities

- `workingDirectory` is the same local path already established by the project registry (Spec 59/123/137) for the project this run targets — this feature does not introduce a new project concept, only a new kind of run against an already-registered one, and does not introduce a server-side project id.
- `RealRun.evidence` is shaped to match the existing `ImplementerRuntimeEvidence` (and the reviewer runtime's equivalent) types already consumed by `OfficeProjectPortalController`/`View`, so the UI-facing rendering code for run status does not need new branches — it already knows how to render these fields for the existing (currently always-`Blocked`) providers.
