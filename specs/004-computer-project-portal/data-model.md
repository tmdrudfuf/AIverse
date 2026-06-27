# Data Model: Computer Project Portal

## ProjectPortalProject

Represents one placeholder project row.

Fields:

- `id`: Stable project identifier.
- `name`: Display name.
- `status`: Display status such as `Active`, `Planned`, or `Coming Soon`.
- `type`: Project category.
- `enabled`: Whether the project can be treated as available later.

## ProjectPortalServiceStatus

Represents one placeholder linked service status.

Fields:

- `id`: Stable service identifier.
- `label`: Display label.
- `status`: Placeholder service status text.
- `enabled`: Whether the service is active yet.
- `placeholder`: Always true in Phase 10.

## ProjectPortalState

Represents portal runtime state.

Fields:

- `isOpen`: Whether the overlay is visible and owns input.
- `justOpened`: Prevents same-frame Space open -> close behavior.
- `projects`: Static project rows.
- `services`: Static service rows.