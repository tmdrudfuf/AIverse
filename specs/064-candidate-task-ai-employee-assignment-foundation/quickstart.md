# Quickstart: Candidate Task AI Employee Assignment Foundation

## Focused capability tests

```powershell
npx vitest run src/features/city-view/scene/office/candidate-assignments/EmployeeCapabilityProfile.test.ts
```

Expected:

- employee roles and existing capability strings map into provider-neutral capabilities
- unknown roles/capabilities are safe
- capability arrays are copied and contain no duplicates

## Focused matcher and service tests

```powershell
npx vitest run `
  src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentMatcher.test.ts `
  src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentService.test.ts
```

Expected:

- Bug, Feature, Documentation, Maintenance, Research, and Unknown Candidate Tasks produce documented recommendations
- unavailable and busy employees are ranked below equally capable available employees
- no employee and no match states are explicit
- closed Candidate Tasks are not recommended to employees
- repeated mapping produces stable identifiers

## Controller and dashboard tests

```powershell
npx vitest run `
  src/features/city-view/scene/office/candidate-assignments/CandidateAssignmentView.test.ts `
  src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts `
  src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

Expected:

- recommendations use existing Candidate Task results and existing employee state
- no GitHub request is made for assignment recommendations
- no ProjectTask, employee, or work-session state is mutated
- dashboard rows show `[ASSIGNMENT RECOMMENDATIONS]` separately from `[ISSUES]` and `[CANDIDATE TASKS]`
- assignment rows are dropped before Candidate Task and issue detail rows when space is limited

## Full validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual safety checks

- Confirm `state.taskCollections` is unchanged by recommendation generation.
- Confirm `state.employees` is unchanged by recommendation generation.
- Confirm `state.workSessions` is unchanged by recommendation generation.
- Confirm no push, PR creation, merge, GitHub mutation, issue mutation, or repository mutation occurs.
