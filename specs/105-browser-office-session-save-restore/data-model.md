# Data Model: Browser Office Session Save Restore

## OfficeSessionSnapshot

Represents a browser-local snapshot of office workflow state that can be safely restored into a fresh office portal state.

### Fields

- `version`: Snapshot schema version.
- `savedAt`: Timestamp when the snapshot was written.
- `selectedProjectId`: Last selected project id.
- `selectedProjectDashboardProjectId`: Last selected project dashboard id, if any.
- `selectedProjectDashboardActiveWorkIndex`: Active work list selection index.
- `selectedWorkSessionId`: Last selected active work session id, if any.
- `taskCollections`: Saved project task collections by project id.
- `employees`: Saved employee records.
- `confirmedEmployeeAssignmentRecords`: Confirmed assignment records by id.
- `confirmedEmployeeAssignmentResultCollections`: Confirmed assignment result collections by project id.
- `preparedWorkSessionRecords`: Prepared session records by id.
- `preparedWorkSessionResultCollections`: Prepared session result collections by project id.
- `activeWorkSessionStartResultCollections`: Active work start result collections by project id.
- `workSessions`: Active work sessions by task id.

### Validation Rules

- Snapshot must have the current supported `version`.
- Collection fields must be plain objects or arrays in the expected top-level shape.
- Missing optional selections are ignored.
- Invalid or malformed snapshots are not partially restored.

## RestoredOfficeState

Represents the default portal state after the snapshot has been merged.

### Relationships

- `workSessions` reference tasks from `taskCollections`.
- `confirmedEmployeeAssignmentRecords` and `preparedWorkSessionRecords` reference promoted task and assignment provenance used by active work start results.
- `employees` provide current working status for restored sessions.

### State Transitions

- No saved snapshot: default state remains unchanged.
- Valid snapshot: restorable fields replace their default equivalents.
- Invalid snapshot: default state remains unchanged.
