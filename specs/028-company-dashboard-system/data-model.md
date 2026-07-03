# Data Model: Company Dashboard System

## Overview

The Company Dashboard uses provider-neutral read models. These models are derived at runtime from existing simulation systems and do not become new simulation state.

## Entities

### CompanyDashboardSnapshot

Represents one current dashboard view supplied by a dashboard provider.

**Fields**:

- `providerId`: Stable identifier for the provider that supplied the snapshot.
- `generatedAt`: Timestamp for snapshot derivation.
- `health`: Company health summary.
- `employees`: Employee dashboard summary.
- `projects`: Project dashboard summary.
- `workload`: Current workload summary.
- `occupancy`: Office occupancy summary.
- `bottlenecks`: Derived bottleneck observations.
- `activity`: Recent company activity.
- `conversations`: Recent conversations summary.
- `productivity`: Recent productivity summary.
- `risks`: Current company risks.
- `companySummary`: Short readable company summary.
- `sections`: Optional section availability metadata.

**Validation rules**:

- Must be safe to render when any optional section has no data.
- Must not contain independent employee, project, or conversation state that cannot be traced back to a provider source.

### DashboardProvider

Supplies provider-neutral dashboard snapshots.

**Fields/operations**:

- `id`: Stable provider identifier.
- `label`: Human-readable provider name.
- `getSnapshot(context)`: Returns the current `CompanyDashboardSnapshot`.

**Validation rules**:

- Provider output must conform to the dashboard snapshot contract.
- Providers must not require UI-specific formatting to be useful.

### DashboardProviderContext

Provides read access to existing systems needed to derive a snapshot.

**Sources**:

- Employee AI
- Schedule
- Projects
- Company Progression
- Office Layout
- Conversation
- Insight and Knowledge
- Work session or activity records

**Validation rules**:

- Context exposes existing systems or read-only selectors only.
- Context must not introduce new mutable simulation state.

### CompanyHealthSummary

Derived high-level company status.

**Fields**:

- `status`: Overall health label.
- `score`: Optional derived score when supported by existing progression data.
- `signals`: Short list of notable positive or negative signals.
- `updatedAt`: Optional source timestamp.

### EmployeeDashboardSummary

Aggregates employee state for dashboard display.

**Fields**:

- `totalEmployees`
- `activeEmployees`
- `idleEmployees`
- `focusedEmployees`
- `blockedEmployees`
- `byState`
- `byRole`
- `currentWork`
- `moods`

### ProjectDashboardSummary

Aggregates project state for dashboard display.

**Fields**:

- `totalProjects`
- `activeProjects`
- `completedProjects`
- `blockedProjects`
- `averageProgress`
- `projects`

### WorkloadSummary

Describes current work distribution.

**Fields**:

- `assignedWork`
- `unassignedWork`
- `overloadedEmployees`
- `availableEmployees`
- `focusAreas`

### OfficeOccupancySummary

Describes office presence and workspace usage.

**Fields**:

- `presentEmployees`
- `occupiedWorkstations`
- `availableWorkstations`
- `zones`

### BottleneckSummary

Derived observation about current friction.

**Fields**:

- `id`
- `severity`
- `label`
- `description`
- `source`

### CompanyActivityItem

Recent event derived from existing systems.

**Fields**:

- `id`
- `timestamp`
- `type`
- `label`
- `description`
- `source`

### ConversationSummary

Aggregates recent conversation signals without adding dialogue behavior.

**Fields**:

- `recentCount`
- `highlights`
- `lastConversationAt`

### ProductivitySummary

Derived productivity view from existing progress and work-session signals.

**Fields**:

- `recentProgress`
- `completedWork`
- `focusTrend`
- `summary`

### RiskSummary

Current risks inferred from existing simulation signals.

**Fields**:

- `id`
- `severity`
- `label`
- `reason`
- `source`

## Relationships

- `DashboardProvider` produces `CompanyDashboardSnapshot`.
- `InternalSimulationDashboardProvider` implements `DashboardProvider`.
- `CompanyDashboardSnapshot` contains derived summaries only.
- UI components consume `CompanyDashboardSnapshot` and section models.
- Future providers must map source-specific data into the same snapshot contract.

## State Transitions

1. Existing simulation state changes.
2. Internal Simulation provider derives a fresh snapshot.
3. Dashboard UI renders the snapshot.
4. Missing source data produces empty or unavailable section states.
5. No dashboard mutation writes back to simulation systems in this feature.
