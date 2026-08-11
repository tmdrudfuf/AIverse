# Quickstart: Spec 085 - Approved Re-Review Promotion Eligibility Foundation

## Scenario

1. Drive Daily Proof through a ChangesRequested reviewer decision.
2. Request fixes, plan fixes, run fixes, and complete validation.
3. Prepare a post-validation review target.
4. Start a post-validation re-review that completes Approved.
5. Confirm no Review Promotion exists for the fresh reviewer runtime before Promote is pressed.
6. Press Promote.
7. Confirm the Review Promotion points to the post-validation reviewer runtime and review target, with all side-effect flags false.

## Focused Validation

Run outside this handoff runtime:

```powershell
npm test -- OfficeProjectPortalController.review-decision ReviewDecision
```

## Full ADOS Validation

Run outside this handoff runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
