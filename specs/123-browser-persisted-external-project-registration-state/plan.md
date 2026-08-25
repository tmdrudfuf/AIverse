# Implementation Plan: Browser-Persisted External Project Registration State

**Branch**: `codex/123-browser-persisted-external-project-registration-state` | **Date**: 2026-08-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/123-browser-persisted-external-project-registration-state/spec.md`

## Summary

Extend the existing browser office session persistence so external project registry entries survive browser reloads. The implementation will save `projectRegistryEntries` into the current browser session snapshot, validate saved entries before accepting them, and rebuild the derived portal `projects` and `repositoryMappings` collections from restored registry entries. No new UI, filesystem reads, GitHub calls, repository mutation, or runtime execution behavior is added.

## Technical Context

**Language/Version**: TypeScript 5.8, Next.js 16, React 19, Phaser 3.90

**Primary Dependencies**: Existing `BrowserOfficeSessionService`, `ProjectRegistryService`, `ProjectRegistryAdapters`, `OfficeProjectPortalRegistry`, Vitest

**Storage**: Existing browser `localStorage` key `aiverse.office.session`; schema version remains current because restore is backward-compatible with snapshots that omit registry entries

**Testing**: Focused Vitest tests added but ADOS validation runs outside this runtime

**Target Platform**: Browser-based AIverse app

**Project Type**: Single Next.js application

**Performance Goals**: Synchronous restore over a small project list; no visible reload delay

**Constraints**: Mutate only the feature worktree. Do not run validation, start review, publish, merge, deploy, mutate GitHub, or modify the primary repository from this runtime.

**Scale/Scope**: Browser-persisted configured project metadata only; no add-project UI, cross-device sync, file validation, git reads, GitHub reads, or repository mutation

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; source and validation surfaces are identified before implementation.
- Tasks gate implementation: pending until `tasks.md` exists.
- Preserve application stability: passed; changes are scoped to browser session persistence and derived portal state reconstruction.
- Validation required: documented below, but not executed in this ADOS runtime by handoff policy.

## Project Structure

### Documentation (this feature)

```text
specs/123-browser-persisted-external-project-registration-state/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- browser-persisted-external-project-registration-state.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalRegistry.test.ts
|-- browser-session/
|   |-- BrowserOfficeSessionService.ts
|   |-- BrowserOfficeSessionService.test.ts
|   `-- BrowserOfficeSessionTypes.ts
`-- project-registry/
    |-- ProjectRegistryAdapters.ts
    `-- ProjectRegistryTypes.ts
```

**Structure Decision**: Keep persistence in `browser-session/` because it owns save/load/restore behavior. Keep derived collection rebuilding in `OfficeProjectPortalRegistry.ts`, where portal state is already composed from registry entries and adapters.

## Validation

Focused validation, outside this runtime:

```powershell
npx vitest run src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
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

## Complexity Tracking

No constitution violations.
