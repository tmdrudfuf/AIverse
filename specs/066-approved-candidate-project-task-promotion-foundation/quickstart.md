# Quickstart: Approved Candidate ProjectTask Promotion Foundation

## Focused Validation

```powershell
npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionTypes.test.ts
npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionService.test.ts
npx vitest run src/features/city-view/scene/office/candidate-project-task-promotions/CandidateProjectTaskPromotionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Behavior

1. Open the project dashboard for a project with synchronized issues.
2. Generate Candidate Tasks and assignment recommendations through the existing sync flow.
3. Approve a Candidate Task for promotion through the Spec 065 promotion review controls.
4. Use the explicit promote action for the selected approved Candidate Task.
5. Verify a new ProjectTask appears with:
   - `Todo` status
   - no assignee
   - no work session
   - source Candidate Task provenance
   - a promotion result saying "Promoted to project task"

## Blocked Cases

- Pending, rejected, deferred, needs-review, ineligible, or unavailable promotion decisions do not promote.
- Missing, stale, unassigned, needs-review, or unavailable assignment recommendations do not promote.
- Repeating promotion reports already promoted and does not create a duplicate ProjectTask.

## Safety Verification

- Employee state remains unchanged.
- Work sessions remain unchanged.
- GitHub issues, comments, labels, PRs, and branches are untouched.
- Codex and Claude are not invoked by the product feature.
