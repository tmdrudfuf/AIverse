# Quickstart: Employee Insight System Validation

## Prerequisites

- Feature implementation tasks are complete.
- Dependencies are installed.

## Static Validation

Run:

```bash
npx tsc --noEmit
npm run build
npm test
git diff --check
git diff --cached --check
```

Expected:

- All commands pass.

## Manual Browser Validation

1. Start the app with `npm run dev`.
2. Open the city view in a desktop browser.
3. Enter the Daily Proof office.
4. Move the player near a visible employee NPC.
5. Confirm an Employee Insight card appears automatically.
6. Confirm the card displays name, role, AI state, current task, progress, project, optional mood, and one Thinking sentence when source data exists.
7. Move while the card is visible.
8. Confirm movement remains available and the card does not block controls.
9. Move away from the employee.
10. Confirm the card disappears automatically.
11. Move near two employees if possible.
12. Confirm the card describes the nearest eligible employee.
13. Open the project portal.
14. Confirm the insight card does not compete with the blocking portal overlay.
15. Confirm no dialogue, dialogue choices, or interaction-key prompt appears.

Expected:

- Employee Insight behaves as a passive, non-blocking overlay.
- Existing employee movement, schedule, project/task progression, and dialogue behavior remain unchanged.
