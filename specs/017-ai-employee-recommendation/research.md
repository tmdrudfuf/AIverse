# Research

## Decision: Store recommendations in ProjectPortalState
Rationale: Recommendations are derived AI metadata and are not core task fields. Portal state keeps Phase 23 local and hidden.
Alternatives considered: Embedding on ProjectTask was rejected because future providers may refresh recommendations independently of task data.

## Decision: Prepare only when employees are available
Rationale: Recommendations require candidate employees. If employees are not loaded, task analysis can still proceed and recommendation preparation can happen when employee selection loads employees.
Alternatives considered: Loading employees eagerly when tasks load was rejected because it would change existing loading behavior.

## Decision: Do not expose or apply recommendations
Rationale: Phase 23 is a foundation phase. Auto-assignment or UI suggestions would change gameplay and require additional UX review.