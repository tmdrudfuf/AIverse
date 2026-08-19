# Contract: Candidate Detail Decision Controls

## View Contract

- Candidate detail displays the current promotion status for the selected candidate.
- Candidate detail displays action guidance for Approve, Defer, and Reject.
- After a successful detail decision, candidate detail remains open and displays the refreshed promotion status.
- Esc returns to Project Dashboard.

## Controller Contract

- Approve from candidate detail requests `Approved` for the selected candidate.
- Defer from candidate detail requests `Deferred` for the selected candidate.
- Reject from candidate detail requests `Rejected` for the selected candidate.
- Unavailable transitions return without changing state.
- Detail decisions do not call ProjectTask promotion, assignment confirmation, work-session preparation/start, execution planning, runtime start, validation, review, repository, GitHub, publish, merge, or deploy paths.

## Input Contract

- Detail decision inputs are distinct from dashboard Enter/Space, candidate-detail open, runtime, review, and promotion workflow inputs.
