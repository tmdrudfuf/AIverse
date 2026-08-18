# Contract: Office Session Persistence

## Create Office Portal State

**Trigger**: Office portal state is created in a browser-capable runtime.

**Expected behavior**:

- Load the browser office session snapshot for the supported schema version.
- If the snapshot is valid, merge restorable workflow records into the default office portal state.
- If storage is missing, inaccessible, malformed, or unsupported, return default state.

## Save Office Portal State

**Trigger**: Office portal workflow state changes after active work/session-related actions or office close/destroy.

**Expected behavior**:

- Save a versioned snapshot containing restorable workflow records.
- Do not save providers, render objects, async request counters, external credentials, or remote mutation state.
- Do not throw user-blocking errors when storage is unavailable.

## Duplicate Active Work Guard

**Trigger**: A restored active work session exists and the same prepared work start is requested again.

**Expected behavior**:

- Reuse the restored active session identity.
- Return an already-started result instead of creating a duplicate active session.
