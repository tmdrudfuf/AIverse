# UI Contract: Implementer Runtime Blocked Result Row

## Blocked Result State

**Given** Runtime Start has status `Started` or `AlreadyStarted`
**And** the latest Implementer Runtime result has status `Blocked`
**Then** the dashboard row after `[IMPLEMENTER RUNTIME]` includes:

- `blocked`
- `inspect`
- `Codex not started`

## Ready State

**Given** Runtime Start has status `Started` or `AlreadyStarted`
**And** no Implementer Runtime result exists
**Then** the dashboard row continues to present the ready start cue and does not show blocked-result wording.

## Other Outcome States

**Given** an Implementer Runtime result exists with a status other than `Blocked`
**Then** the dashboard row presents that latest outcome and does not replace it with blocked-result wording.
