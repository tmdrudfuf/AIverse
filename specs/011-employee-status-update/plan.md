# Implementation Plan: Employee Status Update

## Technical Approach
Update the local employee copies in ProjectPortalState during the existing assignment flow. Keep MockEmployeeProvider as the initial Idle source. Avoid reloading employees over runtime state once employees are loaded. Render assignee status in Task Detail by resolving task.assigneeId against state.employees.

## Files
- src/features/city-view/scene/office/OfficeProjectPortalController.ts
- src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify assignment changes employee status to Working, reassignment idles the previous employee only when no loaded local task still uses them, and no execution or integration behavior was added.