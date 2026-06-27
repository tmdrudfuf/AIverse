# Data Model: Project Portal Selection

## ProjectPortalState

Fields:

- `isOpen`: Whether portal owns input and is visible.
- `justOpened`: Prevents same-frame Space handling.
- `viewMode`: `list` or `detail`.
- `selectedProjectIndex`: Current selected project row.
- `selectedProjectId`: Current selected project identifier.
- `lastPlaceholderAction`: Most recent placeholder detail action.
- `projects`: Static project definitions.
- `services`: Static global service summaries.

## ProjectPortalProject

Fields:

- `id`: Stable project identifier.
- `name`: Display name.
- `status`: Display status.
- `type`: Project category.
- `enabled`: Whether the future project workspace is available.
- `description`: Detail view text.
- `linkedServices`: Placeholder service rows for detail view.
- `nextAction`: Placeholder next action metadata.

## ProjectPortalPlaceholderAction

Fields:

- `projectId`: Project that received action.
- `actionLabel`: Display action label.
- `status`: Always `placeholder` in Phase 11.