# Implementation Plan: Level 2 Reception Desk Runtime Spawn

**Branch**: `codex/109-level-2-reception-desk-runtime-spawn` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/109-level-2-reception-desk-runtime-spawn/spec.md`

## Summary

Register a level-gated reception desk interactable from current company progression and active office layout state. The desk appears only when level 2 unlocks reception, is drawn by the office visual layer, and opens the existing project workspace/runtime surface through the current interaction flow.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing office scene, `OfficeInteractiveObjectRegistry`, `OfficeInteractionController`, `OfficeVisualLayer`, progression and layout services, Vitest

**Storage**: Existing in-memory office scene state only; no new persistence

**Testing**: Focused Vitest coverage for reception desk derivation, visual marker refresh, and workspace action routing; ADOS validation is not run from this runtime by handoff policy

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(1) reception desk derivation and O(n) marker refresh over the small registered interactable set

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: One level-gated reception desk interactable; no new external runtime execution, persistence, GitHub mutation, or deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to office interaction registration and rendering.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/109-level-2-reception-desk-runtime-spawn/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- reception-desk-runtime-spawn.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- ReceptionDeskRuntimeSpawnService.ts
|-- ReceptionDeskRuntimeSpawnService.test.ts
|-- CompanyOfficeScene.ts
|-- OfficeVisualLayer.ts
`-- OfficeVisualLayer.test.ts
```

**Structure Decision**: Keep the derivation service in the existing office scene module because it depends on office progression, layout, and interactable registry concepts already owned there.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/ReceptionDeskRuntimeSpawnService.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Complexity Tracking

No constitution violations.
