# Contract: Dashboard Influence Integration

## Purpose

Expose the current company focus through the Company Dashboard without making the dashboard dependent on implementation-specific influence service details.

## Dashboard Requirements

- Show the current company focus in the dashboard overview or a nearby planning section.
- Show a neutral unset state when no focus is active.
- Provide a route or affordance from the dashboard to the influence planning view.
- Return from the planning view to the dashboard without disrupting existing dashboard content.

## Planning View Requirements

- Show the five focus options in deterministic order.
- Indicate the currently active focus.
- Allow selecting one option.
- Avoid employee assignment, task assignment, task completion, project control, dialogue, economy, payroll, relationship, or direct employee-control controls.

## Data Boundary

- Dashboard UI may consume dashboard focus summary data and focus options.
- Dashboard UI must not duplicate employee, project, task, schedule, or work-session state for presentation.
- Dashboard UI must not import external provider clients or AI provider clients for this feature.

## Regression Boundary

The integration must preserve existing behavior for:

- Company Dashboard opening and closing.
- Project portal opening from the office computer.
- Office movement.
- Computer interaction.
- NPC behavior and labels.
- Employee AI, schedule, work-session, and project task execution.
