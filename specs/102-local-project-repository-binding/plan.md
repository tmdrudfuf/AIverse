# Implementation Plan: Local Project Repository Binding

**Branch**: `codex/102-local-project-repository-binding` | **Date**: 2026-08-15 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/102-local-project-repository-binding/spec.md`

## Summary

Add a configured local repository binding layer to the existing project registry. The layer updates project registry entries with local repository/worktree metadata supplied by the caller, keeps configured identity separate from verified repository sync state, and exposes the bound metadata through portal state without reading the filesystem or mutating a repository.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `ProjectRegistryEntry`, `ProjectRegistryService`, `ProjectRegistryAdapters`, `OfficeProjectPortalRegistry`, Vitest

**Storage**: In-memory project portal state only; no browser storage, filesystem writes, remote persistence, or environment loading in this slice

**Testing**: Focused Vitest tests added but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app and local developer workflow

**Project Type**: Single Next.js application

**Performance Goals**: O(project count + binding count), deterministic synchronous metadata binding

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Registered local project metadata only; no UI flow, persistent settings, local git reader, repository sync provider change, agent runtime change, subprocess, repository mutation, or GitHub mutation

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to project-registry metadata and portal state initialization.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/102-local-project-repository-binding/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- local-project-repository-binding.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalRegistry.test.ts
`-- project-registry/
    |-- LocalProjectRepositoryBinding.ts
    |-- LocalProjectRepositoryBinding.test.ts
    |-- ProjectRegistryAdapters.ts
    |-- ProjectRegistryAdapters.test.ts
    |-- ProjectRegistryService.ts
    |-- ProjectRegistryService.test.ts
    `-- ProjectRegistryTypes.ts
```

**Structure Decision**: Keep binding inside `project-registry/` because it changes configured project metadata, not verified repository synchronization or runtime execution. `OfficeProjectPortalRegistry` accepts optional bindings at state creation so tests and future configuration can inject local project metadata without global side effects.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/project-registry/LocalProjectRepositoryBinding.test.ts src/features/city-view/scene/office/project-registry/ProjectRegistryService.test.ts src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
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
