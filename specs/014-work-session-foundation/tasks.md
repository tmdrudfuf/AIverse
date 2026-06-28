# Tasks: Work Session Foundation

## Implementation
- [x] Add WorkSession types.
- [x] Add WorkSessionProvider interface.
- [x] Add MockWorkSessionProvider.
- [x] Add WorkSessionService.
- [x] Extend ProjectPortalState with task-keyed workSessions and selectedWorkSessionId.
- [x] Initialize work-session state.
- [x] Instantiate WorkSessionService in OfficeProjectPortalController.
- [x] Create a running placeholder work session on Start Work.
- [x] Link work_started activity id to the created session.
- [x] Render latest work session in Task Detail.

## Validation
- [ ] Run npx tsc --noEmit.
- [ ] Run npm run build.
- [ ] Run git diff --check.
- [ ] Manually verify Start Work creates and renders a placeholder session.