# Feature Specification: Company Progression Tracking

**Feature Branch**: `codex/057-company-progression-tracking`

**Created**: 2026-07-26

**Status**: Draft

**Input**: User description: "Select, specify, implement, review, and validate one small but meaningful real AIverse product improvement under `src/`. First Spec to use the completed agent workflow on a real product feature rather than continuing to modify the agent-workflow tooling itself."

## Current Product Limitation

`CompanyProgressionService` (`src/features/city-view/scene/office/progression/CompanyProgressionService.ts`) is permanently stubbed:

- `resolveCurrentCompanyLevel()` ignores its input entirely and always returns `1` (`CURRENT_COMPANY_LEVEL`).
- Every progression milestone (`hire-five-employees`, `complete-first-client-project`, etc.) is constructed with `currentValue: 0` and therefore `isMet: false`, regardless of how many employees exist or how much work has been completed.

This is not a hypothetical gap: `OfficeProjectPortalController.getCompanyProgressionSnapshot()` (`src/features/city-view/scene/office/OfficeProjectPortalController.ts:246-250`) already computes and passes the real signals every time it asks for a snapshot:

```ts
this.companyProgressionService.getProgressionSnapshot({
  activeEmployees: this.state.employees.length,
  completedProjects: getAllLoadedTasks(this.state.taskCollections).filter((task) => task.status === "Done").length,
});
```

The service discards both values. As a result, three already-wired downstream consumers never see real progression data and are effectively dead code today:

1. **Office layout unlock** — `getActiveOfficeLayout()`/`getOfficeZoneSnapshots()` always resolve `layoutId: "garage-startup-level-1"`, so the office can never grow past 5 max employees or unlock reception/storage/server/executive zones, no matter how the company actually grows.
2. **Company Dashboard risk signal** — `InternalSimulationDashboardProvider.createRisks()` (`.../dashboard/InternalSimulationDashboardProvider.ts:466-474`) adds a "Progression milestones remain" risk whenever `companyProgression.requiredMilestones.some((m) => !m.isMet)`. Because milestones never become real, this signal's *content* is currently disconnected from actual play.
3. **Project Dashboard health status** — `InternalSimulationProjectDashboardProvider.createProgressionHealthSignals()` (`.../project-dashboard/InternalSimulationProjectDashboardProvider.ts:318-324`) is meant to flag a project as "should be watched" while progression milestones are open, using the same dead data.

## User-Visible Behavior Being Added

As the player hires employees and completes tasks in the office simulation, the company's progression now advances for real:

- The **Company Level** (and its associated stage name, unlocked office zones, max employee count, and floor count) is computed from the live employee count and completed-task count instead of being frozen at level 1.
- The active office layout (`getActiveOfficeLayout`, `getOfficeZoneSnapshots`, `getOfficeLayoutPositionHints`) reflects the resolved level, so newly-unlocked zones (reception, storage, server area, executive area) become part of the office's logical layout as the company grows.
- The Company Dashboard's "Company Health" section and "Progression milestones remain" risk signal reflect real, live milestone progress (e.g. "hire five employees" shows real progress toward 5 once employees are hired, and stops appearing once satisfied).
- The Project Dashboard's health status genuinely reflects open progression milestones instead of a value that can never change.
- `EmployeeKnowledgeService`'s milestone timeline entries (`src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts`, `createTimelineCandidate` milestone branch) can now actually fire, since a milestone can become `isMet: true`.

## In Scope

- Rewriting `CompanyProgressionService` so `resolveCurrentCompanyLevel`, `getProgressionSnapshot`, and `getFutureProgressionMetadata` compute real milestone progress and a real current level from `CompanyProgressionInput` (`activeEmployees`, `completedProjects`).
- Defining, for each milestone, which input field it tracks (employee-hiring milestones track `activeEmployees`; project/launch milestones track `completedProjects`).
- Advancing the company level sequentially: level `N+1` is reached only once **all** of level `N+1`'s required milestones are met; the company cannot skip a level.
- Returning, for the resolved current level, `requiredMilestones` describing live progress toward the **next** level (matching the existing milestone `description` text: "... to unlock the next office stage"), evaluated with real values. At the highest defined level, `requiredMilestones` is empty (nothing further defined to unlock).
- Updating `getFutureProgressionMetadata` to accept the same input and return real, evaluated milestone data for levels beyond the current one.
- Adding automated tests for the new logic (no test file exists for this service today).

