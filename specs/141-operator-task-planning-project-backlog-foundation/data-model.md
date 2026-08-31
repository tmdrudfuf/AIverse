# Data Model: Operator Task Planning Project Backlog Foundation

## ProjectBacklogCollection

- `projectId`: canonical registered project id.
- `tasks`: ordered list of BacklogTask records owned by the project.
- Validation: collection project id must resolve to a registered, available project before mutation.

## BacklogTask

- `id`: stable deterministic task id unique within a project collection.
- `projectId`: canonical registered project id.
- `title`: operator-entered title.
- `description`: operator-entered full request text.
- `status`: `backlog`, `ready`, `in_progress`, `blocked`, `completed`, or `cancelled`.
- `priority`: `low`, `normal`, `high`, or `urgent`.
- `createdAt`: ISO timestamp.
- `updatedAt`: ISO timestamp.
- `blockedReason`: optional concise planning blocker reason.
- `developmentRequestId`: optional future association field.
- `executionRunId`: optional future association field.

## State Transitions

- Any status can be manually changed to any supported planning status.
- Ready is eligibility for future development request creation only.
- Blocked is a planning blocker only and is distinct from ADOS runtime blocked.
- Completed is manual planning completion only and does not imply code merge.

## BacklogSummary

- `projectId`: canonical registered project id.
- `totalTaskCount`, `readyTaskCount`, `blockedTaskCount`, `completedTaskCount`.
- `indicatorText`: concise read-only city label such as `3 Ready`, `1 Blocked task`, or `No planned tasks`.
