# Data Model: Ready Task to Development Request Execution Bridge

## BacklogTaskExecutionAssociation

- `projectId`: Canonical registered project id that owns the task and execution.
- `backlogTaskId`: Source backlog task id.
- `developmentRequestId`: Development request draft id created from the task.
- `preparationId`: ADOS preparation id when durable preparation succeeds.
- `executionRunId`: ADOS execution/run id when known.
- `acceptedAt`: Timestamp when execution is accepted/started or an existing execution is reconnected.

Validation:

- `projectId` must match the selected task's project id.
- Association cannot be inferred from the latest global run.
- Duplicate submissions reuse the existing association.

## DevelopmentRequestFromBacklogTask

- `projectId`: Canonical target project id.
- `projectName`: Safe display name.
- `sourceBacklogTaskId`: Source backlog task id.
- `title`: Request title derived from the task title.
- `requestText`: Full operator-authored task title and description.
- `requirementsArtifactPath`: Durable requirements artifact path from the existing safe store.
- `requirementsArtifactContent`: Full authoritative content passed to ADOS.

Validation:

- Task title and description must be non-empty.
- Task must be Ready.
- Project must be registered, bound, and available.

## TaskExecutionPreview

- `projectId`, `projectName`, `companyName`: Target identity shown before execution.
- `taskTitle`, `taskDescription`, `priority`, `planningStatus`: Selected task details.
- `eligible`: Whether Start Development is enabled.
- `reason`: Fail-closed reason when not eligible.
- `hasActiveProjectRun`: Whether an active/resumable project run already exists.
- `executionStage`: Existing associated execution state, if any.

State transitions:

- Selecting task: no mutation.
- Explicit Start Development accepted: Ready -> In Progress.
- Associated COMPLETE run: execution awareness becomes Complete; planning completion changes only when derived from the associated run.
- Associated Blocked run: execution awareness becomes Blocked while planning state remains separate.
