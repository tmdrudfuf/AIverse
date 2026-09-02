# Data Model: Controlled AI Suggestion Acceptance Policy

## ProjectBacklogSuggestionAcceptancePolicy

- `projectId`: canonical registered project id.
- `enabled`: explicit operator consent, default `false`.
- `allowedPriorities`: eligible suggestion priorities.
- `maxAutoAcceptPerEvaluation`: bounded count, default `1`.
- `requireNonDuplicate`: fixed `true`.
- `requireValidStructuredSuggestion`: fixed `true`.
- `createdTaskInitialStatus`: fixed `backlog`.
- `updatedAt`: policy update timestamp.
- `updatedByOperator`: true only after an explicit operator change.
- `lastEvaluation`: concise accepted/skipped result for audit.

## ProjectBacklogSuggestionCandidate

Existing Spec 143 entity. Auto-accept considers only `status = proposed`, same `projectId`, valid text, valid `suggestedPriority`, and no existing conversion association.

## ProjectBacklogTask Provenance

- `sourceSuggestionId`: source suggestion id.
- `suggestionAcceptanceMode`: `manual` or `automatic`.
- `suggestionAcceptedAt`: acceptance timestamp.

## State Rules

- Missing or invalid policy creates a disabled default.
- Auto-accepted tasks are created as `backlog`.
- Existing accepted suggestion associations are authoritative for idempotency.