## Out of Scope

- Any change to `OfficeProjectPortalController`, `OfficeLayoutService`, the dashboard providers, or the knowledge/insight overlays. All of these already consume `CompanyProgressionSnapshot` correctly; they need no changes to start receiving real data.
- Visual/tilemap rendering changes. `OfficeLayoutService`'s zones are logical position-hint data (already fully defined for all 4 levels), not distinct tilemap art; this feature does not add or change any art assets.
- Adding a `revenue`-based milestone metric (the `CompanyProgressionInput.revenue` field exists but no current milestone uses it; introducing one is unrelated new scope).
- Renaming the `completedProjects` input field or reconciling it with actual "project" completion vs. "task" completion — the controller already defines what it passes; this feature reads that value as-is.
- Any change to how many company levels exist or their zone/layout contents.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Company levels up as it grows (Priority: P1)

As the player hires employees and completes tasks, the company's simulated level advances instead of staying at level 1 forever, unlocking more office zones and a higher employee cap.

**Why this priority**: This is the core, directly observable behavior change and the reason the other two stories have anything to display.

**Independent Test**: Call `CompanyProgressionService.getProgressionSnapshot({ activeEmployees, completedProjects })` with values crossing a milestone threshold (e.g. 5 employees, 1 completed project) and confirm `companyLevel`, `unlockedOfficeZones`, `maxEmployees`, and `layoutId` change to the level-2 values.

**Acceptance Scenarios**:

1. **Given** `activeEmployees: 0, completedProjects: 0`, **When** `getProgressionSnapshot` is called, **Then** the snapshot reports `companyLevel: 1` with the garage-startup zones/layout.
2. **Given** `activeEmployees: 5, completedProjects: 1`, **When** `getProgressionSnapshot` is called, **Then** the snapshot reports `companyLevel: 2` with the small-office zones/layout and `maxEmployees: 10`.
3. **Given** `activeEmployees: 20, completedProjects: 10`, **When** `getProgressionSnapshot` is called, **Then** the snapshot reports the highest defined level (`companyLevel: 4`), never a level beyond what is defined.
4. **Given** `activeEmployees: 6, completedProjects: 0` (employee threshold met, task threshold not met), **When** `getProgressionSnapshot` is called, **Then** the snapshot stays at `companyLevel: 1` (a level requires **all** of its milestones met, not just one).

---

### User Story 2 - Real milestone progress is visible (Priority: P2)

As the player watches the Company Dashboard or Project Dashboard, milestone progress (e.g. "3 of 5 employees hired") reflects the real state of the company, and the "progression milestones remain" signal appears only while genuinely incomplete.

**Why this priority**: This is what makes the level change legible to the player rather than a silent internal number; it directly re-activates the two dashboard consumers described in the Current Product Limitation section.

**Independent Test**: Call `getProgressionSnapshot` with partial progress (e.g. 3 of 5 employees) and confirm the returned milestone's `currentValue`/`isMet` reflect that exact partial state; feed that snapshot into the existing (unmodified) `InternalSimulationDashboardProvider`/`InternalSimulationProjectDashboardProvider` and confirm their existing risk/health logic now activates correctly.

**Acceptance Scenarios**:

1. **Given** `activeEmployees: 3, completedProjects: 0`, **When** `getProgressionSnapshot` is called at level 1, **Then** `requiredMilestones` includes the "hire five employees" milestone with `currentValue: 3`, `targetValue: 5`, `isMet: false`.
2. **Given** a snapshot where all of level 2's milestones are met, **When** the company is now at level 2, **Then** `requiredMilestones` on that snapshot describes progress toward level 3 (not the already-met level-2 milestones).
3. **Given** the company is at the highest defined level, **When** `getProgressionSnapshot` is called, **Then** `requiredMilestones` is an empty array.

---

### User Story 3 - Future levels stay visible ahead of time (Priority: P3)

`getFutureProgressionMetadata` continues to expose upcoming levels beyond the current one, now with real evaluated milestone progress instead of permanently-zero placeholders.

**Why this priority**: Lowest priority because this method has no current caller in the codebase, but it is public API on the service and should not be left inconsistent with the rest of the fix.

**Independent Test**: Call `getFutureProgressionMetadata(input)` and confirm every returned snapshot has `companyLevel` greater than the resolved current level, with milestones evaluated against the same `input`.

**Acceptance Scenarios**:

