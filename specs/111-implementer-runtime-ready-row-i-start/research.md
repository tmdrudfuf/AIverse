# Research: Implementer Runtime Ready Row I Start Label

## Decision: Treat the feature as a ready-state copy refinement

**Rationale**: The start input already exists and is gated separately from other runtime actions. The missing behavior is that the ready row does not name the actionable `I` input.

**Alternatives considered**: Add a second row or change input handling. Both are larger than needed and risk crowding the dashboard or changing established runtime gates.

## Decision: Preserve all non-ready row wording

**Rationale**: Existing unavailable and outcome rows carry important audit wording about Codex/reviewer, validation, and mutation not being started. The request targets only the ready row.

**Alternatives considered**: Rewrite every Implementer Runtime row for consistency. Rejected because it broadens risk without user value for this feature.
