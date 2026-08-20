# UI Contract: Implementer Runtime Ready Row

## Ready State

**Given** Runtime Start has status `Started` or `AlreadyStarted`
**And** no Implementer Runtime result exists
**Then** the dashboard row after `[IMPLEMENTER RUNTIME]` includes:

- `I`
- `start`
- `Codex not started`

## Unavailable State

**Given** Runtime Start is missing or did not reach a started state
**Then** the dashboard row remains unavailable and does not present `I` start as currently actionable.

## Outcome States

**Given** an Implementer Runtime result exists
**Then** the dashboard row presents the latest outcome and does not replace it with the ready-state start label.
