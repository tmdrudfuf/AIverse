# Research: External Project ADOS Run Status

## Decision: Derive visible status from source evidence

**Rationale**: Preparation, execution, and execution result records already carry the authoritative run state. Deriving the dashboard row from those records prevents stale persisted display text from overriding newer evidence.

**Alternatives considered**: Store only a preformatted display string. Rejected because it can drift from execution evidence and is harder to validate.

## Decision: Persist optional status summaries with browser session state

**Rationale**: Session storage already preserves external project workflow state. Adding status summaries to the same snapshot keeps restore behavior consistent while still allowing render-time derivation from source evidence.

**Alternatives considered**: Recompute only and never store status summaries. Rejected because the feature explicitly calls for status state to survive the existing browser session continuity path.

## Decision: Keep status inspection read-only

**Rationale**: Status rows are an audit surface. They must not invoke implementer, validation, review, GitHub, publish, merge, deploy, or repository mutation paths.

**Alternatives considered**: Refresh status by re-invoking providers. Rejected as out of scope and unsafe for an inspection feature.
