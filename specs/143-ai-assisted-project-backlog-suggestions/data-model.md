# Data Model: AI-Assisted Project Backlog Suggestions

## ProjectBacklogSuggestionCandidate

- `id`: Stable suggestion id.
- `projectId`: Canonical registered project id.
- `title`: Suggested backlog title.
- `description`: Suggested requirements/details.
- `rationale`: Optional explanation of value.
- `sourceContextSummary`: Human-readable summary of project-scoped inputs used.
- `generatedAt`: ISO timestamp.
- `status`: `proposed`, `accepted`, `rejected`, or `stale`.
- `suggestedPriority`: Optional advisory priority: `low`, `normal`, `high`, or `urgent`.
- `acceptedBacklogTaskId`: Optional durable association to the backlog task created from this suggestion.
- `updatedAt`: ISO timestamp for review action changes.

## ProjectBacklogSuggestionCollection

- `projectId`: Canonical registered project id.
- `candidates`: Candidates belonging only to this project.
- Valid only when all candidates have the same `projectId`.

## ProjectBacklogSuggestionContext

- `project`: Target registered project summary.
- `backlogItems`: Same-project backlog summaries.
- `activeWork`: Same-project active or in-progress task/run summaries.
- `blockedWork`: Same-project blocked task/run summaries.
- `repository`: Existing safe repository metadata for the same project.
- `developmentRequests`: Existing same-project request summaries when available.

## State Transitions

- `proposed` -> `accepted`: Operator accepts, creating one non-ready Spec 141 backlog task under the same project.
- `proposed` -> `rejected`: Operator rejects; no backlog task is created.
- `proposed` -> `stale`: Future optional state when source context is known obsolete.
- `accepted` remains accepted and cannot be accepted again.
- `rejected` remains advisory history and may be considered for duplicate suppression.
