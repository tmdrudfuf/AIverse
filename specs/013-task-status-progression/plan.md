# Implementation Plan: Task Status Progression

## Summary
Add local-only manual task status progression to the existing Task Detail action. The controller determines the selected task action from status and assignee state, then mutates the loaded ProjectTask collection and appends activity entries.

## Technical Context
- TypeScript Phaser project.
- ProjectTask already has TaskStatus values Todo, In Progress, Review, Done.
- ProjectTask.activityLog already stores local task activity.
- Employee status lives in ProjectPortalState.employees.

## Architecture
- Controller owns task action dispatch and state transitions.
- View remains presentational and derives only the visible action label from task state.
- No new service is introduced.
- Completed tasks keep assignee history while employee status is released when no other loaded assignment exists.

## Scope
In scope:
- Assign Employee, Start Work, Move to Review, Mark Done, Completed action labels.
- status_changed activities for review and done transitions.
- Employee release to Idle on Done when appropriate.

Out of scope:
- AI execution, automation, persistence, networking, timers, save/load, React, or real completion checks.

## Validation
- npx tsc --noEmit
- npm run build
- git diff --check
- Manual portal validation of each transition and employee status behavior.