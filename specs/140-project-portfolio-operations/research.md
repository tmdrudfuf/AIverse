# Research: Project Portfolio Operations

## Decision: Compose Existing Project-Scoped Sources

Use a new focused portfolio aggregation service that accepts city buildings and ProjectPortalState-shaped project-scoped state, then calls ProjectCompanyBindingService and LiveAgentWorkVisualization per project id.

**Rationale**: This preserves Spec 139 isolation and avoids creating a second registry, workflow engine, or latest-run singleton.

**Alternatives considered**: Reusing CityProjectOperationsStatusService directly would leave attention-state, filtering, request-awareness, and selection-summary concepts scattered across rendering code.

## Decision: Deterministic Attention Mapping

Map detailed workflow stages to operator-facing attention states with a pure function: blocked lifecycle becomes Blocked or Needs Attention when reason semantics indicate review/validation recovery; complete becomes Recently Completed; missing binding becomes Disconnected; active stages become Active; no run becomes Idle.

**Rationale**: Pure mapping is easy to test and makes city behavior deterministic.

**Alternatives considered**: Time-based recent-completion presentation was rejected as the source of truth because the requirement prefers persisted completed state.

## Decision: Non-Mutating Filters

Represent filters as pure predicates over portfolio summaries.

**Rationale**: Filtering must affect only visibility/emphasis/navigation and must not touch registry, run, request, or blocker state.

**Alternatives considered**: Persisting filter selection was not required and would add state unrelated to project operations.

## Decision: Compact City Summary

Enhance existing building prompt text with a concise summary rather than adding a dashboard panel.

**Rationale**: The pixel-art city remains primary while selected/nearby buildings can expose enough project operations information to guide entry.

**Alternatives considered**: A large permanent portfolio menu was rejected because it would obscure the city and resemble a conventional SaaS dashboard.
