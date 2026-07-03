# Implementation Plan: Employee Knowledge System

**Branch**: `027-employee-knowledge-system` | **Date**: 2026-07-03 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/027-employee-knowledge-system/spec.md`

## Summary

Add a read-only Employee Knowledge layer that extends the existing Employee Insight target. The system should derive richer understanding data from current Employee AI, schedule, project/task, conversation, progression, movement, and insight sources, then render a lightweight non-blocking knowledge panel that explains why the selected employee is behaving that way. The first vertical slice focuses on Why, Current Goal, and Planned Next Activity without introducing dialogue, management controls, duplicated simulation state, or external AI calls.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16.2.9, React 19.2.7, Phaser 3.90.0, Vitest

**Storage**: N/A. Employee Knowledge is runtime-only and derives from existing in-memory office simulation state.

**Testing**: Vitest service/controller tests for knowledge derivation and source composition; TypeScript validation, production build, whitespace checks, and manual browser validation.

**Target Platform**: Desktop web browser with keyboard-controlled office navigation.

**Project Type**: Web application with Phaser office scene embedded in a Next.js app.

**Performance Goals**: Knowledge derivation should run during normal office updates without visible frame drops; only the current observed employee is rendered at a time.

**Constraints**:

- Extend Employee Insight instead of replacing it.
- Do not add dialogue, dialogue choices, relationship state, task assignment, schedule editing, employee control, or interaction-key requirements.
- Do not create presentation-only simulation state.
- Do not add new external AI calls or provider dependencies.
- Reuse existing Employee AI, schedule, project/task, conversation, progression, movement, and insight state.
- Keep derivation pure and rendering separate.
- Preserve existing Employee Insight, Employee AI, schedule, project/task, progression, conversation, movement, and office overlay behavior.

**Scale/Scope**: One office scene, one currently observed employee, one read-only knowledge panel that follows Employee Insight selection.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Spec First

PASS. The feature specification exists at `specs/027-employee-knowledge-system/spec.md` and defines user scenarios, requirements, edge cases, assumptions, and measurable success criteria.

### II. Plan Before Code

PASS. This plan defines the technical approach before application code changes.

### III. Tasks Gate Implementation

PASS. Implementation must wait for `specs/027-employee-knowledge-system/tasks.md`.

### IV. Preserve Application Stability

PASS. The planned implementation is scoped to a read-only extension of existing Employee Insight and office simulation state. Existing systems must remain stable.

### V. Validation Is Required

PASS. The plan defines automated tests, static validation, build validation, whitespace checks, and manual browser validation.

## Project Structure

### Documentation (this feature)

```text
specs/027-employee-knowledge-system/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- employee-knowledge-ui.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- CompanyOfficeScene.ts
|-- OfficeProjectPortalController.ts
|-- conversations/
|   `-- EmployeeConversationService.ts
|-- employees/
|   |-- EmployeeAITypes.ts
|   |-- EmployeeAIService.ts
|   |-- EmployeeSimulationTypes.ts
|   `-- EmployeeTypes.ts
|-- insight/
|   |-- EmployeeInsightConfig.ts
|   |-- EmployeeInsightTypes.ts
|   |-- EmployeeInsightService.ts
|   `-- EmployeeInsightOverlay.ts
|-- knowledge/
|   |-- EmployeeKnowledgeConfig.ts
|   |-- EmployeeKnowledgeTypes.ts
|   |-- EmployeeKnowledgeService.ts
|   `-- EmployeeKnowledgeOverlay.ts
|-- schedules/
|   `-- EmployeeDailyScheduleTypes.ts
|-- tasks/
|   `-- ProjectTaskTypes.ts
`-- progression/
    `-- CompanyProgressionTypes.ts
```

**Structure Decision**: Add an `office/knowledge/` folder for feature-local knowledge config, types, derivation service, and overlay. The knowledge service should consume the current Employee Insight source/target and any existing read-only simulation context exposed by `OfficeProjectPortalController`. Phaser-specific rendering remains in the overlay and scene composition.

## Architecture Design

### Knowledge Data Flow

```text
CompanyOfficeScene
  -> EmployeeInsightService selected target
  -> OfficeProjectPortalController read-only simulation context
  -> EmployeeKnowledgeService derived reasoning, goal, schedule, timeline
  -> EmployeeKnowledgeOverlay read-only panel
```

### Module Responsibilities

- `EmployeeKnowledgeConfig.ts`: panel defaults, timeline limits, fallback labels, and display bounds.
- `EmployeeKnowledgeTypes.ts`: source context, reasoning, goal, schedule summary, timeline item, confidence, and panel view-model types.
- `EmployeeKnowledgeService.ts`: pure derivation of Why, Current Goal, Planned Next Activity, schedule summary, recent timeline, and display rows from existing source data.
- `EmployeeKnowledgeOverlay.ts`: Phaser screen-space rendering for one read-only knowledge panel; no business rules and no input capture.
- `OfficeProjectPortalController.ts`: expose read-only knowledge source data from existing Employee AI, schedule, project/task, conversation, progression, movement, workstation, and insight context.
- `CompanyOfficeScene.ts`: compose the knowledge service and overlay beside Employee Insight, hide knowledge with blocking overlays, and destroy overlay cleanly.

### Non-Goals

- No dialogue, dialogue choices, or conversation routing.
- No memory, relationship, economy, multiplayer, save/load, or management systems.
- No employee direct-control commands.
- No new employee AI state transitions.
- No new project/task progression rules.
- No external AI/provider calls.
- No persistence or backend endpoints.
- No broad office renderer refactor.

## Validation Strategy

### Static Validation

- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

### Automated Tests

- Service tests for Why derivation, Current Goal derivation, Planned Next Activity derivation, optional confidence, missing data fallbacks, and no fake timeline/state creation.
- Controller integration tests proving knowledge source data composes Employee Insight, Employee AI, schedule, project/task, conversation, progression, movement, and workstation state without mutation.
- Regression tests proving Employee Knowledge does not call dialogue creation, alter relationship state, assign work, or replace Insight selection.

### Manual Browser Validation

- Enter the office and approach an employee.
- Confirm Employee Insight remains available and Employee Knowledge follows the same employee.
- Confirm the panel shows read-only reasoning, goal, and next activity when source data is available.
- Confirm movement remains available while the panel is visible.
- Move away and confirm knowledge hides.
- Open the project portal and confirm knowledge does not compete with the blocking overlay.
- Confirm no dialogue choices, interaction key, management controls, or direct employee-control affordance appear.

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/employee-knowledge-ui.md](./contracts/employee-knowledge-ui.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

PASS. Design artifacts keep the feature scoped to read-only Employee Knowledge, reuse existing simulation state, avoid presentation-only state duplication, preserve future extension boundaries, and define validation before implementation.

## Complexity Tracking

No constitution violations are planned.
