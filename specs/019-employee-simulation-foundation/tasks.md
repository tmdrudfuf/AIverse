# Tasks: Employee Simulation Foundation

## Phase 1: Setup
- [x] T001 Update active Spec Kit pointers for specs/019-employee-simulation-foundation in .specify/feature.json and AGENTS.md

## Phase 2: Foundation
- [x] T002 Add employee simulation models in src/features/city-view/scene/office/employees/EmployeeSimulationTypes.ts
- [x] T003 Add EmployeeSimulationService deriving snapshots from employees, tasks, and work sessions in src/features/city-view/scene/office/employees/EmployeeSimulationService.ts

## Phase 3: User Story 1 - Hidden Simulation Snapshots
- [x] T004 Extend ProjectPortalState with employeeSimulations in src/features/city-view/scene/office/OfficeProjectPortalTypes.ts
- [x] T005 Initialize employeeSimulations in src/features/city-view/scene/office/OfficeProjectPortalRegistry.ts
- [x] T006 Wire EmployeeSimulationService into src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T007 Refresh snapshots after employee load, assignment, work start, and completion in src/features/city-view/scene/office/OfficeProjectPortalController.ts
- [x] T008 Preserve existing UI by avoiding Phaser view changes in src/features/city-view/scene/office/OfficeProjectPortalView.ts

## Phase 4: Validation and Review
- [x] T009 Run npx tsc --noEmit
- [x] T010 Run npm run build
- [x] T011 Run npm run lint if available (attempted; script exits because next lint is not usable in this Next.js setup)
- [x] T012 Run git diff --check
- [x] T013 Run git diff --cached --check
- [x] T014 Review architecture checklist: derived state only, no Phaser imports, no visible UI/gameplay changes, no external calls