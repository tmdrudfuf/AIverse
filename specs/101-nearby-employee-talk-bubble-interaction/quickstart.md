# Quickstart: Nearby Employee Talk Bubble Interaction

## Manual Scenario

1. Start the AIverse app and enter the Daily Proof office.
2. Move near a visible employee until the Employee Insight card targets that employee.
3. Press Space while not standing on the exit and not targeting the computer.
4. Confirm a speech bubble appears near the employee with the employee name and one short line.
5. Continue moving and confirm movement remains available while the bubble is visible.
6. Wait for the display duration and confirm the bubble hides automatically.
7. Move near a different employee, press Space again, and confirm the bubble updates to that employee.
8. Open the project portal and confirm employee talk bubbles do not start behind the blocking overlay.

## Focused Validation Commands

These commands are documented for ADOS validation outside this runtime:

```powershell
npm test -- nearby-talk-bubble EmployeeConversationBubbleOverlay
```

## Full Validation Commands

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
