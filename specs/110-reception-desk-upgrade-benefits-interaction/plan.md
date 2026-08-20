# Implementation Plan: Reception Desk Upgrade Benefits Interaction

**Branch**: `codex/110-reception-desk-upgrade-benefits-interaction` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/110-reception-desk-upgrade-benefits-interaction/spec.md`

## Summary

Show passive reception upgrade benefits inside the existing project workspace when current company progression is level 2 or higher and reception is unlocked. The desk continues to open the existing workspace surface; no runtime execution, GitHub mutation, deployment, or external process is added.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `OfficeProjectPortalController`, `OfficeProjectPortalView`, `ProjectPortalState`, company progression snapshots, Vitest

**Storage**: Existing in-memory portal state only; no new persistence

**Testing**: Focused Vitest coverage for benefit derivation and workspace rendering; ADOS validation is not run from this runtime by handoff policy

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(1) benefit derivation and constant-size workspace rendering

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: One passive reception benefits panel in the existing workspace; no new external runtime execution, persistence, GitHub mutation, or deployment

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; affected source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to portal state/view and reception benefit derivation.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/110-reception-desk-upgrade-benefits-interaction/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- reception-desk-upgrade-benefits-interaction.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- ReceptionDeskUpgradeBenefitsService.ts
|-- ReceptionDeskUpgradeBenefitsService.test.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: Keep benefit derivation in the office portal module because it depends only on company progression state already owned by the portal.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/ReceptionDeskUpgradeBenefitsService.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
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
