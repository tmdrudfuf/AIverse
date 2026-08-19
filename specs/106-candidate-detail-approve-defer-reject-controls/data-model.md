# Data Model: Candidate Detail Approve Defer Reject Controls

## Candidate Detail Decision Action

- **Fields**: project id, candidate task id, target status (`Approved`, `Deferred`, or `Rejected`), decision timestamp.
- **Validation**: The selected candidate task must still have a matching promotion review. The target status must be available from existing promotion transition rules.
- **Relationships**: Creates or updates one Candidate Promotion Decision for the selected candidate.

## Candidate Promotion Decision

- **Fields**: Existing candidate promotion decision fields, including candidate identity, target status, eligibility, reason code, timestamp, and safety flags.
- **Validation**: Must continue to set active task creation and execution flags to false.
- **Relationships**: Refreshes the Candidate Promotion Review Collection for the same project.

## Selected Candidate Detail Context

- **Fields**: selected project dashboard project id and selected candidate task id.
- **Validation**: Detail decisions fail closed when either identity is missing or stale.
- **Relationships**: Resolves the Candidate Task and Candidate Promotion Review used by the detail view.
