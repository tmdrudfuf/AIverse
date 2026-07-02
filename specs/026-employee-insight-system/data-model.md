# Data Model: Employee Insight System

## EmployeeInsightConfig

Represents display and selection configuration.

- `proximityRadius`: maximum distance from player to employee for automatic display.
- `hideWhenBlockingOverlayOpen`: whether insight is hidden while blocking overlays are open.
- `fallbackTaskLabel`: display value for no current task.
- `fallbackProjectLabel`: display value for no current project.
- `fallbackProgressLabel`: display value for unavailable work progress.

Validation rules:

- `proximityRadius` must be positive.
- Fallback labels must be non-empty.

## EmployeeInsightSource

Read-only source context for one employee.

- `employeeId`
- `name`
- `role`
- `aiState`
- `simulationState`
- `currentTask`
- `currentProject`
- `workProgress`
- `mood`
- `scheduleState`
- `movementPosition`
- `workstationState`
- `companyProgression`

Relationships:

- References existing employee, Employee AI, task, project, schedule, movement, workstation, and progression snapshots.
- Does not own or mutate those snapshots.

## EmployeeInsightTarget

Represents an employee eligible for observation.

- `employeeId`
- `distance`
- `source`

Validation rules:

- `distance` must be finite.
- Target is eligible only when distance is less than or equal to configured radius.

Selection rules:

- Select nearest eligible target.
- Break equal-distance ties deterministically by employee id.
- Return no target if no employee is eligible.

## EmployeeInsightViewModel

The display model for the card.

- `employeeId`
- `titleName`
- `roleLabel`
- `aiStateLabel`
- `taskLabel`
- `progressLabel`
- `projectLabel`
- `moodLabel`
- `thinkingText`
- `distance`

Validation rules:

- Required labels are non-empty.
- `moodLabel` is optional.
- `thinkingText` is a single short sentence, not dialogue.

## State Transitions

```text
hidden -> visible
  when nearest eligible employee enters radius

visible -> visible(updated)
  when same employee remains eligible and source data changes

visible -> visible(switched)
  when another eligible employee becomes deterministically nearest

visible -> hidden
  when no eligible employee remains or a blocking overlay is open
```
