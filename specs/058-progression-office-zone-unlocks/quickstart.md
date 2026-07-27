# Quickstart: Company Progression Office Zone Unlocks

## What this feature adds

A "Zones" row in the AIverse Operating Terminal (the office project portal's main dashboard panel) that shows how many office zones the company has unlocked and, while locked zones remain, which zone unlocks next and at what company level.

## Manual verification (in the running app)

1. Start a fresh office simulation session (no employees hired, no tasks completed). Open the Operating Terminal (office project portal, list view).
2. In the right-hand column, below the "Office: N occupied, M open" row, confirm a new row reads:
   `Zones: 5 unlocked, next: Reception at Lv2`
3. Hire employees and complete tasks until the company reaches level 2 (5 active employees, 1 completed project — matching Spec 057's level-2 thresholds). Reopen or re-render the Operating Terminal.
4. Confirm the row now reads:
   `Zones: 7 unlocked, next: Server Room at Lv3`
   (level 2 adds `reception` and `storage`, bringing the unlocked count from 5 to 7.)
5. Continue advancing the company to level 4 (18+ employees, 3+ completed projects, matching Spec 057's thresholds). Confirm the row reads:
   `Zones: 9 unlocked`
   with no "next" clause — every zone type is unlocked.

## Programmatic verification (unit level)

```ts
import { CompanyProgressionService } from "src/features/city-view/scene/office/progression/CompanyProgressionService";

const service = new CompanyProgressionService();

// Locked state
service.getNextOfficeZoneUnlock({ activeEmployees: 0, completedProjects: 0 });
// => { zoneType: "reception", label: "Reception", requiredLevel: 2 }

// Boundary: exactly at level 2's thresholds
service.getNextOfficeZoneUnlock({ activeEmployees: 5, completedProjects: 1 });
// => { zoneType: "serverArea", label: "Server Room", requiredLevel: 3 }

// Fully unlocked: highest defined level
service.getNextOfficeZoneUnlock({ activeEmployees: 20, completedProjects: 10 });
// => undefined
```

## Test suites covering this feature

```powershell
npx vitest run src/features/city-view/scene/office/progression/CompanyProgressionService.test.ts
npx vitest run src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts
npx vitest run src/features/city-view/scene/office/dashboard/CompanyDashboardView.test.ts
npx vitest run src/features/city-view/scene/office/dashboard/CompanyDashboardTypes.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.company-influence.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Out of scope reminders

- No milestone thresholds or zone-unlock assignments changed — same data Spec 057 already defined.
- `OfficeLayoutZone.isUnlocked` is untouched (a separate, unrelated static field with no consumers).
- No tilemap/spawn/collision rendering added — office zones remain logical, position-hint data only, exactly as after Spec 057.
