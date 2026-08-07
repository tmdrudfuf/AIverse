# Quickstart: Review Fix Plan Foundation

## Focused Tests

Run the focused Spec 080 tests:

```powershell
npm test -- ReviewFixPlan
npm test -- OfficeActionInputController
npm test -- OfficeProjectPortalController.review-decision
```

Expected result:

- Review Fix Plan model, service, view, input, and controller tests pass.
- No test observes Codex, Claude, subprocess, Validation Runtime, repository mutation, or GitHub mutation from product code.

## Full Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Product Flow

1. Produce a current Reviewer Runtime Result with concrete `ChangesRequested`.
2. Invoke `Request review fixes` to create a current Review Fix Request.
3. Verify the dashboard shows `[REVIEW FIX REQUEST]` and no execution wording.
4. Invoke `Plan review fixes`.
5. Verify the dashboard shows `[REVIEW FIX PLAN]`, `Fix plan recorded`, and `No fix execution started`.
6. Repeat `Plan review fixes`.
7. Verify the result is idempotent and only one plan remains current.

## Stale-State Checks

- Change role context, validation commands, mutation scope, repository/worktree/branch, review result, or project selection after a request.
- Invoke `Plan review fixes`.
- Expected: blocked result, no new plan, source records unchanged.

## Safety Checks

Verify:

- Review Fix Request remains immutable.
- Review Decision and Review Promotion records remain unchanged.
- Validation Runtime does not start.
- Codex is not invoked.
- Claude is not invoked.
- No subprocess is spawned by product code.
- No validation command is executed by product code.
- No repository file is edited by product code.
- No repository or GitHub mutation occurs from product code.
