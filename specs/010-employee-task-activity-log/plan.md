# Implementation Plan: Employee Task Activity Log

## Technical Approach
Extend ProjectTask with local TaskActivity records and append activity during the existing local employee assignment flow. Render a compact recent Activity section in Task Detail. Do not add a task activity service or separate collection until persistence or cross-task activity views exist.

## Files
- src/features/city-view/scene/office/tasks/ProjectTaskTypes.ts
- src/features/city-view/scene/office/tasks/MockProjectTaskProvider.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts
- src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify empty task activity, employee assignment activity creation, newest-first ordering, and absence of execution/network integrations.