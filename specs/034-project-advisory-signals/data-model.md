# Data Model: Project Advisory Signals

## Existing Source Entity: ProjectManagementSuggestion

Defined in `src/features/city-view/scene/office/ai/AIProjectManagerTypes.ts`.

Fields reused:

- `projectId`: Project the suggestion belongs to.
- `healthSummary.summary`: Human-readable project health sentence.
- `risks`: Ordered local project-management risks.
- `nextAction.action`: Local recommended next attention/action label.
- `nextAction.reason`: Explanation for the recommendation.
- `createdAt`: Existing local creation timestamp.

Validation rules:

- Only use the suggestion when `suggestion.projectId` matches the selected Project Dashboard project.
- Do not create or update suggestions during Project Dashboard rendering.
- Do not use suggestions from another project.

## New Read Model: ProjectDashboardAdvisorySignal

Provider-neutral read model added to `ProjectDashboardSnapshot`.

Suggested fields:

- `status`: `available`, `empty`, or `unavailable`.
- `healthSummary`: Compact health sentence or empty-state label.
- `topRiskLabel`: Compact risk/blocker label or neutral risk state.
- `nextAttentionLabel`: Compact next attention label or empty-state label.
- `generatedAt`: Optional timestamp copied from the existing suggestion when available.

Validation rules:

- `available`: Requires a matching `ProjectManagementSuggestion`.
- `empty`: Used when the selected project exists but no matching suggestion is available.
- `unavailable`: Used when the project itself is unavailable.
- Labels must be display-safe strings and must not expose management controls.

## Relationships

- `ProjectManagementSuggestion` is existing local source data.
- `InternalSimulationProjectDashboardProvider` maps the selected project's matching suggestion into `ProjectDashboardAdvisorySignal`.
- `ProjectDashboardView` maps `ProjectDashboardAdvisorySignal` into compact terminal rows.
- `OfficeProjectPortalView` renders those rows without mutating simulation state.

## State Transitions

- Missing suggestion -> empty advisory state.
- Matching suggestion available in state -> available advisory state.
- Missing project -> unavailable advisory state.

No new persistence or mutation transitions are introduced.
