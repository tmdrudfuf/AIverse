# Quickstart: Company Growth Gameplay Loop Integration

## Focused Checks

Validation is intentionally outside this runtime. In a validation runtime, run:

```powershell
npm test -- CompanyGrowthGameplayLoopService OfficeProjectPortalController.company-influence
```

## Manual Scenario

1. Open the office project portal.
2. Load enough employees and completed work to advance company progression.
3. Open the company dashboard so progression triggers are recorded.
4. Return to the city from the office exit.
5. Confirm city world-state panels receive the matching progression world effect, reward, and feed event.
