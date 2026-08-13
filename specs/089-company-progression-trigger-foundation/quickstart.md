# Quickstart: Spec 089 - Company Progression Trigger Foundation

Validation is intentionally outside this runtime by ADOS handoff policy.

Focused validation command for the next validation runtime:

```powershell
npm test -- CompanyProgressionTriggerService
```

Full validation command set for the next validation runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
