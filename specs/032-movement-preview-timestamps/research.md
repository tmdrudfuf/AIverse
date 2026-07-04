# Research: Movement Preview Timestamp Consistency

## Decision: Reuse Existing Snapshot Timestamps

Use the latest timestamp from existing `EmployeeNpcMovementSnapshot.lastUpdatedAt` and `EmployeeSimulationSnapshot.lastStateChangeAt`.

**Reason**: These are the simulation states already being composed into previews. Reusing them avoids presentation-only state and keeps preview behavior deterministic when current simulation state exists.

## Decision: Keep Preview Calls Read-Only

Continue using `previewSnapshots()` for movement and related preview composition.

**Reason**: Employee Insight, Knowledge, conversation targeting, and AI preview state should observe the simulation without mutating movement, schedule, workstation, task, or employee state.

## Decision: Current Time Only as Last Resort

Use `new Date().toISOString()` only when no movement or simulation timestamp exists.

**Reason**: A fixed historical timestamp can be older than the simulation state being previewed and can preserve stale walking state. A current fallback is safer for an initial preview with no prior state.
