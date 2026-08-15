# Contract: Nearby Employee Talk Bubble

## Controller Contract

The office scene may request an employee conversation view model by employee id:

```ts
getEmployeeConversationViewModel(employeeId: string): EmployeeConversationViewModel | undefined
```

Expected behavior:

- Returns `undefined` when no valid conversation can be derived.
- Returns speaker name, dialogue text, dialogue type, display duration, and optional NPC position hint when conversation data is available.
- Does not mutate employee, task, schedule, movement, workstation, insight, knowledge, or rendering state.

## Scene Contract

When action input is pressed outside blocking portal UI:

- Existing exit behavior remains first priority.
- Existing interactive object behavior remains next priority.
- Employee talk is attempted only when those interactions do not consume the action.
- Employee talk uses the currently selected nearby Employee Insight target.
- A valid talk view model is passed to the speech bubble overlay.
- No bubble is shown when there is no nearby target or no conversation view model.

## Overlay Contract

The speech bubble overlay supports:

```ts
show(viewModel: EmployeeConversationViewModel, nowMs: number): void
update(nowMs: number): void
hide(): void
destroy(): void
```

Expected behavior:

- Shows speaker name and one dialogue line.
- Positions near the NPC position hint when present.
- Hides automatically after `displayDurationMs`.
- Replaces current content and restarts duration when `show` is called again.
- Destroys all Phaser display objects on scene shutdown.
