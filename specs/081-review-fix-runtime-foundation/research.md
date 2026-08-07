# Research: Review Fix Runtime Foundation

## Decision: Reuse Implementer Runtime Provider Safety

**Decision**: The Review Fix Runtime provider will reuse the established implementer-runtime command safety and provider execution pattern.

**Rationale**: Spec 081 starts a local fix attempt through the implementation-provider boundary. Implementer Runtime already owns command validation, working-directory checks, timeout behavior, spawn gating, and bounded evidence.

**Alternatives considered**:

- Add a new generic subprocess runner: rejected because it duplicates existing safety logic.
- Hardcode Codex/Claude product identity into the domain: rejected because the product architecture remains provider-neutral.

## Decision: Revalidate Through Review Fix Plan and Request Services

**Decision**: The runtime service will locate the current Review Fix Request and Review Fix Plan, then re-run the canonical request/plan services before provider spawn.

**Rationale**: Stored downstream records are not execution authorization. Reusing upstream services preserves exact-context binding and current Changes Requested classification.

**Alternatives considered**:

- Trust the stored plan only: rejected because stale plans must not authorize execution.
- Rebuild all upstream validation in the runtime service: rejected because it creates a second chain-integrity architecture.

## Decision: Use `KeyX` for Start Review Fix Runtime

**Decision**: The distinct input key for Start Review Fix Runtime is `X` / `KeyX`.

**Rationale**: Existing project workflow actions use `I`, `R`, `P`, `F`, and `G`. `X` is unoccupied and allows one key press to map to exactly one state transition.

## Decision: Result-Only Pre-Spawn Failures

**Decision**: Missing/stale/unsafe context produces immutable runtime results without creating a runtime record that claims provider execution.

**Rationale**: This matches existing runtime fail-before-spawn safety principles and keeps runtime evidence truthful.

## Decision: Validation and Re-Review Remain Out of Scope

**Decision**: Runtime completion does not start Validation Runtime or Reviewer Runtime.

**Rationale**: Spec 081 stops after the local review-fix runtime result. Later specs can add validation, fresh review targets, re-review, and promotion.
