# Quickstart: NPC Workstation Task Animation

## Manual Scenario

1. Enter the office.
2. Assign an employee to a task and start work so the employee enters a working state.
3. Confirm the employee NPC moves to a workstation.
4. Confirm the NPC shows a visible work indicator while keeping the name and task label visible.
5. Change the employee back to a non-working state or remove the active task.
6. Confirm the indicator disappears and no stale work visuals remain.

## Focused Automated Checks

These commands are documented for the validation runtime and must not be run from the ADOS implementer runtime:

```powershell
npm test -- npc-work-animation OfficeEmployeeNpcRenderer
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
