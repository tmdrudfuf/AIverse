# Implementation Plan: Employee Work Simulation Placeholder

## Summary
Add a local-only placeholder work action to Task Detail. The existing two-state task action will open employee selection for unassigned tasks and record work-started activity for assigned tasks.

## Technical Context
- TypeScript Phaser project.
- Task state is held in ProjectPortalState taskCollections.
- Task activity lives directly on ProjectTask.activityLog.
- Employees are loaded through the existing mock EmployeeService and stored in portal state.

## Architecture
- Extend TaskActivityType with work_started.
- Add OfficeProjectPortalController.startPlaceholderWorkOnSelectedTask().
- Keep all updates local to the loaded TaskCollection.
- Reuse Task Detail rendering and activity log display.

## Scope
In scope:
- Local activity entry creation.
- Todo to In Progress status transition.
- Dynamic Task Detail action text.

Out of scope:
- Real AI execution, API calls, automation, timers, persistence, notifications, React, completion, or progress.

## Validation
- npx tsc --noEmit
- npm run build
- git diff --check
- Manual portal flow: assign employee, start placeholder work, verify activity and status.