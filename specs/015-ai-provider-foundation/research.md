# Research

## Decision: Add AI provider/service under the office feature
Rationale: Current task, employee, repository, and work-session foundations already use provider/service boundaries under the office feature. Keeping AI there preserves locality and avoids global coupling before a real provider exists.
Alternatives considered: A global AI service was rejected as premature because no other feature consumes it yet.

## Decision: Use activity-message generation as the first integration point
Rationale: It is local, low risk, and preserves visible behavior while proving controllers call AIService rather than a provider directly.
Alternatives considered: Employee recommendation UI was rejected because it would add gameplay behavior. Work-session summary rendering was rejected because it would add new visible content beyond the requested foundation.

## Decision: Deterministic mock outputs
Rationale: Review and validation need stable results. Randomness or external calls would violate the phase scope.