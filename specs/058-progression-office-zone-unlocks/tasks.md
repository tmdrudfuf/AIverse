# Tasks: Company Progression Office Zone Unlocks

**Input**: Design documents from `specs/058-progression-office-zone-unlocks/`
**Branch**: `codex/058-progression-office-zone-unlocks`

## Phase 1: Service layer (User Story 1 & 2 foundation)

- [X] T001 Add `OfficeZoneUnlockPreview` type to `src/features/city-view/scene/office/progression/CompanyProgressionTypes.ts`.
- [X] T002 Add `OFFICE_ZONE_LABELS` static display-label map to `src/features/city-view/scene/office/progression/CompanyProgressionService.ts`.
- [X] T003 Implement `CompanyProgressionService.getNextOfficeZoneUnlock(input)` reusing `ASCENDING_LEVELS_ABOVE_ONE`/`getProgressionSnapshot`.
- [X] T004 [P] Add unit tests in `CompanyProgressionService.test.ts`: locked-at-level-1 (Reception/Lv2), boundary-at-level-2 (Server Room/Lv3), boundary-at-level-3 (Executive Suite/Lv4), fully-unlocked-at-level-4 (`undefined`).

## Phase 2: Dashboard snapshot plumbing (User Story 1 & 2)

- [X] T005 Add `OfficeZoneProgressSummary` type and `officeZoneProgress` field to `CompanyDashboardSnapshot` in `CompanyDashboardTypes.ts`; add `"office_zones"` to `CompanyDashboardSectionId`; default it in `createEmptyCompanyDashboardSnapshot`/`createDefaultUnavailableSections`.
- [X] T006 Update `CompanyDashboardTypes.test.ts`'s default-section-count assertion (14 → 15).
- [X] T007 Add `nextOfficeZoneUnlock` context field to `InternalSimulationDashboardProviderContext`; populate `officeZoneProgress` in `getSnapshot()` from `context.companyProgression.unlockedOfficeZones.length` + `context.nextOfficeZoneUnlock`; add the `office_zones` section entry to `createSectionAvailability`.
- [X] T008 [P] Add tests in `InternalSimulationDashboardProvider.test.ts`: unavailable/empty defaults with no progression data, locked state (count + next unlock, section `available`), fully-unlocked state (no next unlock).

## Phase 3: Controller wiring (User Story 1 & 2)

- [X] T009 Extract `getCompanyProgressionInput()` private helper in `OfficeProjectPortalController.ts`; reuse it from `getCompanyProgressionSnapshot()`.
- [X] T010 Add `getNextOfficeZoneUnlock()` public controller method; pass its result as `nextOfficeZoneUnlock` in `getCompanyDashboardSnapshot()`'s provider context.
- [X] T011 [P] Add controller-level integration tests in `OfficeProjectPortalController.company-influence.test.ts`: locked state with zero employees (Reception/Lv2, count 5), unlocked-one-zone state after reaching level 2 (count 7, next Server Room/Lv3).

## Phase 4: View rendering (User Story 1 & 2)

- [X] T012 Add `officeZonesText` to `CompanyDashboardPanelRows` and `createOfficeZonesText()` formatter in `CompanyDashboardView.ts`; update the "Unavailable"/no-snapshot default row.
- [X] T013 [P] Update existing `toEqual` row-shape assertion and add locked/unlocked formatter tests in `CompanyDashboardView.test.ts`.
- [X] T014 Add the Zones row to `OfficeProjectPortalView.renderList`; shift the five rows below it down by 24px; bump `DASHBOARD_SUMMARY_Y`, `DASHBOARD_MIN_PROJECTS_PANEL_Y`, and `panelHeight`'s max accordingly.
- [X] T015 [P] Add rendered-row locked/unlocked tests in `OfficeProjectPortalView.test.ts`; fix the hardcoded `panel.height === 430` helper to `454`.

## Phase 5: Validation

- [X] T016 Focused test run per changed file/layer after each phase.
- [X] T017 Independent Codex review (`--implementer claude`); verify and fix all blocking findings; repeat to complete Approved.
- [X] T018 Final validation gate exactly once after complete Approved: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.

## Dependencies

- Phase 1 blocks Phase 2 (provider needs `OfficeZoneUnlockPreview` and the service method to exist).
- Phase 2 blocks Phase 3 (controller passes provider-shaped context).
- Phase 3 blocks Phase 4 (view renders controller-sourced dashboard snapshot data).
- T004/T008/T011/T013/T015 (marked [P]) can run in parallel with each other within their phase — they touch disjoint test files — but each depends on its phase's non-test tasks completing first.
