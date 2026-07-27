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
- `requiredMilestones` on the current snapshot is the resolved level's own milestones (`[]` at level 1, matching today's static data), evaluated with real `currentValue`/`isMet` — met once that level is reached, not hardcoded `false`.
- `getFutureProgressionMetadata(input)` returns only levels above the resolved current level, each with real (not hardcoded-zero) evaluated milestone progress — this is the "what's needed next" view.

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
3. Open the Company Dashboard (Office Project Portal → dashboard view). Confirm the health/summary text (`[ACTIVE] Health: ...`) changes from describing `garageStartup` toward describing `smallOffice` once both thresholds are crossed — this is the primary directly observable change.
4. Note: the "Progression milestones remain" risk (Company Dashboard) and the progression health signal (Project Dashboard) are **not** expected to change behavior from this feature — both key off a level's own `requiredMilestones`, which are trivially satisfied once that level is reached (see spec.md "Explicitly not changed by this feature"). Do not treat their continued silence as a regression.

No new UI, no new assets — this is a data-correctness fix to an already-built display path, so the *shape* of what's on screen doesn't change, only the numbers/labels being fed into it.
