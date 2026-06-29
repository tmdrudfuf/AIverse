# Implementation Plan: Office NPC Foundation

## Summary
Design a small office NPC rendering foundation that consumes Phase 25 employee simulation snapshots and turns them into Phaser-rendered placeholders in the office scene. This architect phase only prepares the implementation plan and tasks; no source implementation is included.

## Technical Context
- Next.js, TypeScript, Phaser project.
- Office scene files live under `src/features/city-view/scene/office/`.
- Employee simulation snapshots are hidden controller/service state from Phase 25.
- Phaser remains view-only: rendering can create/update/destroy visual objects, while controllers/services derive view models.

## Constitution Check
- Spec, plan, and tasks are created before implementation.
- No source code implementation is included in this phase.
- Phaser remains view-only.
- NPC state comes from EmployeeSimulationService snapshots.
- No external APIs, provider calls, AI execution, pathfinding, animation systems, conversations, schedules, or gameplay changes.

## Proposed File Structure
- `src/features/city-view/scene/office/npc/EmployeeNpcTypes.ts`
- `src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.ts`
- `src/features/city-view/scene/office/npc/OfficeEmployeeNpcController.ts` only if needed to keep scene integration thin
- Existing integration points, if implementation proceeds:
  - `OfficeProjectPortalController.ts` or a small office-level controller can expose snapshots/view models
  - `CompanyOfficeScene.ts` can own renderer lifecycle only

## Architecture Notes
- Employee simulation remains the source of truth for employee state.
- NPC view models are derived data for rendering and should be disposable.
- The Phaser renderer should accept view models and perform only visual object lifecycle work.
- Any future animated NPCs, pathfinding, or conversations should consume the same view model/snapshot boundary rather than reading task or AI provider state directly.

## Employee NPC View Model
Recommended model:
- `employeeId`
- `displayName`
- `displayLabel`
- `state`
- `currentTaskTitle?`
- `positionHint`
- `spriteKey?`
- `placeholderStyle?`

Recommended `positionHint` shape:
- `zone`: office workspace area name such as `desk`, `collaboration`, `review`, or `idle`
- `slot`: deterministic numeric slot for stable placement

## Controller Responsibilities
Controllers may expose:
- `getEmployeeSimulationSnapshots()`
- `getVisibleOfficeEmployees()`
- `getEmployeeNpcViewModels()`

Controller responsibilities:
- Read employee simulation snapshots.
- Join snapshots to employee display data and current task title if available.
- Produce stable view models for the renderer.
- Avoid Phaser object creation or rendering concerns.

## Phaser Renderer Responsibilities
`OfficeEmployeeNpcRenderer` may:
- create simple employee placeholders or sprites
- create/update display labels
- position NPCs in deterministic office workspace slots
- update visible state labels when view models change
- destroy Phaser objects cleanly on scene shutdown/destroy

Renderer must not:
- derive employee state from tasks
- call AI services/providers
- mutate employee, task, work-session, or simulation state
- implement pathfinding, schedules, conversations, or autonomous behavior

## Risk Review
- Duplicate source of truth: avoid by deriving all NPC view models from employee simulation snapshots.
- Phaser lifecycle cleanup: renderer must track containers/text/sprites and destroy them during scene cleanup.
- Tilemap positioning: start with deterministic workspace slots and avoid collision-heavy navigation.
- Label readability: labels should use constrained text and simple state labels; avoid clutter by limiting visible employee count if needed.
- Future animation expansion: keep renderer placeholder object creation behind view models so sprites/animations can replace rectangles later.

## Validation Plan For Implementation Phase
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`
- `npm run lint` if available, non-blocking for known Next.js lint issue
- Manual regression: Project Portal, Task Detail, Employee Assignment, Work Session start/complete, Activity Log, AI hidden state, employee simulation hidden state, office scene enter/exit cleanup

## Review Checklist
- Phaser remains view-only.
- NPC state comes from EmployeeSimulationService snapshots.
- No business logic in Phaser renderer.
- No external API calls.
- Implementation can be done as a small PR.
- Future pathfinding/animation/conversation can be added without rewriting the foundation.