# Implementation Plan: Company Progression Office Zone Unlocks

**Branch**: `codex/058-progression-office-zone-unlocks` | **Date**: 2026-07-27 | **Spec**: `specs/058-progression-office-zone-unlocks/spec.md`

**Input**: Feature specification from `specs/058-progression-office-zone-unlocks/spec.md`

## Summary

Spec 057 made `CompanyProgressionService`'s `unlockedOfficeZones` real and level-gated, but nothing renders it. This plan adds one small, read-only query method to `CompanyProgressionService` (`getNextOfficeZoneUnlock`), threads its result through the existing controller → dashboard-provider → dashboard-view → Phaser-view chain (each layer already exists and already threads `companyProgression` the same way), and adds one new row to the Operating Terminal panel. No progression logic changes; no new services, no new abstractions.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict mode, per `tsconfig`/`npx tsc --noEmit`)

**Primary Dependencies**: None new. Reuses `OfficeZoneType` (`../layout/OfficeLayoutTypes`) already imported by `CompanyProgressionService`.

**Storage**: N/A — pure, synchronous, stateless computation from the same `CompanyProgressionInput` the controller already builds each call (matches Spec 057's design).

**Testing**: Vitest, colocated `*.test.ts` files, following the existing pattern at every layer touched (service, provider, view-row formatter, Phaser view, controller integration).

**Target Platform**: Same as the rest of the repo (Next.js + Phaser scene, tested under Vitest/Node).

**Project Type**: Single project (existing Next.js + Phaser web app).

**Performance Goals**: N/A — `getNextOfficeZoneUnlock` is O(levels × zones-per-level) ≈ O(12) worst case, called once per dashboard snapshot request (same frequency `getProgressionSnapshot` is already called at).

**Constraints**: Must not change `CompanyProgressionSnapshot`, `CompanyProgressionMilestone`, or any existing method signature on `CompanyProgressionService` (Spec 057's public contract is preserved). Must not duplicate the unlock decision in the view layer (`OfficeProjectPortalView`/`CompanyDashboardView` may only format an already-computed value). The Phaser panel is pixel-positioned; adding a row requires shifting existing rows down by a fixed offset rather than overlapping them — verified safe by inspecting `OfficeProjectPortalView.test.ts`, which asserts row content/relative ordering, not hardcoded absolute Y positions (one exception: a single hardcoded `panel.height === 430` assertion, updated to `454` to match the panel's height growing to fit the new row).

**Scale/Scope**: One new service method + one new static label map (in `CompanyProgressionService.ts`), one new type (`OfficeZoneUnlockPreview`, in `CompanyProgressionTypes.ts`), one new controller method + a small input-building refactor (`OfficeProjectPortalController.ts`), one new optional context field + snapshot field + section entry (`InternalSimulationDashboardProvider.ts`, `CompanyDashboardTypes.ts`), one new formatted row (`CompanyDashboardView.ts`), one new rendered row + a uniform 24px downward shift of five existing rows (`OfficeProjectPortalView.ts`). No new files except tests.

## Constitution Check

*Gate: AGENTS.md "Required Workflow" and "Repository Boundaries".*

- Follows Spec → Plan → Tasks → Implement sequence (this document is Plan; Tasks follows).
- Smallest correct change: reuses Spec 057's already-real `unlockedOfficeZones` instead of introducing new progression math; the only new domain logic is a 12-line "find the first not-yet-unlocked zone" query over existing static data.
- Preserves existing architecture: unlock decision lives in the service layer (`CompanyProgressionService`); controller passes it through context exactly as it already does for `companyProgression`; provider/view layers only format, never recompute.
- No unrelated refactors: the one small refactor (`getCompanyProgressionInput()` extraction in the controller) exists solely to avoid duplicating the `{ activeEmployees, completedProjects }` construction between the two calls this feature adds a second consumer of.
- No new ECS/engine abstraction, no global mutable state, no new framework.
- No violations requiring the Complexity Tracking table below.

## Project Structure

### Documentation (this feature)

```text
specs/058-progression-office-zone-unlocks/
├── spec.md         # Feature specification
├── plan.md         # This file
├── tasks.md        # Task breakdown
└── quickstart.md   # Manual verification steps
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/progression/
├── CompanyProgressionTypes.ts        # + OfficeZoneUnlockPreview type
├── CompanyProgressionService.ts      # + OFFICE_ZONE_LABELS, getNextOfficeZoneUnlock()
└── CompanyProgressionService.test.ts # + locked/boundary/unlocked coverage

src/features/city-view/scene/office/dashboard/
├── CompanyDashboardTypes.ts                    # + OfficeZoneProgressSummary, "office_zones" section id
├── CompanyDashboardTypes.test.ts               # updated default-section-count assertion
├── InternalSimulationDashboardProvider.ts      # + nextOfficeZoneUnlock context field, officeZoneProgress snapshot field, office_zones section
├── InternalSimulationDashboardProvider.test.ts # + locked/unlocked officeZoneProgress coverage
├── CompanyDashboardView.ts                     # + officeZonesText row formatter
└── CompanyDashboardView.test.ts                # + locked/unlocked officeZonesText coverage

src/features/city-view/scene/office/
├── OfficeProjectPortalController.ts                       # + getNextOfficeZoneUnlock(), getCompanyProgressionInput() helper
├── OfficeProjectPortalController.company-influence.test.ts # + controller-level locked/unlocked integration coverage
├── OfficeProjectPortalView.ts                              # + Zones row, panel height/offset constants bumped
└── OfficeProjectPortalView.test.ts                         # + rendered-row locked/unlocked coverage; panel-height constant updated
```

No changes to `OfficeLayoutService`, `WorkstationOccupancyService`, `InternalSimulationProjectDashboardProvider`, or any rendering/spawn/collision file — none of them consume `unlockedOfficeZones` or the new fields.

**Structure Decision**: Single project; extends four existing files at their natural layer boundaries (service → controller → provider → view), following the exact pattern `companyProgression` itself already uses end-to-end. No new directories, no new service classes.

## Design Notes

### `getNextOfficeZoneUnlock` algorithm

```
getNextOfficeZoneUnlock(input):
  currentLevel = resolveCurrentCompanyLevel(input)
  unlocked = new Set(getProgressionSnapshot(input).unlockedOfficeZones)
  for level in ASCENDING_LEVELS_ABOVE_ONE:   # [2, 3, 4]
    if level <= currentLevel: continue
    zoneType = PROGRESSION_BY_LEVEL[level].unlockedOfficeZones.find(z => !unlocked.has(z))
    if zoneType: return { zoneType, label: OFFICE_ZONE_LABELS[zoneType], requiredLevel: level }
  return undefined
```

Reuses `ASCENDING_LEVELS_ABOVE_ONE` and `getProgressionSnapshot`, both already defined by Spec 057 — no duplicated level-resolution logic.

### Why a new `OFFICE_ZONE_LABELS` map instead of reusing `OfficeLayoutService`'s labels

`OfficeLayoutService`'s `zone()` helper labels are per zone *instance* (e.g. `"small-office-reception"` → `"Reception"`), not per zone *type*, and `OfficeLayoutService` is not (and should not become) a dependency of `CompanyProgressionService` — the progression service has no current knowledge of specific layouts, only zone *types*. A small static `Record<OfficeZoneType, string>` colocated with the existing milestone label strings in the same file is the smallest correct option and matches the file's existing style (milestones already carry inline display labels the same way).

### Threading the value through existing layers (no new dependency wiring)

`OfficeProjectPortalController` already owns a `CompanyProgressionService` instance and already calls it once per `getCompanyDashboardSnapshot()`/`getCompanyProgressionSnapshot()` invocation to build `{ activeEmployees, completedProjects }`. This plan extracts that object-construction into a private `getCompanyProgressionInput()` so the new `getNextOfficeZoneUnlock()` controller method can reuse it without duplicating the two-line input construction (and risking the two call sites drifting if the input calculation ever changes). The result is passed into the dashboard provider's context object exactly like `companyProgression` already is (`nextOfficeZoneUnlock: this.getNextOfficeZoneUnlock()`), consistent with the file's existing pattern of passing pre-computed values into `getSnapshot()` rather than giving the provider its own service dependency.

### Provider: presentation-only

`InternalSimulationDashboardProvider.getSnapshot()` derives `officeZoneProgress.unlockedZoneCount` directly from `context.companyProgression.unlockedOfficeZones.length` (already-real data) and passes `context.nextOfficeZoneUnlock` straight through — it performs no unlock computation itself, only reads two already-computed values into the snapshot shape. This keeps FR-003 (decision lives in the service, not the view/provider) satisfied.

### Panel layout change (`OfficeProjectPortalView.ts`)

The Operating Terminal panel is pixel-positioned (`addText(x, y, ...)` calls against a fixed-height background rectangle). Inserting the Zones row without overlap requires:

1. A new row at `panelX + 360, panelY + 172` (24px below the existing `occupancyText` row at 148) — right column, matching the office-data grouping already used for `projectText`/`workloadText`/`occupancyText`.
2. Shifting the five rows from `panelY + 176` onward down by a uniform 24px (`DASHBOARD_ROW_GAP`): bottleneck/risk (`176→200`), productivity (`200→224`), focus (`224→248`), and the `DASHBOARD_SUMMARY_Y` constant (`248→272`).
3. Bumping `DASHBOARD_MIN_PROJECTS_PANEL_Y` (`316→340`) and the panel's max height (`430→454`) by the same 24px so the projects list and background panel still fit below the taller dashboard block — both already computed dynamically from these constants, so no other line changes.

This was verified low-risk by reading `OfficeProjectPortalView.test.ts` first: its assertions check rendered text content and *relative* row ordering (e.g. "source row is below summary row", "projects panel is below source row"), not hardcoded absolute Y values — with one exception, a single `panel.height === 430` literal in a test helper, updated to `454`.

### Verified non-risk: no other renderer touches these fields

`grep -rn "unlockedOfficeZones"` outside the progression module, this feature's new code, and tests returns no matches — confirming (as Spec 057 already established for the underlying data) that no tilemap, spawn, or collision code reads office zone unlock state.

## Complexity Tracking

*No constitution violations — table not needed.*
