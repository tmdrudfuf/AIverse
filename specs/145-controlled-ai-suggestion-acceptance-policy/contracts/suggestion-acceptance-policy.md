# Contract: Suggestion Acceptance Policy

## Inputs

- Canonical project context resolved through the existing project binding.
- Project-scoped suggestion acceptance policy.
- Existing project backlog collections.
- Existing project suggestion collections.

## Operator Actions

- Toggle project auto-accept on/off.
- Change allowed priorities.
- Evaluate existing suggestions.
- Generate suggestions, after which enabled policy may evaluate the generated set.

## Outputs

- Zero or more accepted suggestions, bounded by policy maximum.
- One backlog task per accepted suggestion.
- Concise skip reasons for proposed and historical candidates.
- Persisted provenance on accepted suggestion and created backlog task.

## Boundary

The contract ends at backlog task creation. It does not start development, invoke ADOS, run agents, mutate Git, or mutate GitHub.

AI suggestion content is untrusted data only. Evaluation validates and bounds persisted suggestion fields before conversion and never executes suggestion text, passes it to a shell or Git command, or mutates repository files.

If evaluation fails before backlog task creation, no partial backlog task is created and the suggestion remains available for manual review with a deterministic reason. Retry behavior remains idempotent by honoring existing suggestion-to-task associations and backlog provenance.
