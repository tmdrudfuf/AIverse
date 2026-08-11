# Quickstart: Spec 086 - Approved Re-Review Promotion Execution Foundation

## Scenario

1. Start from a promoted candidate task with a completed original review.
2. Request fixes, plan fixes, run fixes, and complete validation.
3. Prepare a post-validation review target.
4. Start a post-validation re-review that completes Approved.
5. Confirm no current post-validation Review Promotion exists before Promote is pressed.
6. Press Promote once.
7. Confirm the Review Promotion and Review Promotion Result point to the post-validation reviewer runtime and review target, with all side-effect flags false.
8. Press Promote again.
9. Confirm there is still exactly one current promotion/result for that post-validation reviewer runtime and the result reports already promoted.

## Focused Validation Outside This Runtime

```powershell
npm test -- OfficeProjectPortalController.review-decision ReviewDecision
```

## Full ADOS Validation Outside This Runtime

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
