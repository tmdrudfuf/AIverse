# Quickstart: Review Fix Request Foundation

## Focused Tests

Run the focused domain/view/controller tests during development:

```powershell
npx vitest run src/features/city-view/scene/office/review-fix-requests/ReviewFixRequestService.test.ts src/features/city-view/scene/office/review-fix-requests/ReviewFixRequestView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts
```

## Full Validation

Before independent review run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Product Flow

1. Drive a project through Reviewer Runtime completion.
2. Ensure the current Review Decision is `ChangesRequested`.
3. Invoke the explicit `Request review fixes` action.
4. Verify a `[REVIEW FIX REQUEST]` dashboard row appears.
5. Verify no Validation Runtime, Codex, Claude, subprocess, repository mutation, or GitHub mutation starts.

## Expected States

- Before reviewer completion: fix request unavailable.
- Reviewer `Approved`: fix request blocked; use Review Promotion instead.
- Reviewer `Unknown`: fix request blocked.
- Reviewer `ChangesRequested`: fix request available.
- Repeated identical request: `AlreadyRequested`, no duplicate.
- Stale chain: `Blocked`, historical request remains immutable but not current.

## Safety Checks

Confirm the resulting request has all flags false:

```text
fixExecutionStarted
validationRuntimeStarted
codexStarted
claudeStarted
subprocessStarted
validationStarted
repositoryMutationStarted
githubMutationStarted
```
