# Implementation Plan: Company Progression Tracking

**Branch**: `codex/057-company-progression-tracking` | **Date**: 2026-07-26 | **Spec**: `specs/057-company-progression-tracking/spec.md`

**Input**: Feature specification from `specs/057-company-progression-tracking/spec.md`

## Summary

`CompanyProgressionService` currently ignores the real `activeEmployees`/`completedProjects` input it already receives and always reports company level 1 with every milestone permanently unmet. This plan rewrites the service (single file, plus a new test file) so the company's level and milestone progress are computed for real from that input, using the existing static per-level data (zones, `maxEmployees`, `layoutId`, milestone target values) unchanged. No other file changes are required: `OfficeProjectPortalController`, the two dashboard providers, and the knowledge overlay already consume `CompanyProgressionSnapshot` correctly and will start reflecting real data automatically.

## Technical Context

**Language/Version**: TypeScript 5.8 (strict mode, per `tsconfig`/`npx tsc --noEmit`)

**Primary Dependencies**: None new. Existing types from `./CompanyProgressionTypes` and `../layout/OfficeLayoutTypes` only.

**Storage**: N/A — in-memory, stateless computation from caller-supplied input (matches existing service design; no persistence exists or is added).

**Testing**: Vitest (`npm test` → `vitest run --passWithNoTests`), colocated `*.test.ts` files, following the existing pattern used by every other service in `src/features/city-view/scene/office/**`.

**Target Platform**: Same as the rest of the repo — runs in both the Next.js/browser Phaser scene and under Vitest in Node.

**Project Type**: Single project (existing Next.js + Phaser web app).

**Performance Goals**: N/A — pure, synchronous, allocation-light functions evaluated at most once per controller snapshot request (already called at that frequency today; no change in call frequency).

**Constraints**: Must not change the public shape of `CompanyProgressionSnapshot` or `CompanyProgressionMilestone` (downstream consumers destructure these today). Must not change `resolveCurrentCompanyLevel`/`getProgressionSnapshot` call signatures (both already accept `CompanyProgressionInput`). `getFutureProgressionMetadata` gains a required `input` parameter — acceptable because it has zero callers in the codebase today (verified via repo-wide search).

**Scale/Scope**: One service file rewritten + one new test file. No new directories, no new abstractions, no dependency injection changes (the service remains a plain class with no constructor dependencies, matching today).

## Constitution Check

*Gate: AGENTS.md "Required Workflow" and "Repository Boundaries".*

- Follows Spec → Plan → Tasks → Implement sequence (this document is Plan; Tasks follows).
- Smallest correct change: single-file rewrite of a stubbed method, not a refactor of surrounding architecture.
- Preserves existing architecture/coding style: class-based service, pure helper functions, cloned return values — matching `CompanyProgressionService`'s existing style and every sibling service (`EmployeeInsightService`, `CompanyInfluencePlanningService`) exactly.
- No unrelated refactors: `OfficeLayoutService`, controller, dashboards, and overlays are untouched.
- No external framework/architecture introduced.
- No violations requiring the Complexity Tracking table below.

## Project Structure

### Documentation (this feature)

```text
specs/057-company-progression-tracking/
├── spec.md         # Feature specification
├── plan.md         # This file
├── tasks.md        # Task breakdown (/speckit-tasks output)
└── quickstart.md   # Manual verification steps
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/progression/
├── CompanyProgressionTypes.ts        # Unchanged — types already support this feature
├── CompanyProgressionService.ts      # Rewritten: real level resolution + milestone evaluation
└── CompanyProgressionService.test.ts # New: unit tests for the above
```

No other files under `src/` are touched. Existing consumers (for reference only, not modified):

```text
src/features/city-view/scene/office/OfficeProjectPortalController.ts
src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.ts
src/features/city-view/scene/office/project-dashboard/InternalSimulationProjectDashboardProvider.ts
src/features/city-view/scene/office/knowledge/EmployeeKnowledgeService.ts
```

