# Research: Controlled Backlog Readiness Promotion Policy

## Decision: Reuse existing backlog update transition

**Rationale**: `ProjectBacklogService.updateTask(..., { status: "ready" })` is the current authoritative Spec 141 transition path used by manual backlog promotion. Reusing it preserves validation, persistence behavior, ordering, and project ownership checks.

**Alternatives considered**: Directly mutating task objects was rejected because it would bypass existing transition semantics.

## Decision: Store one policy per project in browser office session state

**Rationale**: Spec 144 and Spec 145 already persist project-scoped policy records in the existing browser session snapshot. Spec 146 should follow that pattern and fail closed for missing or malformed policy state.

**Alternatives considered**: A global policy was rejected because it would violate multi-project isolation and hidden consent constraints.

## Decision: Deterministic service with no execution integration

**Rationale**: Spec 146 is a policy evaluator, not a development starter. It can inspect active execution state to skip unsafe promotion, but it must not invoke Spec 142, Spec 144, ADOS, Codex, Claude, Git, or GitHub.

**Alternatives considered**: Calling the autonomous coordinator after promotion was rejected because Ready consumption belongs to Spec 144.

## Decision: Origin filtering maps to existing backlog provenance fields

**Rationale**: Existing backlog tasks track `sourceSuggestionId` and `suggestionAcceptanceMode`. These safely distinguish operator-created tasks, manually accepted suggestions, and automatically accepted suggestions without inventing a new taxonomy.

**Alternatives considered**: Adding unrelated provenance categories was rejected because the requirements prohibit inventing provenance values solely for Spec 146.
