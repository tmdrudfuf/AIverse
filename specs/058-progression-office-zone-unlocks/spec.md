# Feature Specification: Company Progression Office Zone Unlocks

**Feature Branch**: `codex/058-progression-office-zone-unlocks`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Connect the real company progression introduced in Spec 057 to one small but meaningful office reward or unlock. The player must be able to observe that company growth now changes what is available in the office."

## Current Product Limitation

Spec 057 made `CompanyProgressionService.getProgressionSnapshot()` compute a real `unlockedOfficeZones: OfficeZoneType[]` list per company level (`src/features/city-view/scene/office/progression/CompanyProgressionService.ts`) — level 1 unlocks 5 zone types, level 2 adds `reception`/`storage`, level 3 adds `serverArea`, level 4 adds `executiveArea`. This is already real, level-gated data.

However, `unlockedOfficeZones` has zero renderers or consumers anywhere in the codebase beyond the snapshot itself (verified: `grep -rn "unlockedOfficeZones" src` outside the progression module and its tests returns nothing). The player has no way to observe that office zones unlock as the company grows — the underlying progression is real, but invisible.

A related static field, `OfficeLayoutZone.isUnlocked` (`src/features/city-view/scene/office/layout/OfficeLayoutTypes.ts`), was considered but rejected as the vehicle for this feature: it is hardcoded per static layout definition (always `true` for level 1's zones, always `false` for every zone in levels 2-4, regardless of company progression) and has no consumers either. It does not track cumulative unlock state across levels the way `unlockedOfficeZones` does, so wiring it up would require redefining its meaning rather than reusing an existing, already-correct progression signal.

## User-Visible Behavior Being Added

The AIverse Operating Terminal (the office project portal's main dashboard panel, `OfficeProjectPortalView.ts`) gains a new "Zones" row showing:

- How many office zones are currently unlocked (a real count from `CompanyProgressionSnapshot.unlockedOfficeZones`).
- While zones remain locked: the name of the next zone to unlock and the exact company level required (e.g. `Zones: 5 unlocked, next: Reception at Lv2`).
- Once every zone is unlocked: the count alone, with no next-unlock clause (e.g. `Zones: 9 unlocked`).

As the player hires employees and completes tasks and the company's resolved level advances (per Spec 057), this row updates automatically: the unlocked count increases and the "next" zone/level advances to the next threshold, until all 9 zone types across the 4 defined levels are unlocked.

## In Scope

- A new `CompanyProgressionService.getNextOfficeZoneUnlock(input)` method that reports the next not-yet-unlocked office zone type, its display label, and the company level at which it unlocks — derived entirely from the existing static `PROGRESSION_BY_LEVEL` data, with no new balancing/thresholds introduced.
- Threading this value from `OfficeProjectPortalController` (which already computes progression input) through `InternalSimulationDashboardProvider` into a new `CompanyDashboardSnapshot.officeZoneProgress` field.
- A new `officeZonesText` row in `CompanyDashboardView.createCompanyDashboardPanelRows` and a corresponding row in `OfficeProjectPortalView`'s main dashboard panel.
- A new `office_zones` dashboard section entry (following the existing `office_occupancy` pattern) reporting `available`/`unavailable` based on whether progression data is present.
- Automated tests for the locked state (a zone not yet unlocked, with its exact required level), the level-boundary transition (the next zone becomes correct immediately after a level is reached), and the fully-unlocked state (no next-unlock clause).

## Out of Scope

- Any change to which zones unlock at which level, or to the milestone thresholds themselves (Spec 057's `PROGRESSION_BY_LEVEL` data is unchanged).
- `OfficeLayoutZone.isUnlocked` — left as-is; not read or written by this feature.
- Any new office rendering, tilemap art, or spawn/collision logic. The office layout's zone position-hint data still has no tilemap/spawn consumer (unchanged from Spec 057's findings) and this feature does not add one.
- Real-money purchases, external APIs, cloud persistence, multiplayer sync, multi-floor architecture, or any new global state system.
- Workstation-count unlocks (`WorkstationOccupancyService`'s fixed 4-workstation simulation is a separate, hardcoded system unrelated to `CompanyProgressionService`; not touched here).
- The dashboard's `company_focus`/`companyFocus` row (company influence planning) — a separate, already-wired subsystem unrelated to office zone progression.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See the next office zone unlock while it is still locked (Priority: P1)

As the player, while the company is below the level required for a zone (e.g. still level 1), I can see in the Operating Terminal exactly which zone is next and what level unlocks it, so growth has a visible, concrete payoff.

**Why this priority**: This is the core observable behavior the feature exists to deliver — without it, progression remains invisible exactly as it was before this fix.

**Independent Test**: Render the dashboard with a `CompanyProgressionSnapshot` at level 1 (0 employees, 0 completed projects) and confirm the panel shows `Zones: 5 unlocked, next: Reception at Lv2`.

**Acceptance Scenarios**:

1. **Given** the company is at level 1 (no employees, no completed projects), **When** the Operating Terminal is rendered, **Then** the Zones row reads `Zones: 5 unlocked, next: Reception at Lv2`.
2. **Given** the company has just reached level 2 (5 employees, 1 completed project), **When** `getNextOfficeZoneUnlock` is queried, **Then** it reports the level 3 zone (`Server Room`, required level 3) — not level 2's own zones, since those are now already unlocked.

---

### User Story 2 - See the fully-unlocked state once every zone is available (Priority: P2)

As the player, once the company reaches the highest defined level, the Zones row confirms every zone is unlocked and stops suggesting a next target.

**Why this priority**: Completeness of the locked/unlocked contract — without it, the row would either error or misleadingly keep suggesting a next unlock that doesn't exist.

**Independent Test**: Render the dashboard with a level-4 `CompanyProgressionSnapshot` (20 employees, 10 completed projects) and confirm the panel shows `Zones: 9 unlocked` with no "next" clause.

**Acceptance Scenarios**:

1. **Given** the company is at level 4 (the highest defined level), **When** the Operating Terminal is rendered, **Then** the Zones row reads `Zones: 9 unlocked` with no next-unlock text.
2. **Given** the company is at level 4, **When** `getNextOfficeZoneUnlock` is queried directly, **Then** it returns `undefined`.

### Edge Cases

- No progression data at all (dashboard snapshot's `companyProgression` context field absent): `officeZoneProgress` defaults to `{ unlockedZoneCount: 0, nextUnlock: undefined }` and the `office_zones` section reports `unavailable` — consistent with how every other progression-derived dashboard field already degrades when `companyProgression` is absent.
- A level's `unlockedOfficeZones` list happens to introduce more than one new zone type at once (levels 2 and 4 in the current static data each add exactly one; this is not assumed to always hold): `getNextOfficeZoneUnlock` returns the *first* newly-appearing zone type at that level, in the order the level's static `unlockedOfficeZones` array lists it — deterministic, since the array order is fixed static data.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `CompanyProgressionService.getNextOfficeZoneUnlock(input)` MUST return the first office zone type not present in the resolved current level's `unlockedOfficeZones`, searching ascending levels above the current one, along with a human-readable label and the exact level at which it unlocks.
- **FR-002**: `getNextOfficeZoneUnlock(input)` MUST return `undefined` once the resolved current level is the highest defined level (all zones already unlocked).
- **FR-003**: The unlock decision MUST be computed once, in `CompanyProgressionService`, and only formatted (never recomputed) by the dashboard provider and view layers.
- **FR-004**: `CompanyDashboardSnapshot.officeZoneProgress.unlockedZoneCount` MUST equal `companyProgression.unlockedOfficeZones.length` when progression data is present, and `0` when absent.
- **FR-005**: The rendered Zones row MUST show the unlocked count at all times, and MUST show the next zone's label and required level only when a next unlock exists.
- **FR-006**: This change MUST NOT alter `CompanyProgressionService`'s existing level/milestone resolution behavior (Spec 057) — verified via the full existing `CompanyProgressionService.test.ts` suite continuing to pass unmodified.

### Key Entities

- **OfficeZoneUnlockPreview** (new): `{ zoneType: OfficeZoneType; label: string; requiredLevel: number }` — describes the next locked zone.
- **OfficeZoneProgressSummary** (new, on `CompanyDashboardSnapshot`): `{ unlockedZoneCount: number; nextUnlock?: OfficeZoneUnlockPreview }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given the exact progression input the controller already produces (`activeEmployees`, completed-task count), the Operating Terminal's Zones row changes automatically the first time an existing save/session crosses a level threshold, without any further wiring.
- **SC-002**: `npm test` passes, including new tests covering the locked state (with exact required level), the boundary transition immediately after a level is reached, and the fully-unlocked state.
- **SC-003**: All pre-existing tests referencing `CompanyDashboardSnapshot`, `CompanyProgressionService`, or the Operating Terminal panel layout continue to pass (updated only where they asserted exact section counts or exact panel pixel heights that mechanically shifted by this change).

## Assumptions

- The existing static `PROGRESSION_BY_LEVEL` zone-unlock data (which zone types unlock at which level) is correct and unchanged; this feature only makes it observable, per the spec's explicit preference for reusing existing progression signals over introducing new balancing.
- A short, static `OfficeZoneType -> display label` map (e.g. `reception -> "Reception"`) is owned by `CompanyProgressionService`, colocated with the existing milestone label data, rather than importing labels from `OfficeLayoutService` (which defines per-zone-instance labels, not per-zone-type labels, and is not otherwise a dependency of the progression service).
