# Implementation Plan: Live Agent Work Visualization

**Branch**: `codex/136-live-agent-work-visualization` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/136-live-agent-work-visualization/spec.md`

## Summary

Add a focused semantic translation layer from selected-project ADOS/project run state into office work visualization state. Feed that model into the existing Spec 135 rendered office, NPC movement/view-model path, and Project Status rendering so employees and status surfaces truthfully represent implementation, validation, review, publication, blocked, complete, and idle states without fake timer progression.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing project portal state, external ADOS run status derivation, runtime collections, `OfficeProjectPortalController`, `OfficeVisualLayer`, `RenderedOfficeComposition`, NPC movement/renderer services, Vitest, Playwright

**Storage**: Existing browser-persisted project portal/session state and external ADOS preparation/execution/result/status collections

**Testing**: Focused Vitest coverage for semantic mapping, selected-project isolation, NPC destination/status view models, Project Status display data, legacy label clutter reduction, Spec 135 composition preservation, movement timestamp behavior, and portal usability; runtime office inspection where tooling permits

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Derive office work state synchronously from already-loaded project state without adding redundant polling or long-running render work.

**Constraints**: Mutate only the feature worktree. Do not modify the primary repository. Do not start review, publish, merge, deploy, mutate GitHub, or run the full configured ADOS validation pipeline from this runtime. ADOS will run authoritative validation after implementation.

**Scale/Scope**: Localized translation/service layer, project status rendering in the existing office visual layer, NPC view-model integration, and focused deterministic tests.

## Constitution Check

- Spec first: passed; Spec 136 specification was generated from the authoritative handoff.
- Plan before code: passed; affected source and validation surfaces are documented before implementation.
- Tasks gate implementation: passed once `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to existing office controller/service/rendering and test surfaces.
- Validation required: focused validation and runtime visual verification are listed; full ADOS validation is intentionally deferred to ADOS per handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/136-live-agent-work-visualization/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- live-agent-work-visualization.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- LiveAgentWorkVisualization.ts
|-- LiveAgentWorkVisualization.test.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.live-agent-work-visualization.test.ts
|-- OfficeVisualLayer.ts
|-- OfficeVisualLayer.test.ts
|-- RenderedOfficeComposition.ts
|-- RenderedOfficeComposition.test.ts
|-- external-ados-run-status/
|   |-- ExternalProjectAdosRunStatusService.ts
|   `-- ExternalProjectAdosRunStatusService.test.ts
`-- npc/
    |-- EmployeeNpcMovementService.ts
    |-- EmployeeNpcMovementService.test.ts
    |-- EmployeeNpcTypes.ts
    |-- OfficeEmployeeNpcRenderer.ts
    `-- OfficeEmployeeNpcRenderer.test.ts
```

**Structure Decision**: Add `LiveAgentWorkVisualization` as the normalized translation layer beside existing office services. Integrate it into the portal controller's employee view models and the visual layer's Project Status rendering while preserving Spec 135 geometry and existing NPC movement.

## Validation

Focused validation in this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/LiveAgentWorkVisualization.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.live-agent-work-visualization.test.ts src/features/city-view/scene/office/OfficeVisualLayer.test.ts src/features/city-view/scene/office/RenderedOfficeComposition.test.ts src/features/city-view/scene/office/npc/OfficeEmployeeNpcRenderer.test.ts src/features/city-view/scene/office/npc/EmployeeNpcMovementService.test.ts src/features/city-view/scene/office/OfficeInteractionController.test.ts
git diff --check
```

Full ADOS validation, outside this runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```

Runtime visual verification:

```text
Start the real app when tooling permits, load the project-company office with representative persisted run states, and inspect the actual rendered office for department association, readable employee labels, reduced lower-right clutter, truthful Project Status, COMPLETE clearing active labels, and preserved Spec 135 composition.
```

## Complexity Tracking

No constitution violations.
