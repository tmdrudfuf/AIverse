# Data Model: Real Execution Server Bridge

## RealExecutionEnablementState

Not a stored record — a live-derived fact, read fresh on every request.

| Field | Type | Source |
|---|---|---|
| `enabled` | boolean | `process.env.AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN === "1"`, read server-side only |

## RealRun

Held in an in-memory registry (`RuntimeBridgeRunRegistry`) keyed by `projectId`, for the lifetime of one in-flight run; terminal runs are written to a `RunAuditRecord` file and then may be dropped from memory.

| Field | Type | Notes |
|---|---|---|
| `runId` | string | Generated when the run starts; opaque to the caller. |
| `projectId` | string | The registered project's id (from the existing project registry — Spec 137/123). |
| `role` | `"implementer" \| "reviewer"` | Which runtime role this run is for. |
| `status` | `"running" \| "completed" \| "failed" \| "timed_out" \| "cancelled" \| "refused"` | `refused` covers FR-002 (not enabled) and FR-011 (project path mismatch/missing) — the run never spawned a process. |
| `startedAt` | ISO timestamp | Set when the process is spawned (or immediately, for `refused`). |
| `completedAt` | ISO timestamp \| null | Set when the run reaches a terminal status. |
| `evidence` | object | `{ exitCode, signal, stdoutSummary, stderrSummary, terminationReason, timedOut, cancelled }` — shape reuses the existing `ImplementerRuntimeEvidence`/reviewer-equivalent fields already defined in `ImplementerRuntimeTypes.ts` so the browser-side mapping is a direct pass-through, not a translation. |

### State transitions

```text
(request received)
  ├─ enablement disabled ─────────────────────────────▶ refused
  ├─ project path missing/mismatched (FR-011) ─────────▶ refused
  ├─ another run already active for this project ──────▶ refused
  └─ safety validation fails ───────────────────────────▶ refused
  (otherwise) ──▶ running
                   ├─ process exits 0, no timeout/cancel ▶ completed
                   ├─ process exits non-zero ─────────────▶ failed
                   ├─ timeout elapsed ──────────────────────▶ timed_out
                   └─ operator-requested cancel ────────────▶ cancelled
```

`running` is the only non-terminal status. Every other status is terminal and, once reached, is immediately written as a `RunAuditRecord`.

## RunAuditRecord

One JSON file per terminal run, at `.agent-workflow/real-runs/<projectId>/<runId>.json` (directory created on first write; mirrors the existing `.agent-workflow/runs/<featureId>/` convention already used elsewhere in this repository).

| Field | Type | Notes |
|---|---|---|
| `runId`, `projectId`, `role`, `status`, `startedAt`, `completedAt`, `evidence` | — | Same as `RealRun` above, at its terminal state. |
| `command` | string | The resolved command line that was (or would have been) run, for operator inspection. |
| `workingDirectory` | string | The registered project's local path this run executed against. |

## Relationship to existing entities

- `projectId` refers to the same project identity already established by the project registry (Spec 59/123/137) — this feature does not introduce a new project concept, only a new kind of run against an already-registered one.
- `RealRun.evidence` is shaped to match the existing `ImplementerRuntimeEvidence` (and the reviewer runtime's equivalent) types already consumed by `OfficeProjectPortalController`/`View`, so the UI-facing rendering code for run status does not need new branches — it already knows how to render these fields for the existing (currently always-`Blocked`) providers.
