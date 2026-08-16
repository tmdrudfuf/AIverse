# Data Model: Project Dashboard Candidate Detail View Action

## Candidate Detail Selection

- `selectedCandidateTaskId`: optional identity of the candidate task currently opened in detail view.
- Related project comes from the existing selected Project Dashboard project.
- Valid only while the portal is open and the candidate task exists in the loaded candidate task collection.

## Candidate Task Detail

- Source candidate fields: title, summary, issue number, state, labels, assignees, priority, type, source provider, source repository, source URL, created/updated timestamps.
- Derived display fields are read-only and do not create or update candidate task records.

## Candidate Context Summary

- Assignment recommendation context for the selected candidate, when available.
- Promotion review context for the selected candidate, when available.
- Promoted ProjectTask context for the selected candidate, when available.

## State Transitions

- Project Dashboard -> Candidate Detail: allowed only when the selected candidate resolves to a loaded candidate task.
- Candidate Detail -> Project Dashboard: Esc returns to the same Project Dashboard.
- Missing candidate data: remain on Project Dashboard and preserve state.
