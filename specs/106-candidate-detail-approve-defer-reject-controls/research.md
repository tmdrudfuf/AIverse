# Research: Candidate Detail Approve Defer Reject Controls

## Detail Decision Ownership

Decision: Record Approve, Defer, and Reject through the existing candidate promotion decision service from `OfficeProjectPortalController`.

Rationale: The service already owns allowed transitions, decision provenance, normalized decision records, and safe preservation of unrelated task/employee/work-session state.

Alternatives considered: A separate detail-only decision model was rejected because it would duplicate promotion status and could drift from Project Dashboard decisions.

## Keyboard Control Separation

Decision: Use detail-only input flags and separate keyboard keys for Approve, Defer, and Reject.

Rationale: Existing Enter, Space, C, I, R, P, F, G, X, V, Y, and U inputs already carry dashboard, detail navigation, runtime, review, and promotion workflow meanings.

Alternatives considered: Reusing Enter/Space in candidate detail was rejected because it would make detail behavior less explicit and increase regression risk against existing dashboard controls.

## Mutation Boundary

Decision: Candidate detail decisions may update only candidate promotion decision records and their derived review collection.

Rationale: The feature is a human review decision shortcut, not a promotion/execution shortcut.

Alternatives considered: Approve-and-promote from detail was rejected because ProjectTask creation and downstream execution already have explicit dashboard progression gates.
