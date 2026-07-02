# Implementation Plan: Employee Insight System

**Branch**: `026-employee-insight-system` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/026-employee-insight-system/spec.md`

## Summary

Add a passive Employee Insight system inside the existing office scene. The system should detect the player's proximity to employee NPCs, derive a read-only insight view model from existing employee AI, simulation, schedule, task, project, workstation, movement, and progression state, and render a lightweight non-blocking overlay. The overlay must appear and disappear automatically based on distance and remain separate from existing and future dialogue behavior.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16.2.9, React 19.2.7, Phaser 3.90.0, Vitest

**Storage**: N/A. Employee Insight is runtime-only and derives from existing in-memory office state.

**Testing**: Vitest service/controller tests where deterministic state derivation is added; TypeScript validation, production build, and manual browser validation for overlay behavior.

**Target Platform**: Desktop web browser with keyboard-controlled office navigation.

**Project Type**: Web application with Phaser office scene embedded in a Next.js app.

**Performance Goals**: Insight proximity and view-model updates should run during normal office updates without visible frame drops; only one card renders at a time.

**Constraints**:

- Do not add dialogue, dialogue choices, dialogue input, or an interaction key.
- Do not block movement, office interaction prompts, or project portal behavior.
- Do not create new external AI calls or provider dependencies.
- Reuse existing employee AI, schedule, project/task, movement, workstation, and progression state.
- Keep insight derivation separate from rendering and future dialogue flow.
- Preserve existing employee movement, project/task progression, schedule, conversation, and renderer behavior.

**Scale/Scope**: One office scene, one visible insight card, nearest eligible employee inside a configurable radius.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Spec First

PASS. The feature specification exists at `specs/026-employee-insight-system/spec.md` and defines user scenarios, requirements, edge cases, assumptions, and measurable success criteria.

### II. Plan Before Code

PASS. This plan describes the technical approach before application code changes.

### III. Tasks Gate Implementation

PASS. Implementation must wait for `specs/026-employee-insight-system/tasks.md`.

### IV. Preserve Application Stability

PASS. The planned implementation is scoped to the office scene and feature-local employee insight modules. Existing Employee AI, schedule, project, movement, renderer, and conversation behavior must remain stable.

### V. Validation Is Required

PASS. The plan defines static checks, targeted tests, and manual browser validation.

## Project Structure

### Documentation (this feature)

```text
specs/026-employee-insight-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- employee-insight-ui.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- CompanyOfficeScene.ts
|-- OfficeProjectPortalController.ts
|-- employees/
|   |-- EmployeeAITypes.ts
|   |-- EmployeeAIService.ts
|   `-- EmployeeTypes.ts
|-- insight/
|   |-- EmployeeInsightConfig.ts
|   |-- EmployeeInsightTypes.ts
|   |-- EmployeeInsightService.ts
|   `-- EmployeeInsightOverlay.ts
|-- npc/
|   |-- EmployeeNpcTypes.ts
|   |-- EmployeeNpcMovementTypes.ts
|   `-- OfficeEmployeeNpcRenderer.ts
|-- schedules/
|   `-- EmployeeDailyScheduleTypes.ts
|-- tasks/
|   `-- ProjectTaskTypes.ts
`-- progression/
    `-- CompanyProgressionTypes.ts
```

**Structure Decision**: Add an `office/insight/` folder for feature-local insight types, service, config, and overlay renderer. Keep insight derivation independent from Phaser where possible, with Phaser limited to the overlay class and scene composition. Reuse `OfficeProjectPortalController` as the read-only source of composed employee/project state because it already owns the relevant office services.

## Architecture Design

### Insight Data Flow

```text
CompanyOfficeScene
  -> Founder position and office update loop
  -> OfficeProjectPortalController composed employee state
  -> EmployeeInsightService nearest target and view model
  -> EmployeeInsightOverlay screen-space card
```

### Module Responsibilities

- `EmployeeInsightConfig.ts`: configurable proximity radius and display defaults.
- `EmployeeInsightTypes.ts`: insight target, source context, view model, row, and thinking sentence types.
- `EmployeeInsightService.ts`: pure derivation of nearest employee and card view model from player position plus existing snapshots.
- `EmployeeInsightOverlay.ts`: Phaser screen-space rendering for one non-blocking card; no business rules.
- `OfficeProjectPortalController.ts`: expose read-only insight source data derived from existing employee AI, task, project, schedule, movement, workstation, and progression systems.
- `CompanyOfficeScene.ts`: compose the insight service/overlay, pass player position each update, hide insight when project portal is open, and destroy overlay cleanly.

### Non-Goals

- No dialogue, dialogue prompt, or conversation routing.
- No new employee AI state machine behavior.
- No new project/task progression logic.
- No external AI/provider calls.
- No persistence, backend endpoints, or save/load behavior.
- No broad renderer refactor.

## Validation Strategy

### Static Validation

- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

### Automated Tests

- Service tests for nearest employee selection, radius boundaries, fallback values, optional mood behavior, and deterministic Thinking sentence output.
- Controller integration tests proving insight source data composes Employee AI, schedule, project/task, movement, workstation, and progression state without mutating those systems.

### Manual Browser Validation

- Enter the office and approach an employee.
- Confirm the card appears automatically with required fields.
- Move away and confirm it disappears automatically.
- Move while the card is visible and confirm movement remains available.
- Open the project portal and confirm the insight card does not compete with the blocking portal overlay.
- Confirm no dialogue text, choices, or interaction prompt is introduced.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/employee-insight-ui.md](./contracts/employee-insight-ui.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

PASS. Design artifacts keep the feature scoped to passive office insight display, reuse existing local systems, avoid new dependencies, and define validation before implementation.

## Complexity Tracking

No constitution violations are planned.
