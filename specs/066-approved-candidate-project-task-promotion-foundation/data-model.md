# Data Model: Approved Candidate ProjectTask Promotion Foundation

## CandidateProjectTaskPromotionRequest

- `projectId`: selected project ID.
- `candidateTaskId`: Candidate Task selected for promotion.
- `requestedAt`: timestamp supplied by the controller.

Validation:

- Project and Candidate Task IDs must be non-empty.
- Request is valid only for the currently selected project.

## CandidateProjectTaskPromotionResult

- `id`: deterministic result ID.
- `projectId`
- `candidateTaskId`
- `promotionDecisionId`
- `createdProjectTaskId`
- `status`: `Promoted`, `AlreadyPromoted`, `Rejected`, `Ineligible`, `Unavailable`, or `Failed`.
- `reasonCodes`: stable reason-code array.
- `duplicateExistingTask`: boolean.
- `promotedAt`
- `rulesetVersion`
- `candidateTaskProvenance`
- `activeTaskCreated`
- `workStarted`: always `false`.
- `employeeAssigned`: always `false`.
- `executionStarted`: always `false`.

Validation:

- `Promoted` requires `activeTaskCreated = true`, `createdProjectTaskId`, and false work/employee/execution flags.
- `AlreadyPromoted` requires `duplicateExistingTask = true` and an existing task ID.
- Blocked statuses must not create a ProjectTask.

## ProjectTask Mapping

Mapped fields:

- `id`: `<projectId>:promoted-task:<candidateTaskId>:candidate-promotion-v1`
- `title`: Candidate Task title.
- `description`: Candidate Task summary plus source issue/provenance and recommendation hint.
- `status`: `Todo`.
- `priority`: Candidate priority mapped to task priority.
- `projectId`: Candidate Task project.
- `assignee`/`assigneeId`: omitted.
- `createdAt`/`updatedAt`: promotion request timestamp.
- `activityLog`: one note with promotion provenance.

## CandidateProjectTaskPromotionResultCollection

- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesetVersion`

Ordering:

1. Existing result insertion order by Candidate Task collection order where possible.
2. Stable result ID fallback.

## State Additions

Project portal state adds:

- `candidateProjectTaskPromotionResultCollections`: per-project promotion results.

No global singleton or durable persistence is introduced.
