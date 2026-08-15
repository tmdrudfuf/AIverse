# Data Model: NPC Workstation Task Animation

## NPC Work Animation State

- `kind`: identifies the animation as workstation task work.
- `active`: whether the renderer should show the indicator.
- `taskId`: copied task identifier for display/debug context.
- `taskTitle`: bounded task title context when available.

### Rules

- Active only when the employee simulation state is working.
- Active only after NPC movement has arrived at a workstation target.
- Missing task title does not block animation if the employee is otherwise actively working at a workstation.
- Returned state is display-only and does not reference mutable source objects.

## Employee NPC View Model

Existing NPC projection extended with optional `workAnimation`.

### Rules

- Existing `displayName`, `displayLabel`, `currentTaskTitle`, `positionHint`, movement fields, and placeholder style remain unchanged.
- Non-working or moving NPCs omit `workAnimation` or mark it inactive.

## Workstation Task Animation Indicator

Renderer-owned visual attached to an NPC container.

### Rules

- Visible only when `workAnimation.active` is true.
- Hidden when the NPC becomes inactive or is removed.
- Does not replace existing name and state labels.
