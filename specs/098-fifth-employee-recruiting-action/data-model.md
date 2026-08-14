# Data Model: Fifth Employee Recruiting Action

## Recruiting Action

- **Purpose**: Represents the selectable company-level action that attempts to add the fifth employee.
- **State**: Derived from the current employee roster.
- **Validation Rules**:
  - Available only when the fifth employee is absent and the default roster can provide four employees.
  - Complete when the fifth employee already exists.
  - Blocked when fewer than four employees are available after loading.

## Fifth Employee

- **Purpose**: Deterministic employee record appended by the recruiting action.
- **Fields**:
  - `id`: Stable employee identity.
  - `name`: Display name.
  - `role`: Existing employee role value.
  - `status`: Starts idle.
  - `avatarColor`: Stable display color.
  - `capabilities`: Capability labels for future assignment and dashboards.
  - `description`: Terminal/selection detail text.
  - `provider`: Existing placeholder provider metadata.
- **Relationships**:
  - Counts toward company progression active employees.
  - May later be selected for task assignment through existing employee selection.

## Recruiting Result

- **Purpose**: Latest outcome shown to the player.
- **Fields**:
  - `status`: `recruited`, `already_recruited`, or `blocked`.
  - `employeeId`: Present when the fifth employee exists.
  - `message`: Player-facing summary.
  - `rosterSize`: Roster size after the action.
  - `createdAt`: Time of the action result.
