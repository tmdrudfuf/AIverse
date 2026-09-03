# Contract: Autonomous Suggestion Generation Policy

## Operator Policy Control

Input:

- Canonical project context.
- Policy patch with optional `enabled`, `maxSuggestionsPerEvaluation`, `cooldownMs`, gate toggles, and capacity values.

Expected behavior:

- Resolve one exact canonical registered project.
- Persist only same-project valid policy state.
- Mark `updatedByOperator` true for explicit operator updates.
- Reject or normalize unsafe bounded values according to existing policy conventions.
- Never infer enabled state from Spec 144, Spec 145, Spec 146, manual suggestions, reloads, task completion, or execution completion.

## Bounded Event Evaluation

Input:

- Canonical project.
- Canonical project context.
- Project-scoped policy map.
- Existing backlog collections.
- Existing suggestion collections.
- Existing Spec 143 suggestion service and provider.
- Deterministic event identity.
- Active execution state.

Expected behavior:

- Fail closed for missing, mismatched, disconnected, malformed, disabled, cooldown-active, capacity-full, active-execution, Ready-work, pending-suggestion, or duplicate-event state.
- Invoke existing Spec 143 suggestion generation at most once when all gates pass.
- Generate no more than `maxSuggestionsPerEvaluation`.
- Persist concise evaluation metadata and cooldown.
- Return generated suggestions as untrusted suggestion records only.
- Never directly call Spec 145, Spec 146, Spec 144, Spec 142, ADOS, Git, or GitHub.
