# Data Model: Nearby Employee Talk Bubble Interaction

## Nearby Employee Talk Target

- `employeeId`: Existing employee identifier selected at interaction time.
- `distance`: Derived nearby distance used to choose the nearest eligible employee.
- Relationship: Resolved from existing employee/NPC movement state and consumed only for current interaction.

## Employee Speech Bubble

- `employeeId`: Employee whose line is shown.
- `speakerName`: Name displayed in the bubble.
- `dialogueText`: One deterministic employee line.
- `dialogueType`: Existing conversation category used for styling or future behavior.
- `displayDurationMs`: Bounded visible duration before auto-hide.
- `positionHint`: Existing NPC logical position used to place the bubble near the employee.

## State Rules

- A bubble is visible only after a successful nearby employee talk interaction.
- A new successful interaction replaces any existing visible bubble.
- A bubble hides when its display duration expires.
- A bubble hides when a blocking office overlay is active.
- Bubble display state does not mutate employee, task, schedule, movement, insight, knowledge, workstation, or conversation source state.