1. **Given** the company is at level 1, **When** `getFutureProgressionMetadata` is called, **Then** it returns snapshots for levels 2, 3, and 4, each with milestones evaluated against the real input (not hardcoded zeros).

### Edge Cases

- No input provided at all (`getProgressionSnapshot()` / `{}`): treated as `activeEmployees: 0, completedProjects: 0`, resolving to level 1, matching today's zero-employee default behavior.
- A milestone metric value is exactly equal to its `targetValue`: `isMet` must be `true` (met, not "almost met").
- `activeEmployees`/`completedProjects` regress (e.g. an employee leaves after the company reached level 2): the current implementation of `resolveCurrentCompanyLevel` is a pure function of the latest input and does not persist a "highest level ever reached" — the company can show a *lower* level again if inputs drop below a threshold. This is documented, intentional, and consistent with the service being stateless today (no existing state persistence exists for company level).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: `CompanyProgressionService.resolveCurrentCompanyLevel(input)` MUST compute the company's level from `input.activeEmployees` and `input.completedProjects`, defaulting missing values to `0`.
- **FR-002**: The company MUST advance to level `N+1` only when **all** required milestones defined for level `N+1` are met by the current input; it MUST NOT skip an intermediate level.
- **FR-003**: Each milestone MUST track exactly one of `activeEmployees` or `completedProjects`, matching its existing target values (5/10/18 employees; 1/3/1 completed projects for levels 2/3/4 respectively).
- **FR-004**: `getProgressionSnapshot(input)` MUST return the snapshot for the resolved current level with `unlockedOfficeZones`, `maxEmployees`, `layoutId`, `floorCount`, and `companyStage` matching that level's existing static data (unchanged from today).
- **FR-005**: `getProgressionSnapshot(input)`'s `requiredMilestones` MUST describe live, evaluated progress toward the **next** level (using that next level's static milestone definitions), or be an empty array if no further level is defined.
- **FR-006**: `getFutureProgressionMetadata(input)` MUST return one snapshot per level strictly greater than the resolved current level, each with its own `requiredMilestones` evaluated against the same `input`.
- **FR-007**: `getUnlockedOfficeZones(input)` and `getActiveLayoutMetadata(input)` MUST derive from the resolved current level (unchanged method signatures/behavior otherwise).
- **FR-008**: No other file may require modification for these consumers to receive real data: `OfficeProjectPortalController`, `InternalSimulationDashboardProvider`, `InternalSimulationProjectDashboardProvider`, and `EmployeeKnowledgeService` must start reflecting real progression through their existing, unmodified call sites.
- **FR-009**: The change MUST NOT alter any currently-passing test's expectations (verified: no existing fixture combines 5+ employees with 1+ completed task in the same scenario).

### Key Entities

- **CompanyProgressionSnapshot**: unchanged shape; `companyLevel`, `companyStage`, `unlockedOfficeZones`, `maxEmployees`, `requiredMilestones`, `layoutId`, `floorCount`.
- **CompanyProgressionMilestone**: unchanged shape; `milestoneId`, `label`, `description`, `isMet`, `targetValue`, `currentValue`. `isMet`/`currentValue` become computed rather than hardcoded.
- **CompanyProgressionInput**: unchanged shape; `activeEmployees`, `completedProjects` (already defined, now actually consumed), `revenue` (remains unused, out of scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given the exact input the controller already produces (`activeEmployees`, completed-task count), the company reaches level 2 the first time an existing save/session has 5+ employees and 1+ completed task, without any controller change.
- **SC-002**: `npm test` (vitest) passes, including new tests covering level resolution at levels 1–4, partial progress, and the next-level milestone projection.
- **SC-003**: All pre-existing tests referencing `companyProgression`/`companyLevel`/`requiredMilestones` continue to pass unmodified.

## Assumptions

- The four company levels, their zone lists, `maxEmployees`, `layoutId`s, and milestone `targetValue`s are correct as currently defined and are not being redesigned by this feature — only their *evaluation* is being wired up.
- "Progress toward the next level" (rather than "milestones already met to reach the current level") is the intended semantic for `requiredMilestones` on the current snapshot, based on the existing milestone `description` text ("... to unlock the next office stage") and on this being the only interpretation under which the two existing dashboard consumers (`createRisks`, `createProgressionHealthSignals`) can ever produce a non-trivial signal.
- `completedProjects` continues to mean "count of tasks with status `Done`" as the controller currently defines it; no redefinition to mean literal completed projects is in scope.
