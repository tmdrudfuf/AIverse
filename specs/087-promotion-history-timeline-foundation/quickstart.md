# Quickstart: Spec 087

## Focused Scenario

1. Open the Daily Proof project dashboard.
2. Drive a candidate task through an Approved review and press Promote.
3. Drive a post-validation re-review to Approved.
4. Confirm the historical promotion remains visible as historical.
5. Press Promote for the post-validation review.
6. Confirm the promotion history summary reports the current promotion and the historical count.
7. Press Promote again.
8. Confirm the summary reports an already-promoted current outcome and does not create a duplicate promotion.

## Focused Validation Outside This Runtime

```powershell
npm test -- OfficeProjectPortalController.review-decision
```

## Full ADOS Validation Outside This Runtime

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
