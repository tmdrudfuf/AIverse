# Research: Spec 082 - Validation Runtime Foundation

## Decision 1: Chain Position

**Decision**: Place Validation Runtime immediately downstream of Review Fix Runtime.

**Rationale**: Spec 081 already preserves the exact fixed context and explicitly stops before validation or review. Binding to those records avoids another interpretation of the same candidate.

## Decision 2: Provider Boundary

**Decision**: Add a provider-neutral validation command provider with a guarded Node implementation.

**Rationale**: Validation commands are subprocesses, but browser builds must not statically import Node modules. The existing implementer/reviewer runtime pattern already uses dynamic import and explicit environment opt-in.

## Decision 3: Command Snapshot

**Decision**: Execute only commands copied from the Review Fix Plan snapshot.

**Rationale**: The upstream execution plan already records the approved validation command list. Later config drift must not alter what this runtime validates.

## Decision 4: No Review or GitHub Side Effects

**Decision**: Validation Runtime records validation only.

**Rationale**: Fresh review, review target creation, promotion, PR creation, merge, deployment, and cleanup are separate human or ADOS workflow stages.
