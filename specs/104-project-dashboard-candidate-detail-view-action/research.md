# Research: Project Dashboard Candidate Detail View Action

## Decision: Add a Read-Only Candidate Detail View Mode

**Rationale**: Candidate tasks are issue-derived pre-promotion records, not executable ProjectTasks. A dedicated read-only detail view lets the player inspect candidate data without implying task assignment, work start, or runtime execution.

**Alternatives considered**:
- Reuse task-detail view: rejected because task-detail is tied to executable ProjectTask actions.
- Add a second project dashboard lower row expansion: rejected because the lower panel is already budgeted for many status rows and does not provide enough room for detail inspection.

## Decision: Use C/Detail for Candidate Detail and Preserve Enter/Space Progression Controls

**Rationale**: The Project Dashboard already uses Enter for candidate approval and downstream progression when a promotion review is selected, and Space cycles promotion decisions. Using a dedicated C/detail path for read-only detail avoids taking over the existing progression workflow.

**Alternatives considered**:
- Move existing promotion controls: rejected because it risks regressing established candidate progression behavior.
- Reuse Space/action: rejected because Space already cycles promotion decisions on the Project Dashboard.

## Decision: Fail Closed on Missing Candidate Records

**Rationale**: Candidate collections can refresh independently from selected dashboard state. If the selected candidate cannot be resolved, the safest behavior is to stay on Project Dashboard and preserve all domain data.

**Alternatives considered**:
- Open the first candidate task as fallback: rejected because it can show the wrong candidate.
- Open a generic empty detail view: rejected because it hides stale-state issues and weakens player trust.
