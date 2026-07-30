# Tasks: Runtime Preflight Foundation

## Phase 1: Setup

- [x] T001 Create Spec 073 documentation in `specs/073-runtime-preflight-foundation/`
- [x] T002 Update Spec Kit pointers in `.specify/feature.json` and `AGENTS.md`

## Phase 2: Domain Foundation

- [x] T003 Add Runtime Preflight domain types in `src/features/city-view/scene/office/runtime-preflight/RuntimePreflightTypes.ts`
- [x] T004 Add Runtime Preflight provider interface/default represented provider in `RuntimePreflightProvider.ts`
- [x] T005 Add Runtime Preflight service in `RuntimePreflightService.ts`
- [x] T006 Add Runtime Preflight dashboard formatter in `RuntimePreflightView.ts`

## Phase 3: Controller and Dashboard

- [x] T007 Wire runtime preflight collections into `ProjectPortalState`
- [x] T008 Wire explicit preflight action into `OfficeProjectPortalController.ts`
- [x] T009 Wire `[RUNTIME PREFLIGHT]` rows into `OfficeProjectPortalView.ts`

## Phase 4: Tests

- [x] T010 Add runtime preflight service tests
- [x] T011 Add provider boundary and unsafe command tests
- [x] T012 Add dashboard formatter tests
- [x] T013 Update controller regression coverage for explicit preflight action
- [x] T014 Update view fixtures for runtime preflight state

## Phase 5: Validation and Review

- [x] T015 Run focused runtime preflight tests and record exact file/test counts
- [x] T016 Run full validation: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`
- [x] T017 Commit the complete local implementation
- [ ] T018 Run independent Claude review against exact HEAD
- [ ] T019 Fix blocking findings, rerun validation, and repeat review until Approved
- [ ] T020 Complete the exact-HEAD provenance gate
