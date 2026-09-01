# Data Model: Controlled Autonomous Backlog Execution Policy

## ProjectAutonomyPolicy

- `projectId`: Canonical registered project id.
- `enabled`: Explicit operator consent. Defaults to false.
- `allowedPriorities`: Backlog priority values allowed for automatic execution.
- `allowedTaskStatuses`: Initially `ready` only.
- `maxConcurrentExecutions`: Initial safe value is 1.
- `requireNoActiveRun`: Whether active/resumable project execution blocks automation.
- `updatedAt`: Last policy edit timestamp.
- `updatedByOperator`: Marker that policy was explicitly edited by the operator.
- `lastEvaluationReason`: Concise deterministic reason for the latest waiting/blocked state.

Validation:

- Missing, malformed, cross-project, or invalid policy values are ignored and replaced by disabled defaults for that project.
- No global fallback policy exists.

## ProjectAutonomyEvaluationResult

- `projectId`: Evaluated project.
- `state`: `off`, `waiting`, `eligible`, `running`, or `blocked`.
- `reason`: Deterministic reason when no start should occur.
- `selectedTaskId`: Present only when a task is eligible.
- `allowedPriorities`: Effective policy priorities.
- `maxConcurrentExecutions`: Effective concurrency limit.

## Backlog Task Execution Association

Existing Spec 142 fields on backlog tasks remain authoritative:

- `developmentRequestId`
- `executionPreparationId`
- `executionRunId`
- `executionAcceptedAt`

State semantics:

- Ready tasks are eligible for evaluation.
- In Progress is assigned only after accepted or reconnected execution.
- Failed pre-start attempts leave the task Ready.
- Blocked associated runs prevent bypass execution for the project.
