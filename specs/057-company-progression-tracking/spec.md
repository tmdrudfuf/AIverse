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

The service discards both values. As a result, downstream consumers never see real progression data:

1. **Office layout unlock** — `getActiveOfficeLayout()`/`getOfficeZoneSnapshots()` always resolve `layoutId: "garage-startup-level-1"`, so the resolved level never changes, no matter how the company actually grows. (Note: verified during design that the office layout's zone/position-hint data has no current renderer or spawn-logic consumer beyond `CompanyProgressionSnapshot` itself — `OfficeSpawnManager`, `EmployeeNpcPositionResolver`, `OfficeCollisionMap`, `OfficeTilemapLayer`, and `OfficeVisualLayer` reference none of `layoutId`/zone ids/`getOfficeZoneSnapshots`/`getOfficeLayoutPositionHints`. This feature does not change or risk that rendering/movement code.)
2. **Company Health label/summary text** — `InternalSimulationDashboardProvider`'s `createHealthLabel`/`createCompanySummary` read `companyProgression.companyStage`, which is rendered directly in the running app (`OfficeProjectPortalView.ts:132` — `` `[ACTIVE] ${dashboardRows.healthText}` `` — and again at `:209`/`:215` in the project dashboard view). Today this text is permanently "garageStartup is stable"; it can never change.
3. **Milestone correctness** — every milestone's `currentValue`/`isMet` is hardcoded, so even if `resolveCurrentCompanyLevel` weren't stubbed, a level's own milestones would incorrectly show as unmet forever.

## User-Visible Behavior Being Added

As the player hires employees and completes tasks in the office simulation, the company's progression now advances for real:

- The **Company Level** (and its associated stage name, max employee count, and floor count) is computed from the live employee count and completed-task count instead of being frozen at level 1.
- The Company Health label/summary text rendered in the Office Project Portal view changes as the company's `companyStage` advances (e.g. from "garageStartup is stable" toward "smallOffice is stable" once level 2 is reached) — this is the primary directly-observable, in-game text change.
- Each level's own milestones (`hire-five-employees`, `complete-first-client-project`, etc.) report real `currentValue`/`isMet` instead of a permanent `0`/`false`, both for the resolved current level and for `getFutureProgressionMetadata`'s upcoming-levels projection.

### Explicitly not changed by this feature (documented, not regressed)

- `InternalSimulationDashboardProvider`'s "Progression milestones remain" risk and `InternalSimulationProjectDashboardProvider`'s progression health signal both key off `companyProgression.requiredMilestones.some((m) => !m.isMet)`. Under the data model as it exists today, a level's own `requiredMilestones` are — by construction — the requirements that were met to *reach* that level (level 1's are `[]`; level 2+'s become `isMet: true` once resolved). So these two signals remain effectively dormant after this fix, exactly as before it: this feature makes their inputs *correct* (real evaluation instead of hardcoded placeholders) without making them newly *active*, since activating them would require re-purposing what `requiredMilestones` means (see Assumptions) or wiring in `getFutureProgressionMetadata`, both of which are deferred as follow-up scope, not this feature.
- Office zone/layout unlock has no visible or logical effect today (see note above) and continues to have none — this feature does not add a renderer for it.

## In Scope

- Rewriting `CompanyProgressionService` so `resolveCurrentCompanyLevel`, `getProgressionSnapshot`, and `getFutureProgressionMetadata` compute real milestone progress and a real current level from `CompanyProgressionInput` (`activeEmployees`, `completedProjects`).
- Defining, for each milestone, which input field it tracks (employee-hiring milestones track `activeEmployees`; project/launch milestones track `completedProjects`).
- Advancing the company level sequentially: level `N+1` is reached only once **all** of level `N+1`'s own required milestones are met; the company cannot skip a level.
- Returning, for the resolved current level, that level's **own** `requiredMilestones` evaluated with real values (unchanged semantic from the static data: these are the milestones that were required to reach this level — `[]` at level 1, real-and-met at level 2+ once resolved).
- Updating `getFutureProgressionMetadata` to accept the same input and return real, evaluated milestone data (each level's own milestones) for levels beyond the current one — this is the correct place for a "what's needed next" view, since it already exists for exactly that purpose.
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

### User Story 2 - A reached level's milestones correctly show as met (Priority: P2)

Once the company has genuinely reached a level (its milestones satisfied by real employee/task counts), `getProgressionSnapshot` reports those milestones as met with accurate `currentValue`, instead of the permanent `currentValue: 0, isMet: false` placeholder.

**Why this priority**: This is the correctness half of the fix — without it, `resolveCurrentCompanyLevel` could be fixed while `requiredMilestones` still lied about the very milestones that justified the level.

**Independent Test**: Call `getProgressionSnapshot` with inputs that satisfy level 2's milestones and confirm the returned `requiredMilestones` (level 2's own) report real `currentValue` and `isMet: true`.

**Acceptance Scenarios**:

1. **Given** `activeEmployees: 0, completedProjects: 0`, **When** `getProgressionSnapshot` is called, **Then** `requiredMilestones` is `[]` (level 1 has no unlock requirements — unchanged from today).
2. **Given** `activeEmployees: 5, completedProjects: 1` (company resolves to level 2), **When** `getProgressionSnapshot` is called, **Then** `requiredMilestones` contains `hire-five-employees` (`currentValue: 5, isMet: true`) and `complete-first-client-project` (`currentValue: 1, isMet: true`) — both real, both met.
3. **Given** the company is at the highest defined level, **When** `getProgressionSnapshot` is called, **Then** `requiredMilestones` reports that level's own milestones as met with real values (not an empty array — level 4 has defined milestones in the static data).

---

### User Story 3 - Future levels show real, evaluated progress ahead of time (Priority: P3)

`getFutureProgressionMetadata` exposes upcoming levels beyond the current one, each with real evaluated milestone progress (e.g. "3 of 5 employees hired toward level 2") instead of permanently-zero placeholders — the natural home for a "what's needed next" view, since it already exists for exactly that purpose but currently has zero callers.

**Why this priority**: Lowest priority because this method has no current caller in the codebase, but it is public API on the service and should not be left inconsistent with the rest of the fix.

**Independent Test**: Call `getFutureProgressionMetadata(input)` with partial progress and confirm every returned snapshot has `companyLevel` greater than the resolved current level, with milestones evaluated (real partial `currentValue`, correct `isMet`) against the same `input`.

**Acceptance Scenarios**:

1. **Given** `activeEmployees: 3, completedProjects: 0` (company stays at level 1), **When** `getFutureProgressionMetadata` is called, **Then** the level-2 snapshot's `hire-five-employees` milestone reports `currentValue: 3, targetValue: 5, isMet: false`, and snapshots for levels 3 and 4 are also returned with their own real evaluation.
2. **Given** the company resolves to level 2, **When** `getFutureProgressionMetadata` is called, **Then** only levels 3 and 4 are returned (level 2 is no longer "future").

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
- **FR-005**: `getProgressionSnapshot(input)`'s `requiredMilestones` MUST be that resolved level's own static milestone definitions, evaluated with real `currentValue`/`isMet` against `input` (level 1 remains `[]`, matching its existing empty static data).
- **FR-006**: `getFutureProgressionMetadata(input)` MUST return one snapshot per level strictly greater than the resolved current level, each with its own `requiredMilestones` (that level's own milestones) evaluated against the same `input`.
- **FR-007**: `getUnlockedOfficeZones(input)` and `getActiveLayoutMetadata(input)` MUST derive from the resolved current level (unchanged method signatures/behavior otherwise).
- **FR-008**: No other file requires modification for `OfficeProjectPortalController`, `InternalSimulationDashboardProvider`, and `InternalSimulationProjectDashboardProvider` to start reflecting the real `companyLevel`/`companyStage`/milestone-correctness through their existing, unmodified call sites (verified: `OfficeSpawnManager`, `EmployeeNpcPositionResolver`, `OfficeCollisionMap`, `OfficeTilemapLayer`, and `OfficeVisualLayer` — the office rendering/movement code — reference no layout/zone identifiers from this service at all, so there is no rendering blast radius to account for).
- **FR-009**: The change MUST NOT alter any currently-passing test's expectations (verified via `npm test`, not merely via source grep: no existing fixture combines 5+ employees with 1+ completed task in the same scenario, and the seeded `MockEmployeeProvider` ships only 4 employees, below the level-2 employee threshold, so default/fresh sessions are unaffected).

### Key Entities

- **CompanyProgressionSnapshot**: unchanged shape; `companyLevel`, `companyStage`, `unlockedOfficeZones`, `maxEmployees`, `requiredMilestones`, `layoutId`, `floorCount`.
- **CompanyProgressionMilestone**: unchanged shape; `milestoneId`, `label`, `description`, `isMet`, `targetValue`, `currentValue`. `isMet`/`currentValue` become computed rather than hardcoded.
- **CompanyProgressionInput**: unchanged shape; `activeEmployees`, `completedProjects` (already defined, now actually consumed), `revenue` (remains unused, out of scope).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Given the exact input the controller already produces (`activeEmployees`, completed-task count), the company reaches level 2 the first time an existing save/session has 5+ employees and 1+ completed task, without any controller change.
- **SC-002**: `npm test` (vitest) passes, including new tests covering level resolution at levels 1–4, partial progress, milestone correctness at the resolved level, and the future-levels milestone projection.
- **SC-003**: All pre-existing tests referencing `companyProgression`/`companyLevel`/`requiredMilestones` continue to pass unmodified.

## Assumptions

- The four company levels, their zone lists, `maxEmployees`, `layoutId`s, and milestone `targetValue`s are correct as currently defined and are not being redesigned by this feature — only their *evaluation* is being wired up.
- **`requiredMilestones` semantic**: a snapshot's `requiredMilestones` means "the milestones required to reach *this* level" (matching the static data exactly: level 1's are `[]`, level 2+'s are non-empty) — not "progress toward the next level." An earlier draft of this spec considered re-purposing the field to describe the *next* level while at the *current* one (motivated by the milestone `description` text, "... to unlock the next office stage"); that was rejected because it would return a `CompanyProgressionSnapshot` whose `companyLevel` and `requiredMilestones` describe two different levels, and because the same field name would then carry a different meaning depending on whether it came from `getProgressionSnapshot` or `getFutureProgressionMetadata`. The "what's needed for the next level" view is `getFutureProgressionMetadata(input)[0]` instead, which already exists for that purpose. A consequence: the dashboard "progression milestones remain" risk and the project-dashboard progression health signal (both keyed on the *current* snapshot's `requiredMilestones`) remain dormant after this fix, same as before it — see "Explicitly not changed by this feature" above.
- `completedProjects` continues to mean "count of tasks with status `Done`" as the controller currently defines it; no redefinition to mean literal completed projects is in scope.
- `EmployeeKnowledgeService`'s milestone timeline entries (`createTimelineCandidate`'s milestone branch) are driven by whatever `CompanyProgressionMilestone[]` its caller supplies as `activitySources` — tracing that caller is out of scope for this fix (no in-scope file constructs that array today), so this feature does not claim that surface starts firing.
