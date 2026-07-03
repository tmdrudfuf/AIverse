# Contract: Company Dashboard UI

## Purpose

The Company Dashboard UI renders a read-only company command center from a provider-neutral `CompanyDashboardSnapshot`.

## UI Inputs

The dashboard UI may receive:

- `snapshot`: Current `CompanyDashboardSnapshot`.
- `isLoading`: Whether a snapshot is being derived or refreshed.
- `error`: Optional non-blocking provider error state.
- `onClose`: Optional close/navigation callback supplied by the existing app shell.

## UI Guarantees

The UI must:

- Render read-only dashboard sections.
- Avoid importing Internal Simulation provider implementation details.
- Avoid creating dashboard-owned employee, project, conversation, or workload state.
- Show empty states for unavailable sections.
- Preserve existing office, portal, insight, and knowledge behavior.

## Prohibited Controls

The UI must not include:

- Task assignment.
- Employee management actions.
- Editing controls.
- Dialogue choices.
- Project control actions.
- Direct employee-control affordances.
- External connector setup controls.

## Expected Sections

The first vertical slice should support these sections where provider data exists:

- Company Health
- Employee Summary
- Employee States
- Project Summary
- Project Progress
- Current Workload
- Office Occupancy
- Current Bottlenecks
- Recent Company Activity
- Recent Conversations Summary
- Company Summary
- Recent Productivity
- Current Risks

## Empty State Behavior

When provider data is missing, the UI should show a lightweight empty or unavailable state and continue rendering the rest of the dashboard.
