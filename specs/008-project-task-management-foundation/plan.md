# Implementation Plan: Project Task Management Foundation

## Technical Approach
Add project task model/provider/service files under the office portal boundary. Use a mock provider for deterministic Daily Proof task data. Extend portal state with task collections, task selection, task-list mode, and task-detail mode. Keep CompanyOfficeScene unchanged and keep the Phaser view presentational.

## Files
- src/features/city-view/scene/office/tasks/ProjectTaskTypes.ts
- src/features/city-view/scene/office/tasks/ProjectTaskProvider.ts
- src/features/city-view/scene/office/tasks/MockProjectTaskProvider.ts
- src/features/city-view/scene/office/tasks/ProjectTaskService.ts
- OfficeProjectPortalTypes.ts
- OfficeProjectPortalRegistry.ts
- OfficeProjectPortalController.ts
- OfficeProjectPortalView.ts

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify Tasks is enabled, task-list/task-detail navigation works, Assign Employee records a placeholder action only, and no networking or real integrations were added.