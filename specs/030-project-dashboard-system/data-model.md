# Data Model: Project Dashboard System

## Overview

The Project Dashboard uses provider-neutral read models for one selected project. Models are derived at runtime from existing simulation systems and do not become new simulation state.

## Entities

### ProjectDashboardSnapshot

Represents one current Project Dashboard view for a selected project.

**Fields**:

- `providerId`: Stable identifier for the provider that supplied the snapshot.
- `generatedAt`: Timestamp for snapshot derivation.
- `projectId`: Stable project identity from the source provider.
- `projectName`: Player-facing project name.
- `status`: Current project status.
- `progress`: Derived progress summary.
- `health`: Derived project health summary.
- `activeWork`: Active task or work item summaries.
- `employees`: Related employee context.
- `blockers`: Current blockers or risks.
- `activity`: Recent project activity.
- `relatedFocus`: Company focus or employee focus context when available.
- `nextSuggestedFocus`: Optional advisory-only focus recommendation.
- `source`: Optional external source metadata placeholder.
- `sections`: Optional section availability metadata.

**Validation rules**:

- Must be safe to render when optional sections have no data.
- Must not contain duplicated simulation state that cannot be traced back to a provider source.
- Must not expose management, mutation, editing, or external integration controls.

### ProjectDashboardProvider

Supplies provider-neutral snapshots for selected projects.

**Fields/operations**:

- `id`: Stable provider identifier.
- `label`: Human-readable provider name.
- `listProjects(context)`: Returns selectable project summaries for dashboard navigation.
- `getProjectSnapshot(context, projectId)`: Returns one `ProjectDashboardSnapshot` for the requested project, or an unavailable state.

**Validation rules**:

- Provider output must conform to the project dashboard snapshot contract.
- Provider output must be useful without UI-specific formatting.
- Provider methods must be read-only for this feature.

### ProjectDashboardProviderContext

Provides read access to existing systems needed to derive a project snapshot.

**Sources**:

- Projects
- Project tasks
- Employee AI
- Schedule
- Company Dashboard
- Company Influence
- Company Progression
- Work session or activity records
- Conversation/Insight/Knowledge only where existing read data is already available

**Validation rules**:

- Context exposes existing systems or read-only selectors only.
- Context must not introduce new mutable simulation state.

### ProjectProgressSummary

Describes project progress from existing project or task data.

**Fields**:

- `percentComplete`: Optional derived completion percentage.
- `completedWorkCount`: Count of completed work where available.
- `totalWorkCount`: Count of total work where available.
- `label`: Human-readable progress label.
- `source`: Source of the derivation.

### ProjectHealthSummary

Describes current project health from existing signals.

**Fields**:

- `status`: Healthy, watch, risk, blocked, unknown, or equivalent provider-neutral label.
- `score`: Optional derived score when source data supports it.
- `signals`: Short list of positive or negative health signals.
- `reason`: Short explanation of the current health.
- `source`: Source of the derivation.

### ProjectWorkItemSummary

Represents a read-only task or active work item.

**Fields**:

- `id`: Stable source identifier.
- `label`: Player-facing task or work item title.
- `status`: Current task/work status.
- `progress`: Optional progress label or percentage.
- `assignedEmployeeIds`: Related employee identities when available.
- `blocker`: Optional blocker label or reason.
- `source`: Source of the work item.

### ProjectEmployeeContext

Represents employee context related to the project.

**Fields**:

- `employeeId`: Stable employee identity.
- `name`: Employee name.
- `role`: Employee role when available.
- `aiState`: Current AI state when available.
- `currentTask`: Current task or work label when available.
- `focus`: Current focus or thinking context when available.
- `mood`: Optional mood when available.
- `source`: Source of the relationship.

### ProjectBlockerSummary

Represents a current blocker or risk.

**Fields**:

- `id`: Stable derived identifier.
- `severity`: Low, medium, high, blocked, or unknown.
- `label`: Short blocker label.
- `reason`: Why it appears relevant.
- `source`: Source of the derivation.

### ProjectActivityItem

Recent activity related to the selected project.

**Fields**:

- `id`: Stable derived identifier.
- `timestamp`: Activity time when available.
- `type`: Activity category.
- `label`: Short activity label.
- `description`: Optional readable detail.
- `source`: Source system.

### ProjectExternalSourceMetadata

Future-ready metadata describing where project detail data could come from.

**Fields**:

- `sourceType`: `internal-simulation` now; future values may include `github`.
- `sourceId`: Stable source identity when available.
- `externalUrl`: Optional future external URL.
- `mappingConfidence`: Optional confidence label for mapped provider data.

**Validation rules**:

- Must remain metadata only in this feature.
- Must not require network access, credentials, external sync, issue creation, or repository integration.

## Relationships

- `ProjectDashboardProvider` produces `ProjectDashboardSnapshot`.
- `InternalSimulationProjectDashboardProvider` is the only current provider.
- `ProjectDashboardSnapshot` contains derived summaries only.
- Company Dashboard project entries provide the entry point to one Project Dashboard.
- Future GitHub providers must map repository/project/issue data into the same snapshot contract.

## State Transitions

1. Existing simulation state changes.
2. Internal Simulation provider derives selectable project summaries and project detail snapshots.
3. Player opens the Company Dashboard and selects a project.
4. Project Dashboard renders the selected project's derived snapshot.
5. Player returns to Company Dashboard.
6. No Project Dashboard action writes back to project, task, employee, schedule, influence, progression, or external systems in this feature.
