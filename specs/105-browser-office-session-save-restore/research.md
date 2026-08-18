# Research: Browser Office Session Save Restore

## Decision: Use Browser-Local Snapshot Persistence

**Rationale**: The requested feature is browser session continuity after refresh. Existing office state is client-side, and browser-local persistence restores continuity without adding accounts, backend storage, or remote mutation risk.

**Alternatives considered**: Server-side persistence and GitHub-backed persistence were rejected because the feature must be local, fast, and non-mutating.

## Decision: Persist Only Restorable Workflow Records

**Rationale**: The office portal state contains render state, service counters, async request versions, provider instances, and transient view models. Persisting only task collections, employees, prepared session records, active work start results, work sessions, and stable selections keeps snapshots small and safe.

**Alternatives considered**: Persisting the entire portal state was rejected because it would include transient values and create higher corruption risk.

## Decision: Versioned, Fail-Open Snapshots

**Rationale**: Browser storage can be cleared, edited, blocked, or contain stale data. A schema version and defensive validation allow the system to ignore unsupported snapshots and return the default office state.

**Alternatives considered**: Best-effort unversioned hydration was rejected because future office state changes could import incompatible records.
