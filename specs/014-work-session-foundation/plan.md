# Implementation Plan: Work Session Foundation

## Summary
Add a local work-session model and provider/service boundary. Starting placeholder work creates a running placeholder WorkSession, stores it in portal state, links its activity id, and renders the latest session in Task Detail.

## Technical Context
- TypeScript Phaser project.
- ProjectTask.activityLog stores local activity entries.
- ProjectPortalState owns loaded task, employee, and now work-session state.
- No persistence or execution runtime exists.

## Architecture
- Add work-sessions folder with types, provider, mock provider, and service.
- Store sessions in ProjectPortalState.workSessions keyed by task id.
- Controller creates sessions during Start Work.
- View renders the latest selected task session only.

## Scope
In scope:
- Local WorkSession model and mock provider/service.
- Running placeholder session creation on Start Work.
- Task Detail work-session display.

Out of scope:
- AI execution, provider calls, networking, timers, background workers, save/load, React, cancellation, retry.

## Validation
- npx tsc --noEmit
- npm run build
- git diff --check
- Manual Start Work flow validation.