# Contract: Project Backlog Suggestions

## Generate Suggestions

Input:

- Canonical project context resolved from existing project registry and company binding.
- Project-scoped backlog collections.
- Project-scoped execution/request/session state.
- Optional max suggestion count, default 3.

Output:

- Success with a `ProjectBacklogSuggestionCollection` for the canonical project.
- Failure with `MissingProject`, `UnavailableProject`, `InvalidProviderOutput`, or `NoCandidates`.

Rules:

- Generation occurs only when the caller invokes the explicit generation command.
- Provider output must be structured and validated.
- Malformed candidates are discarded while valid candidates are preserved.
- Duplicate same-project work is filtered before candidates are persisted.
- No backlog, execution, Git, shell, review, publish, merge, or deploy mutation is allowed.

## Accept Suggestion

Input:

- Canonical project context.
- Existing suggestion collections.
- Existing project backlog collections.
- Suggestion id.
- Optional operator-edited title, description, and priority.

Output:

- Success with updated suggestion collection and created Spec 141 backlog task.
- Failure with `MissingProject`, `UnavailableProject`, `SuggestionNotFound`, `ProjectMismatch`, `InvalidInput`, or `AlreadyAccepted`.

Rules:

- Created backlog task must have the same project id.
- Created backlog task must remain in non-executing backlog status.
- Acceptance must not invoke Spec 142 or ADOS.
- Repeated acceptance must not create duplicates.

## Reject Suggestion

Input:

- Canonical project context.
- Existing suggestion collections.
- Suggestion id.

Output:

- Success with updated suggestion status.
- Failure with `MissingProject`, `UnavailableProject`, `SuggestionNotFound`, or `ProjectMismatch`.

Rules:

- Rejection creates no backlog task.
- Rejected state persists for same-project future duplicate suppression.
