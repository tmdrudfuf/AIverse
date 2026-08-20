# Data Model: Implementer Runtime Blocked Result Inspect Action

## Implementer Runtime Result Row

Represents the dashboard display state after Runtime Start has reached a started state and the latest Implementer Runtime result exists.

### Fields

- `hasRuntimeStart`: Whether Runtime Start has reached a started or already-started state.
- `latestResultStatus`: The latest Implementer Runtime result outcome.
- `statusText`: The bounded dashboard text shown after `[IMPLEMENTER RUNTIME]`.

### Validation Rules

- Blocked result text includes a blocked outcome and an inspect cue.
- Blocked result text includes the Codex-not-started safety signal.
- Blocked result text fits within the existing dashboard row budget.
- Ready, unavailable, and non-blocked outcome rows keep their existing meanings.

### State Transitions

1. No Runtime Start: show unavailable.
2. Runtime Start ready and no Implementer Runtime result: show ready with the `I` start label.
3. Latest Implementer Runtime result is blocked: show blocked with inspect cue.
4. Latest Implementer Runtime result is any other outcome: show that outcome's existing row.
