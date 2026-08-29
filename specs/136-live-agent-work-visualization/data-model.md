# Data Model: Live Agent Work Visualization

## SemanticOfficeWorkState

- `projectId`: Selected project identifier.
- `projectName`: Selected project/company display name.
- `lifecycle`: `no-active-run`, `active`, `blocked`, `complete`.
- `stage`: Normalized stage category: `implementation`, `validation`, `review`, `publication`, `blocked`, `complete`, or `idle`.
- `stageLabel`: Readable label for employee and Project Status display.
- `rawStatus`: Safe original status/stage text when available.
- `specPath` / `featureBranch`: Truthful project run metadata when available.
- `updatedAt`: Timestamp from the selected run snapshot.
- `reasonText`: Safe blocked/recovery reason summary when available.
- `assignments`: Semantic role assignments for employees/NPCs.
- `pipeline`: Stage-based display items without percentages.

## SemanticWorkAssignment

- `role`: `implementer`, `reviewer`, `validator`, `operations`, or `idle`.
- `employeeId`: Existing employee id when a matching employee is selected.
- `providerLabel`: Agent/provider identity when exposed by real run data.
- `displayName`: Employee or provider-readable identity.
- `statusLabel`: `Implementing`, `Reviewing`, `Validating`, `Publishing`, `Blocked`, `Complete`, or `Idle`.
- `department`: `engineering`, `review`, `validation-qa`, `project-status-operations`, or `shared`.
- `positionHint`: Existing NPC movement destination.
- `visualTone`: `active`, `warning`, `complete`, or `idle`.

## ProjectStatusDisplay

- `title`: Selected project/company title.
- `summary`: Current truthful state summary.
- `rows`: Bounded text rows for spec, stage, run status, reasons, and timestamps where available.
- `pipeline`: Ordered stage labels with current/completed/blocked/idle state.

## State Transitions

- No active run -> Idle state with no active employee status.
- Prepared/started/implementer states -> Implementation in Engineering.
- Validation states -> Validation / QA.
- Review states -> Review.
- Publication/PR/merge/cleanup states -> Project Status / Operations.
- Blocked/recovery/failure/timeouts/cancellation -> Blocked warning state.
- Complete -> Complete Project Status and idle/completed employee labels.
- Project change -> Recompute from only the newly selected project snapshot.
