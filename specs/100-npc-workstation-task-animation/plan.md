# Implementation Plan: Spec 100 - NPC Workstation Task Animation

**Branch**: `codex/100-npc-workstation-task-animation` | **Date**: 2026-08-14 | **Spec**: `specs/100-npc-workstation-task-animation/spec.md`

**Input**: Feature specification from `/specs/100-npc-workstation-task-animation/spec.md`

## Summary

Extend existing office employee NPC view models with a read-only workstation work-animation state and render a lightweight animated indicator for employees who are actively working after arriving at a workstation. Keep inactive, assigned-only, unavailable, and moving employees static, and preserve existing labels, movement interpolation, overlays, portal behavior, and progression visuals.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `EmployeeSimulationSnapshot`, `EmployeeNpcMovementSnapshot`, `EmployeeNpcViewModel`, `OfficeProjectPortalController.getEmployeeNpcViewModelsWithMovement()`, and `OfficeEmployeeNpcRenderer`

**Storage**: in-memory scene display state only

**Testing**: focused Vitest coverage for work-animation derivation and renderer clearing behavior; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(number of visible employees), with no new per-frame allocations beyond existing render refresh scale

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing office NPC placeholders and active task state only; no persistence, new art files, sound, controls, runtime execution, review automation, validation execution, or GitHub integration changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to NPC work-animation derivation and rendering.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/100-npc-workstation-task-animation/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- npc-workstation-task-animation.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.npc-work-animation.test.ts
`-- npc/
    |-- EmployeeNpcTypes.ts
    |-- OfficeEmployeeNpcRenderer.ts
    `-- OfficeEmployeeNpcRenderer.test.ts
```

**Structure Decision**: Keep the animation state on the existing NPC view model and render it in the existing renderer so the feature follows current office NPC ownership and avoids new scene controllers.

## Design

`EmployeeNpcViewModel` gains optional `workAnimation` display state. `OfficeProjectPortalController.getEmployeeNpcViewModelsWithMovement()` derives it from current employee simulation state, current task, and movement snapshot. It is active only when the employee is `working`, the target position is `workstation`, and the movement state has arrived.

`OfficeEmployeeNpcRenderer` adds a small indicator attached to each NPC container. It updates the indicator for active work-animation view models and hides it for inactive states. The animation is generated from scene time plus the employee id, keeping visuals deterministic and bounded.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- npc-work-animation OfficeEmployeeNpcRenderer
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
