# Implementation Plan: Fifth Employee Recruiting Action

**Branch**: `codex/098-fifth-employee-recruiting-action` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/098-fifth-employee-recruiting-action/spec.md`

## Summary

Add a one-time recruiting action to the existing operating terminal that loads the current employee roster when needed, appends a deterministic fifth employee when the default four-person team is present, refreshes employee-derived previews and company dashboard/progression state, and reports the outcome without touching project, task, work-session, repository, runtime, or GitHub state.

## Technical Context

**Language/Version**: TypeScript with Next.js application code

**Primary Dependencies**: React, Phaser, Vitest, existing Office Project Portal services

**Storage**: In-memory portal state and existing mock employee provider

**Testing**: Vitest tests under feature source directories

**Target Platform**: Browser game UI

**Project Type**: Frontend web application/game

**Performance Goals**: Recruiting action and dashboard refresh remain immediate for the small in-memory roster

**Constraints**: No new runtime dependencies, no external network mutation, no repository mutation, no GitHub mutation, no agent runtime start, no task assignment from recruiting

**Scale/Scope**: One operating terminal action, one deterministic employee record, one latest recruiting result, and existing employee/progression/dashboard refresh paths

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` defines user stories, acceptance scenarios, edge cases, requirements, and success criteria.
- Plan Before Code: PASS. This plan identifies affected areas and validation strategy before application edits.
- Tasks Gate Implementation: PASS. `tasks.md` will be generated before code implementation.
- Preserve Application Stability: PASS. Scope is limited to employee recruiting state, controller input, terminal rendering, and targeted tests.
- Validation Is Required: PASS. Validation commands are documented in quickstart, though the ADOS handoff disallows running them from this runtime.

## Project Structure

### Documentation (this feature)

```text
specs/098-fifth-employee-recruiting-action/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── fifth-employee-recruiting-action.md
└── tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalController.fifth-employee-recruiting.test.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
├── OfficeProjectPortalView.ts
└── employees/
    ├── EmployeeRecruitmentService.ts
    └── EmployeeRecruitmentService.test.ts
```

**Structure Decision**: Use the existing office portal controller, state, employee model, and Phaser overlay view. Add a small employee recruiting service because the action has idempotency and copy semantics that should be testable outside the controller.

## Complexity Tracking

No constitution violations.
