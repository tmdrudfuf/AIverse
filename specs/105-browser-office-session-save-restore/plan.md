# Implementation Plan: Browser Office Session Save Restore

**Branch**: `codex/105-browser-office-session-save-restore` | **Date**: 2026-08-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/105-browser-office-session-save-restore/spec.md`

## Summary

Persist and restore the browser-local subset of office portal state needed to continue active work sessions after a page refresh. Add a small office session persistence service, wire it into project portal state construction and controller mutations, and cover valid, invalid, and duplicate-start restore behavior with focused Vitest tests.

## Technical Context

**Language/Version**: TypeScript 5.8

**Primary Dependencies**: Next.js 16, React 19, Phaser 3.90, Vitest 4

**Storage**: Browser `localStorage` through a defensive adapter; no server, repository, or GitHub mutation

**Testing**: Vitest unit tests plus repository validation commands documented in quickstart

**Target Platform**: Browser-based Next.js/Phaser application

**Project Type**: Single web application

**Performance Goals**: Restore snapshot during office state construction without user-visible delay; persist only bounded office workflow records

**Constraints**: Must fail open when browser storage is unavailable or malformed; must not persist Phaser objects, providers, async counters, or remote/runtime side effects

**Scale/Scope**: Existing office project portal workflow, initially covering active work/session records for loaded projects

## Constitution Check

- Spec First: PASS. `spec.md` describes user value, acceptance scenarios, requirements, and success criteria.
- Plan Before Code: PASS. This plan identifies affected architecture and validation before implementation.
- Tasks Gate Implementation: PASS. Implementation will proceed only after `tasks.md` is present.
- Preserve Application Stability: PASS. Changes are scoped to office session persistence, registry/controller wiring, tests, and spec artifacts.
- Validation Is Required: PASS. Required validation commands are listed, but this ADOS runtime explicitly forbids running them.

Post-design re-check: PASS. Design keeps behavior local, bounded, and covered by focused tests.

## Project Structure

### Documentation (this feature)

```text
specs/105-browser-office-session-save-restore/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- office-session-persistence.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalController.browser-session.test.ts
`-- browser-session/
    |-- BrowserOfficeSessionService.ts
    |-- BrowserOfficeSessionService.test.ts
    `-- BrowserOfficeSessionTypes.ts
```

**Structure Decision**: Follow the existing office feature-module layout. The persistence service is isolated under `browser-session/` and the controller/registry only call narrow load/save helpers.

## Complexity Tracking

No constitution violations.
