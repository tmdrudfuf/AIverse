# Data Model: Company Influence Planning System

## Company Focus Option

Represents one selectable high-level company priority.

**Fields**:

- `id`: Stable identifier for the focus option.
- `label`: Player-facing option name.
- `description`: Short explanation of what the focus means.
- `advisorySummary`: Short advisory text used by dashboard labels or summaries.
- `futureMetadataTags`: Lightweight tags for future systems without implementing them now.

**Initial valid options**:

- `delivery-speed`: Improve delivery speed
- `quality`: Improve quality
- `team-morale`: Improve team morale
- `project-risk`: Reduce project risk
- `company-growth`: Prepare for company growth

**Validation rules**:

- Option identifiers must be stable.
- Exactly the five listed options are available in the first slice.
- Options do not contain direct task assignments, employee directives, economy data, payroll data, or external provider references.

## Company Influence Plan State

Represents the local current planning choice for the current runtime session.

**Fields**:

- `selectedFocusId`: The active focus option identifier, or unset.
- `updatedAt`: Optional deterministic timestamp if an existing timestamp strategy is already used nearby.

**Validation rules**:

- At most one focus can be active.
- Invalid focus identifiers must not update the state.
- Updating the focus must not mutate employee, task, schedule, work-session, NPC, project execution, economy, or provider state.

## Dashboard Focus Summary

Represents dashboard-ready focus information.

**Fields**:

- `currentFocus`: The selected focus option or an unset state.
- `options`: The available focus options for the planning view.
- `summary`: Advisory summary text for the dashboard.
- `isSet`: Whether a focus is selected.

**Validation rules**:

- Dashboard focus summary is derived from Company Influence Plan State and Company Focus Option definitions.
- It must not duplicate existing employee or project simulation state.
- It can be consumed by dashboard UI without importing service internals.

## Influence Planning View State

Represents transient view state for displaying and navigating the planning affordance.

**Fields**:

- `isOpen`: Whether the planning view is visible.
- `selectedOptionIndex`: The currently highlighted option for navigation, if the existing UI pattern needs it.

**Validation rules**:

- View state may support navigation only.
- View state must not become source-of-truth simulation state.
- Closing the view must preserve the selected company focus in Company Influence Plan State.

## State Transitions

```text
Unset focus
  -> select valid focus
  -> Selected focus
  -> select different valid focus
  -> Selected focus
  -> select same focus
  -> Selected focus unchanged
```

Invalid selections do not transition state.
