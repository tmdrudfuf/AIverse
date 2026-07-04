# Contract: External Source Status

## Purpose

Describe how GitHub source freshness and failure states are represented without blocking AIverse simulation.

## Status States

- `fresh`: source data was refreshed successfully and is within the approved freshness window.
- `stale`: previous source data exists but is older than the approved freshness window.
- `unavailable`: source data could not be loaded.
- `unauthenticated`: source requires auth or credentials are invalid/missing.
- `rate_limited`: GitHub rate limits prevent refresh.
- `offline`: network access is unavailable.
- `unknown`: source status has not been established.

## UI Requirements

- Status must be display-safe.
- Status must not expose token values, secrets, full auth headers, or private error details.
- Internal simulation data must remain visible when external source status is not fresh.

## Refresh Decision Pending

The refresh model requires approval before implementation:

- read on Project Dashboard open
- foreground timed refresh
- background sync
- webhook-based updates
