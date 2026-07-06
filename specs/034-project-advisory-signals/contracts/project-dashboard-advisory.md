# Contract: Project Dashboard Advisory Display

## Producer

`InternalSimulationProjectDashboardProvider.getProjectSnapshot(context, projectId)`

## Consumer

`ProjectDashboardView.createProjectDashboardPanelRows(snapshot)` and the Project Dashboard render path in `OfficeProjectPortalView`.

## Input Contract

The provider may receive:

- Existing project/task/employee/activity/progression/dashboard context.
- Optional `projectManagementSuggestions` map keyed by project id.

The provider must not:

- Call `AIProjectManagerService`.
- Create suggestions.
- Call external AI providers.
- Call GitHub APIs.
- Mutate project, task, employee, work-session, company focus, repository mapping, or repository summary state.

## Output Contract

`ProjectDashboardSnapshot.advisory` must contain:

- `status`
- `healthSummary`
- `topRiskLabel`
- `nextAttentionLabel`
- optional `generatedAt`

When a matching suggestion exists:

- `status` is `available`.
- `healthSummary` comes from `suggestion.healthSummary.summary`.
- `topRiskLabel` comes from the highest-priority available risk, or a neutral no-risk state.
- `nextAttentionLabel` comes from `suggestion.nextAction`.

When no matching suggestion exists:

- `status` is `empty`.
- Labels clearly state that advisory data is waiting or unavailable.

When the selected project is unavailable:

- `status` is `unavailable`.
- Existing unavailable project behavior remains visible.

## UI Contract

The Project Dashboard must render compact read-only advisory text:

- Health/advisory summary
- Top risk or neutral risk
- Next attention

The UI must not render:

- Assignment controls
- Task status controls
- Management action buttons
- Employee-control affordances
- Credential or sync controls
- Repository mutation controls
