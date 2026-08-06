# Quickstart: Review Runtime Chain Integrity Consolidation

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/review-decision
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.review-decision.test.ts
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

This spec changes no observable behavior — there is no new manual flow beyond Spec 077's own (see Spec 077's `quickstart.md`, "Manual Flow"). The only way to exercise this spec's actual change is at the test level:

1. Run `ReviewRuntimeChainIntegrityService.test.ts` directly — it calls `validateReviewRuntimeChainIntegrity` with a fully valid chain (passes) and then, one stage at a time, a chain with exactly one record's id or `rulesVersion` mutated (blocks with that stage's existing reason code).
2. Confirm the pre-existing `ReviewDecisionService.test.ts`/`OfficeProjectPortalController.review-decision.test.ts` suites — which exercise `classify`/`promote` through the dashboard/controller path — still pass unchanged, proving the extraction is behavior-preserving.

## No Real-Process Path

Same as Spec 077: this spec invokes no subprocess and requires no spawn-allow environment variable. All behavior is exercised through Vitest.
