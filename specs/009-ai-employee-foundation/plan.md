# Implementation Plan: AI Employee Foundation

## Technical Approach
Add employee model/provider/service files under the office portal boundary. Use a mock provider for deterministic placeholder employees. Extend portal state with employees, selected employee index, assignment map, and employee-selection mode. Keep CompanyOfficeScene unchanged and keep the Phaser view presentational.

## Files
- src/features/city-view/scene/office/employees/EmployeeTypes.ts
- src/features/city-view/scene/office/employees/EmployeeProvider.ts
- src/features/city-view/scene/office/employees/MockEmployeeProvider.ts
- src/features/city-view/scene/office/employees/EmployeeService.ts
- src/features/city-view/scene/office/tasks/ProjectTaskTypes.ts
- OfficeProjectPortalTypes.ts
- OfficeProjectPortalRegistry.ts
- OfficeProjectPortalController.ts
- OfficeProjectPortalView.ts

## Validation
Run npx tsc --noEmit, npm run build, and git diff --check. Manually verify employee selection opens from task detail, assignment updates Assigned locally, Esc navigation works, and no real AI or network integration was added.