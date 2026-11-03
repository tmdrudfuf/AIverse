# Contract: Real Execution Server Bridge API

Server-only Next.js API routes, Node.js runtime. Not part of the public internet surface of this app — intended to be called only by the app's own browser client, on the operator's own machine.

## `GET /api/runtime/status`

Reports whether real execution is enabled on this machine, without ever exposing the raw environment variable.

**Response 200**:
```json
{ "enabled": true }
```

## `POST /api/runtime/execute`

Starts (or refuses) one real run.

**Request body**:
```json
{
  "projectId": "string",
  "role": "implementer" | "reviewer",
  "command": {
    "command": "string",
    "arguments": ["string"],
    "inputMode": "argument" | "stdin",
    "workingDirectory": "string",
    "prompt": "string",
    "files": [{ "relativePath": "string", "baseDirectory": "workingDirectory" | "applicationRoot", "content": "string" }],
    "timeoutMs": 0
  }
}
```

`command.workingDirectory` MUST be validated server-side against the registered project's own recorded local path (FR-011) — the caller supplying it is not trusted as the sole check.

**Response 200** (always 200; the real outcome is in `status`, mirroring the existing provider contract rather than using HTTP status codes to carry domain outcomes):
```json
{
  "runId": "string",
  "status": "running" | "completed" | "failed" | "timed_out" | "cancelled" | "refused",
  "refusalReason": "not_enabled" | "project_unavailable" | "already_running" | "unsafe_command" | null,
  "evidence": {
    "started": false,
    "completed": false,
    "timedOut": false,
    "cancelled": false,
    "exitCode": null,
    "signal": null,
    "stdoutSummary": "",
    "stderrSummary": "",
    "commandDisplay": "",
    "workingDirectory": ""
  }
}
```

This call is synchronous from the caller's point of view: it resolves once the run reaches a terminal status (`completed`/`failed`/`timed_out`/`cancelled`) or is immediately `refused`. The browser client is expected to await it exactly as it already awaits the existing `ImplementerRuntimeProvider.invoke()`/reviewer equivalent.

## `DELETE /api/runtime/execute/{runId}`

Requests cancellation of one specific in-flight run.

**Response 200**:
```json
{ "runId": "string", "accepted": true }
```

`accepted: true` means the cancel request was delivered to the running process (SIGTERM, escalating to SIGKILL after the existing grace period if it does not exit). It does not itself mean the run has already reached `cancelled` — the original `POST /api/runtime/execute` call resolves with that terminal status once the process actually exits.

**Response 200, `accepted: false`**: the given `runId` is not currently running (already terminal, or unknown) — not an error, just a no-op.

## Safety invariants (apply to every route above)

- No route in this contract ever runs `git push`, `gh pr create`, `gh pr ready`, `gh pr merge`, or any branch-deletion command, regardless of a run's outcome (FR-010).
- `POST /api/runtime/execute` refuses (never spawns) when: real execution is not enabled on this machine; the registered project's local path is missing, unreadable, or does not match the identity recorded at registration; a run is already active for the same `projectId`; or the resolved command fails this codebase's existing safety validation.
- Every terminal outcome is written to a durable audit file (see data-model.md `RunAuditRecord`) before the response is returned, so an audit record exists even if the caller never reads the response.
