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
