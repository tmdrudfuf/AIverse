# Quickstart: Company Progression Tracking

## Automated verification

```powershell
npm test -- CompanyProgressionService
```

Expect the new `CompanyProgressionService.test.ts` suite to pass, covering:
- Level stays at 1 with no/zero input.
- Level advances to 2 once `activeEmployees >= 5` **and** `completedProjects >= 1`.
- Level does not advance if only one of a level's milestones is met.
- Level caps at the highest defined level (4) and never goes beyond it.
- `requiredMilestones` on the current snapshot reflects live progress toward the *next* level, and is empty at the max level.
- `getFutureProgressionMetadata(input)` returns only levels above the resolved current level, evaluated for real.

Then confirm no regressions in the consumers that already read this service's output:

```powershell
npm test -- OfficeProjectPortalController
npm test -- InternalSimulationDashboardProvider
npm test -- InternalSimulationProjectDashboardProvider
```

Finally, the full gate (run once, after Codex approval, per AGENTS.md/spec 055's focused-validation policy):

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Manual verification (optional, in a running dev server)

```powershell
npm run dev
```

1. Open the app, enter the company office scene.
2. Hire employees (via whatever existing in-office flow adds employees to `state.employees`) until the office has 5 employees, and complete at least 1 task (status `Done`) via the existing task/work-session flow.
3. Open the Company Dashboard (Office Project Portal → dashboard view). Confirm:
   - The health/summary panel no longer describes the company as perpetually at its starting stage.
   - The "Progression milestones remain" risk (if it was showing) clears once the level-2 milestones are satisfied, and any newly-relevant milestone (toward level 3) appears in its place.
4. Open a Project Dashboard for an active project and confirm its health status is no longer permanently gated by an unmeetable progression signal.

No new UI, no new assets — this is a data-correctness fix to an already-built display path, so the *shape* of what's on screen doesn't change, only the numbers/labels being fed into it.
