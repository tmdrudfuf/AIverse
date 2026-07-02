# Quickstart: Employee Knowledge System

## Prerequisites

- Employee Insight System is present and functioning.
- The office view has visible employee NPCs with existing Employee AI, schedule, project/task, and progression context.

## Validation Commands

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Validation Scenario

1. Start the app and enter the office view.
2. Move near a visible employee until Employee Insight is eligible.
3. Confirm the Employee Knowledge panel appears for the same employee as Employee Insight.
4. Confirm the panel shows read-only identity and work context.
5. Confirm the panel includes a Why summary and Current Goal when source data is available.
6. Confirm the panel includes Planned Next Activity when schedule data is available.
7. Move away from the employee and confirm knowledge hides with insight.
8. Move near multiple employees and confirm knowledge follows the same selected employee as Employee Insight.
9. Open the project portal or another blocking overlay and confirm knowledge does not compete with it.
10. Confirm no dialogue choices, interaction key, management command, relationship control, or direct employee-control affordance appears.

## Expected Results

- The panel helps the player understand nearby employee behavior without interrupting work.
- Panel content updates as source simulation data changes.
- Missing optional fields are omitted or marked unavailable.
- Existing Employee Insight, Employee AI, schedule, project/task progression, conversation, movement, and office overlay behavior remain unchanged.
