# Data Model: Movement Preview Timestamp Consistency

No new persisted data model is introduced.

## Existing Data Used

- `EmployeeNpcMovementSnapshot.lastUpdatedAt`: existing timestamp for derived or previewed NPC movement state.
- `EmployeeSimulationSnapshot.lastStateChangeAt`: existing timestamp for the latest employee simulation state transition.

## Derived Value

### Preview Movement Timestamp

A transient timestamp selected at preview time from:

1. Latest valid movement snapshot timestamp.
2. Latest valid employee simulation snapshot timestamp.
3. Current ISO timestamp when no existing timestamp is available.

This value is not stored as new state.
