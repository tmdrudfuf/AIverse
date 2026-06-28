# Implementation Plan: Employee Simulation Foundation

## Summary
Add a hidden employee simulation domain and service that derives read-only snapshots from existing employee, task, and work-session state. Refresh snapshots in the portal controller after employee loading, assignment, work start, and work completion without changing gameplay or rendering.

## Technical Context
- Next.js, TypeScript, Phaser project.
- OfficeProjectPortalController owns state transitions.
- Existing employee/task/work-session state remains source of truth.
- Phaser view remains presentational and unchanged.

## Constitution Check
- Spec, plan, and tasks exist before implementation.
- Controller may use EmployeeSimulationService.
- EmployeeSimulationService has no Phaser dependency.
- No external APIs, new dependencies, UI changes, NPC sprites, or gameplay changes.

## Architecture
- Add employees/EmployeeSimulationTypes.ts for states and snapshots.
- Add employees/EmployeeSimulationService.ts to derive and update snapshots from existing state.
- Extend ProjectPortalState with employeeSimulations keyed by employee id.
- Refresh hidden snapshots after employee load, assignment, work start, and task done release.
- Do not alter OfficeProjectPortalView or CompanyOfficeScene.

## Affected Files
- src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts
- src/features/city-view/scene/office/employees/EmployeeSimulationService.ts
- src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- src/features/city-view/scene/office/OfficeProjectPortalController.ts

## Validation
- npx tsc --noEmit
- npm run build
- npm run lint if available
- git diff --check
- Regression review for Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, AI task analysis, AI employee recommendation, AI project manager hidden state