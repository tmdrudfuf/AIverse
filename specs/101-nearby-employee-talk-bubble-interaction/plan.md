# Implementation Plan: Spec 101 - Nearby Employee Talk Bubble Interaction

**Branch**: `codex/101-nearby-employee-talk-bubble-interaction` | **Date**: 2026-08-14 | **Spec**: `specs/101-nearby-employee-talk-bubble-interaction/spec.md`

**Input**: Feature specification from `/specs/101-nearby-employee-talk-bubble-interaction/spec.md`

## Summary

Add a lightweight, action-triggered employee speech bubble in the office scene. Reuse existing nearby employee targeting and deterministic EmployeeConversationService output, render one temporary bubble near the selected NPC, and hide it automatically without blocking movement or changing existing exit/computer/portal behavior.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, Phaser 3.90, Vitest

**Primary Dependencies**: existing `EmployeeConversationService`, `EmployeeConversationViewModel`, `OfficeProjectPortalController.getNearbyEmployeeConversationTarget()`, `OfficeProjectPortalController.getEmployeeConversationViewModel()`, `CompanyOfficeScene`, and Phaser display objects

**Storage**: in-memory scene display state only

**Testing**: focused Vitest coverage for nearby talk integration and bubble overlay lifecycle; ADOS validation runs outside this runtime

**Target Platform**: browser-based AIverse app

**Project Type**: Next.js application with Phaser city/office interaction surface

**Performance Goals**: O(visible employees) for target lookup and constant-time bubble update/render operations

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Existing office NPCs and deterministic local conversation snippets only; no persistence, real AI calls, dialogue choices, relationship systems, voice/audio, new controls, runtime execution, review automation, validation execution, or GitHub integration changes

## Constitution Check

- Spec exists before plan and implementation.
- Plan names affected source/test surfaces before code changes.
- Tasks will be created before implementation edits.
- Application changes stay scoped to nearby employee conversation targeting, office-scene action wiring, and speech bubble rendering.
- Validation commands are documented but intentionally not run from this ADOS handoff runtime.

## Project Structure

### Documentation (this feature)

```text
specs/101-nearby-employee-talk-bubble-interaction/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- nearby-employee-talk-bubble.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- CompanyOfficeScene.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.nearby-talk-bubble.test.ts
`-- conversations/
    |-- EmployeeConversationBubbleOverlay.ts
    `-- EmployeeConversationBubbleOverlay.test.ts
```

**Structure Decision**: Keep conversation content in the existing controller/service boundary and add a small Phaser overlay for display. The office scene owns action timing and overlay lifecycle because it already coordinates movement, insight, knowledge, portal state, and action input.

## Design

`CompanyOfficeScene` tracks the current Employee Insight target each frame. When the existing action input is pressed and no exit/object interaction consumes it, the scene asks `OfficeProjectPortalController` for a conversation view model for that target employee. A new `EmployeeConversationBubbleOverlay` renders the speaker and line near the NPC position from the view model and hides when its display duration expires or a blocking portal overlay is active.

`OfficeProjectPortalController` continues to own deterministic conversation derivation. If needed, it exposes a small helper that resolves a talk view model from a nearby target without mutating simulation, movement, schedule, task, insight, or knowledge state.

## Validation

Focused validation, outside this runtime:

```powershell
npm test -- nearby-talk-bubble EmployeeConversationBubbleOverlay
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
