# UI Contract: Employee Insight Card

## Purpose

Define the expected user-facing Employee Insight card content and behavior for implementation and validation.

## Trigger Contract

- Input: current player position and current employee insight sources.
- Show condition: at least one eligible employee is within configured proximity radius and no blocking overlay should suppress insight.
- Hide condition: no eligible employee remains within radius, or a blocking overlay is active.
- Selection: nearest eligible employee; equal distances resolve deterministically by employee id.

## Display Contract

The card displays at most one employee and includes:

- Employee name
- Role
- Current AI state
- Current task
- Work progress
- Project
- Mood, only when available
- Thinking: one short non-dialogue sentence describing current focus

## Interaction Contract

- The card has no action button.
- The card has no interaction key.
- The card does not pause movement.
- The card does not open or advance dialogue.
- The card does not change employee, task, project, schedule, or progression state.

## Fallback Contract

- Missing task: show an idle or between-tasks label.
- Missing project: show an unassigned or no-project label.
- Missing progress: show an unavailable or not-started label.
- Missing mood: omit the mood row or show an unavailable mood only if the surrounding UI pattern requires a fixed row.

## Validation Contract

Manual validation should confirm:

- Card appears when the player enters range.
- Card disappears when the player leaves range.
- Card remains readable while the player moves.
- Card does not appear over blocking portal screens.
- Card contains no dialogue text, choices, or key prompt.
