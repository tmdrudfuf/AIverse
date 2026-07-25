# Research: Finding Lifecycle Tracking

## Decision: Keep Structured Review schema version 1 with optional lifecycle data

**Rationale**: The new lifecycle field is additive. Existing Spec 050/051 artifacts remain valid when the field is absent. Re-reviews can require lifecycle data based on workflow context rather than schema version alone.

**Alternatives considered**: Schema version 2 was rejected because it would make old providers appear unsupported even though the base review fields are unchanged.

## Decision: Normalize lifecycle in a separate module

**Rationale**: Lifecycle validation compares prior finding history against a current structured review and should remain pure and testable. Keeping it out of orchestration avoids turning stage control into a parser.

**Alternatives considered**: Embedding validation in `structuredReview.js` was rejected because lifecycle rules depend on previous workflow state.

## Decision: Markdown-only re-review with prior structured findings stops conservatively

**Rationale**: Prose cannot deterministically classify every prior finding as resolved or still open. Initial Markdown-only behavior remains for backward compatibility, but re-review lifecycle requires structured data when prior structured findings exist.

**Alternatives considered**: Heuristic prose resolution was rejected because it could approve while unresolved blockers remain.

## Decision: Deterministic continuity checks only

**Rationale**: The workflow can compare ID, severity, summary, and recommendation presence without inventing semantic meaning. Complex semantic deduplication is out of scope and would require external intelligence or brittle heuristics.

**Alternatives considered**: Embedding-based or fuzzy semantic matching was rejected because Spec 052 is local, provider-neutral, and deterministic.

## Decision: Active fix handoff uses normalized open blocking findings

**Rationale**: Fix prompts should target only findings that are `new` or `still_open`. Resolved findings remain in history and artifacts but are not active instructions.

**Alternatives considered**: Passing all historical findings was rejected because it risks re-fixing already resolved issues and confusing the Implementer.
