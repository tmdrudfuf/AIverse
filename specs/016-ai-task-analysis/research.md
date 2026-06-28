# Research

## Decision: Store task analyses in ProjectPortalState
Rationale: Phase 22 has no persistence or UI. Portal state matches existing task, employee, work-session, and activity runtime state and keeps the feature local.
Alternatives considered: Embedding analysis on ProjectTask was rejected because analysis is provider-derived metadata, not core task data.

## Decision: Prepare analysis on load and selection
Rationale: Loading covers tasks becoming available, and selection covers future local changes or missed analysis state. Storing by task id prevents duplicate visible effects.
Alternatives considered: Preparing only on Start Work was rejected because the phase goal covers tasks becoming available or selected, not only execution.

## Decision: Deterministic mock analysis
Rationale: Review and regression validation need stable outputs with no external calls.