**Structure Decision**: Single project, single-file service change in place, following the codebase's existing "one service class per concern, colocated `*.test.ts`" convention (see `EmployeeInsightService.ts`/`.test.ts` or `CompanyInfluencePlanningService.ts` as precedent). No new directories.

## Design Notes

### Milestone metric mapping (internal to the service, no type change)

| milestoneId                  | Level | metric            | targetValue |
|-------------------------------|-------|--------------------|-------------|
| `hire-five-employees`         | 2     | `activeEmployees`   | 5           |
| `complete-first-client-project` | 2   | `completedProjects` | 1           |
| `hire-ten-employees`          | 3     | `activeEmployees`   | 10          |
| `complete-department-launch`  | 3     | `completedProjects` | 3           |
| `hire-eighteen-employees`     | 4     | `activeEmployees`   | 18          |
| `complete-headquarters-plan`  | 4     | `completedProjects` | 1           |

This mapping is expressed as a local, private constant table inside `CompanyProgressionService.ts` (not a new exported type), since it is purely an internal evaluation detail — the public `CompanyProgressionMilestone` shape is unchanged.

### Level resolution algorithm

```
resolveCurrentCompanyLevel(input):
  employees = input.activeEmployees ?? 0
  completed = input.completedProjects ?? 0
  level = 1
  for candidateLevel in [2, 3, 4] (ascending):
    milestones = evaluate(PROGRESSION_BY_LEVEL[candidateLevel].requiredMilestones, employees, completed)
    if not all(milestones are met): break
    level = candidateLevel
  return level
```

Sequential `break` on the first unmet level enforces FR-002 (no skipping).

### `requiredMilestones` on the returned snapshot

`requiredMilestones` keeps its existing static-data meaning — "the milestones required to reach *this* level" — and is simply evaluated for real instead of hardcoded:

```
getProgressionSnapshot(input):
  level = resolveCurrentCompanyLevel(input)
  base = PROGRESSION_BY_LEVEL[level]
  requiredMilestones = evaluate(base.requiredMilestones, employees, completed)
  return { ...clone(base), requiredMilestones }
```

At level 1 this is `[]` (unchanged from today, since level 1's static data has no milestones — nothing is required to start). At level 2+, once resolved, these evaluate as met (that's how the level was reached), with real `currentValue`.

Rejected alternative: rebinding this field to describe the *next* level's requirements while at the current level. Discarded per advisor review — it would return a snapshot whose `companyLevel` and `requiredMilestones` describe two different levels, and give the same field name a different meaning depending on which method returned it (see spec.md Assumptions). The "what's next" view lives in `getFutureProgressionMetadata` instead, which already exists for that purpose.

### `getFutureProgressionMetadata(input)`

Returns `evaluate`d snapshots (each with its own evaluated `requiredMilestones`, i.e. that level's own milestones — the ones that unlock it) for every level strictly greater than the resolved current level. This preserves the existing method's purpose ("what's coming up") while fixing its hardcoded-zero data, and is the sole "what's needed for the next level" surface (single consistent meaning for `requiredMilestones` across both methods).

### Verified non-risk: office layout/zone rendering

`OfficeSpawnManager.ts`, `EmployeeNpcPositionResolver.ts`, `OfficeCollisionMap.ts`, `OfficeTilemapLayer.ts`, and `OfficeVisualLayer.ts` were grepped for `layoutId`/zone identifiers/`getActiveLayout`/`getOfficeZoneSnapshots`/`getOfficeLayoutPositionHints`/`unlockedOfficeZones` — zero matches in any of them. `EmployeeAIService` reads only `context.officeLayout?.layoutId` (a display string); the `officeZones` array it also receives is unused inside that service. `WorkstationOccupancyService` never receives `companyProgression` at all (its 4-workstation cap is a pre-existing, unrelated constant, already smaller than level 1's `maxEmployees: 5` today — not something this feature introduces or worsens). Conclusion: advancing the resolved company level has no rendering, spawn, or collision blast radius to account for today.

## Complexity Tracking

*No constitution violations — table not needed.*
