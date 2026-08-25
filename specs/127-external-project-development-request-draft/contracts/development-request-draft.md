# Contract: Development Request Draft Dashboard Flow

## Trigger

Context:

- Project Portal is open.
- View mode is Project Dashboard.
- Selected dashboard project is the external project draft.
- The project has configured repository identity.

Input:

- `Enter` or `Space`/action on the dashboard.

## Expected State Change

- `externalProjectDevelopmentRequestDrafts[projectId]` exists.
- The draft has status `Draft`.
- Repeating the trigger leaves one draft for the project.
- `selectedProjectDashboardProjectId` remains unchanged.
- Browser office session save includes the draft.

## Prohibited Side Effects

The trigger must not:

- Start runtime, reviewer, validation, post-validation, or review-fix flows.
- Create project tasks, candidate tasks, promotions, assignments, work sessions, execution plans, readiness records, approvals, preflight records, or runtime records.
- Run repository sync or issue sync as the outcome of creating the draft.
- Read the filesystem, contact GitHub, mutate repositories, publish, merge, deploy, or run validation commands.

## Rendering

The Project Dashboard lower panel shows one row with:

- `[DEV REQUEST]`
- Draft status.
- Request title.
- Repository signal.
- Side-effect boundary.
