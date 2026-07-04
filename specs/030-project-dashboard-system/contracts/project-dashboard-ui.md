# Contract: Project Dashboard UI

## Purpose

Define the player-facing Project Dashboard behavior expected from the first read-only vertical slice.

## Entry

- The player opens the Company Dashboard through the existing project portal/dashboard flow.
- The player chooses one visible project entry.
- The Project Dashboard opens for that selected project.

## Required Read-Only Sections

The Project Dashboard should show, when available:

- project name
- project status
- project progress
- active tasks or active work
- assigned or related employees
- current blockers or neutral no-blocker state
- recent project activity
- related employee focus
- project health
- next suggested focus as advisory-only context
- optional source metadata if useful for future provider clarity

## Empty and Partial Data

- Missing tasks produce an empty active-work state.
- Missing employees produce an empty employee-context state.
- Missing blockers produce a neutral no-blocker state.
- Missing progress produces an unknown progress state.
- Missing future source metadata does not reduce internal-simulation usability.

## Exit

- The player can return to the Company Dashboard.
- Exiting does not mutate project, task, employee, schedule, company influence, work-session, progression, or external source state.

## Prohibited UI Affordances

The UI must not offer:

- task assignment
- task editing
- task status changes
- issue creation
- repository sync
- GitHub connection
- employee control
- project execution controls
- dialogue choices
- management controls
- economy, payroll, relationship, quest, multiplayer, or save/load controls
