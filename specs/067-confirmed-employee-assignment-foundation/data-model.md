# Data Model: Confirmed Employee Assignment Foundation

## ConfirmedEmployeeAssignmentRecord

Immutable local record for one human-confirmed employee assignment.

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Deterministic assignment identity. |
| `projectId` | string | Current AIverse project. |
| `projectTaskId` | string | Existing ProjectTask ID. |
| `candidateTaskId` | string | Promoted Candidate Task provenance. |
| `promotionDecisionId` | string? | Promotion decision provenance when present. |
| `assignmentRecommendationId` | string | Matching Spec 064 recommendation. |
| `employeeId` | string | Canonical employee identity. |
| `employeeDisplayName` | string | Display snapshot. |
| `status` | enum | `Assigned` or `AlreadyAssigned` for persisted success state. |
| `reasonCodes` | string[] | Safe reason codes. |
| `assignmentSource` | enum | `Human`. |
| `assignedAt` | string | Command timestamp, not part of identity. |
| `rulesetVersion` | string | `confirmed-assignment-v1`. |
| `taskStatusAtAssignment` | string | Must be non-started (`Todo`). |
| `recommendationProvenance` | object | Defensive copy of recommendation provenance. |
| `humanConfirmed` | true | Explicit human confirmation. |
| `workStarted` | false | Fixed false in this Spec. |
| `workSessionCreated` | false | Fixed false in this Spec. |
| `executionStarted` | false | Fixed false in this Spec. |

## ConfirmedEmployeeAssignmentResult

Immutable command result.

Statuses:

- `Assigned`
- `AlreadyAssigned`
- `Ineligible`
- `Unavailable`
- `Conflict`
- `Failed`

Common reason codes:

- `ASSIGNED`
- `ALREADY_ASSIGNED`
- `TASK_NOT_FOUND`
- `TASK_ALREADY_ASSIGNED`
- `TASK_ALREADY_STARTED`
- `TASK_COMPLETED`
- `RECOMMENDATION_MISSING`
- `RECOMMENDATION_NOT_RECOMMENDED`
- `RECOMMENDATION_STALE`
- `EMPLOYEE_MISSING`
- `EMPLOYEE_UNAVAILABLE`
- `EMPLOYEE_CONFLICT`
- `PROJECT_MISMATCH`
- `MALFORMED_PROVENANCE`
- `TASK_COLLECTION_UNAVAILABLE`
- `EMPLOYEE_REGISTRY_UNAVAILABLE`

Safety flags:

- `assignedTask`: true only when the selected ProjectTask received assignee fields.
- `humanConfirmed`: true only for successful or already assigned same-task/same-employee results.
- `workStarted`: always false.
- `workSessionCreated`: always false.
- `executionStarted`: always false.
- `duplicateExistingAssignment`: true for idempotent repeat.

## ConfirmedEmployeeAssignmentResultCollection

Per-project bounded display collection.

- `projectId`
- `results`
- `resultCount`
- `generatedAt`
- `rulesetVersion`

## Identity Policy

Assignment record ID:

```text
<projectId>:task-assignment:<projectTaskId>:<employeeId>:confirmed-assignment-v1
```

Result ID:

```text
<projectId>:task-assignment-result:<projectTaskId>:confirmed-assignment-v1
```

IDs never use random UUIDs, array indexes, display names, mutable ordering, or timestamps.

## ProjectTask Update

Only the selected ProjectTask changes:

- `assigneeId = employee.id`
- `assignee = employee.name`
- `updatedAt = requestedAt`
- `activityLog` gains one `employee_assigned` note if missing

Preserved:

- title
- description/provenance
- priority
- project ID
- createdAt
- status `Todo`

No employee object is mutated.

## Relationships

```text
CandidateAssignmentRecommendation
  -> promoted Candidate Task provenance
  -> existing ProjectTask promotion marker
  -> ConfirmedEmployeeAssignmentRecord
  -> updated ProjectTask assignee fields
```
