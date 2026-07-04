# Contract: Preview Timestamp Selection

## Inputs

- Existing movement snapshots.
- Existing employee simulation snapshots.

## Output

- One ISO timestamp string to pass into movement, Employee AI, Insight, Knowledge, and conversation preview composition.

## Rules

1. Return the latest valid timestamp from movement `lastUpdatedAt` and simulation `lastStateChangeAt`.
2. Ignore invalid timestamp strings.
3. Use the current ISO timestamp only if no valid input timestamps exist.
4. Do not mutate movement snapshots, simulation snapshots, or portal state while selecting the timestamp.
