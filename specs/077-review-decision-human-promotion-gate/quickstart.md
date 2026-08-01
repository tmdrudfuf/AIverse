# Quickstart: Review Decision Human Promotion Gate

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/review-decision
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual Flow

1. Drive a project through the existing chain to a Completed, `Approved` Reviewer Runtime (in tests, via a directly constructed fixture — see spec.md's Assumptions and Spec 076's own "Exact-HEAD Gate" limitation, which this feature inherits unchanged).
2. Observe the `[REVIEW DECISION]` dashboard row report `Approved — Promotion Available (press P)`.
3. Press `KeyP` (Promote). Observe exactly one `ReviewPromotion` record created and the row update to `Promoted — Human Decision Recorded (no push/PR/merge/validation/mutation)`.
4. Press `KeyP` again. Observe no new record is created and no additional state changes.
5. Invalidate an upstream stage (for example, re-run an earlier stage that changes the plan) and observe the classification becomes `Stale` and a further Promote attempt against the invalidated chain blocks.

## No Real-Process Path

Unlike Specs 075/076, this feature has no real-process manual smoke test: it invokes no subprocess and requires no spawn-allow environment variable. All behavior is exercised through Vitest.
