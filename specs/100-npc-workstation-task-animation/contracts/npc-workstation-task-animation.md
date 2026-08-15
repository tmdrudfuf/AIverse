# Contract: NPC Workstation Task Animation

## View Model Extension

The office NPC renderer consumes existing `EmployeeNpcViewModel` objects with an optional work animation projection:

```ts
type EmployeeNpcWorkAnimation = {
  kind: "workstationTask";
  active: boolean;
  taskId?: string;
  taskTitle?: string;
};
```

## Active Workstation Animation Rules

- `active` is true only when employee simulation state is `working`.
- The movement snapshot must have `movementState: "arrived"`.
- The movement target/position hint must use `zone: "workstation"`.
- The renderer must not require a task title to show the indicator.

## Renderer Behavior

- Active state shows an attached work indicator.
- Inactive or missing state hides the indicator.
- Removing an employee destroys the employee container and indicator together.
- Existing name and state labels remain controlled by their current rendering path.
