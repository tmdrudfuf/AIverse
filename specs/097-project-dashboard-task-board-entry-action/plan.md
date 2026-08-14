# Implementation Plan: Project Dashboard Task Board Entry Action

**Branch**: `codex/097-project-dashboard-task-board-entry-action` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/097-project-dashboard-task-board-entry-action/spec.md`

## Summary

Add a direct Project Dashboard Active Work entry action that lets the player select a visible work item and open the existing task detail view for the same project task. The change reuses existing portal state, task collections, and task-detail rendering while keeping the Project Dashboard read-only.

## Technical Context

**Language/Version**: TypeScript with Next.js application code

**Primary Dependencies**: React, Phaser, Vitest, existing Office Project Portal services

**Storage**: In-memory portal state and existing mock task providers

**Testing**: Vitest tests under feature source directories

**Target Platform**: Browser game UI

**Project Type**: Frontend web application/game

**Performance Goals**: Input handling and row rendering remain immediate for the existing dashboard list size

**Constraints**: No new runtime dependencies, no external network mutation, no GitHub mutation, no task data mutation from the dashboard entry action

**Scale/Scope**: One Project Dashboard panel showing up to three visible Active Work rows and existing task detail navigation

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` defines user stories, edge cases, requirements, non-goals, and success criteria.
- Plan Before Code: PASS. This plan identifies affected areas and validation strategy before application edits.
- Tasks Gate Implementation: PASS. `tasks.md` will be generated before code implementation.
- Preserve Application Stability: PASS. Scope is limited to portal state, controller input, dashboard rendering, and targeted tests.
- Validation Is Required: PASS. Validation commands are documented in quickstart, though the ADOS handoff disallows running them from this runtime.

## Project Structure

### Documentation (this feature)

```text
specs/097-project-dashboard-task-board-entry-action/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── project-dashboard-task-entry.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalController.project-dashboard.test.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

**Structure Decision**: Use the existing office portal controller, state, and Phaser overlay view. No new module is needed because the behavior is an input/navigation affordance for an existing screen.

## Complexity Tracking

No constitution violations.
