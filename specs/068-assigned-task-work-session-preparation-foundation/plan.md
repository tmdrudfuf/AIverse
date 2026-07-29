# Implementation Plan: Assigned Task Work Session Preparation Foundation

**Branch**: `codex/068-assigned-task-work-session-preparation-foundation` | **Date**: 2026-07-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/068-assigned-task-work-session-preparation-foundation/spec.md`

## Summary

Add a provider-neutral prepared work-session layer that consumes existing ProjectTasks, confirmed assignment records, employees, and active work-session snapshots. The implementation will create deterministic immutable prepared-session records and preparation results, expose an explicit project-dashboard preparation command, and render low-priority dashboard rows that never imply active work.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/React/Phaser application

**Primary Dependencies**: Existing office domain services, Phaser dashboard view tests, Vitest

**Storage**: Local in-memory controller state only; no Firebase, browser storage, GitHub, file-system runtime writes, or remote persistence

**Testing**: Vitest focused unit/controller/view tests, full `npm test`, TypeScript, build, diff checks

**Target Platform**: Existing browser game/runtime dashboard

**Project Type**: Single web application

**Performance Goals**: Deterministic synchronous preparation over current in-memory project collections; no network calls or subprocesses

**Constraints**: Preserve task Todo status, confirmed assignment immutability, employee not-working state, and human-only remote mutation boundary

**Scale/Scope**: One prepared session per confirmed assignment within the current controller session

## Constitution Check

- Spec first: passed; `spec.md` and requirements checklist exist before code.
- Plan before code: passed; this plan defines source ownership, validation, and architectural fit before implementation.
- Tasks gate implementation: pending; implementation starts only after `tasks.md`.
- Preserve application stability: passed; changes are scoped to office prepared-session domain, controller, view, tests, and Spec 068 docs.
- Validation required: passed; validation commands and focused tests are listed below.

## Project Structure

### Documentation (this feature)

```text
specs/068-assigned-task-work-session-preparation-foundation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── prepared-work-session.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
├── prepared-work-sessions/
│   ├── PreparedWorkSessionTypes.ts
│   ├── PreparedWorkSessionTypes.test.ts
│   ├── PreparedWorkSessionService.ts
│   ├── PreparedWorkSessionService.test.ts
│   ├── PreparedWorkSessionView.ts
│   └── PreparedWorkSessionView.test.ts
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalController.issue-sync.test.ts
├── OfficeProjectPortalTypes.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalView.ts
└── OfficeProjectPortalView.test.ts
```

**Structure Decision**: Keep preparation in a focused `prepared-work-sessions` module because existing `work-sessions` types represent active execution. Controller and view changes are additive and follow the Spec 064-067 pattern.

## Phase 0 Research

See [research.md](research.md).

## Phase 1 Design

See [data-model.md](data-model.md), [contracts/prepared-work-session.md](contracts/prepared-work-session.md), and [quickstart.md](quickstart.md).

## Validation Strategy

- Focused tests:
  - `npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionTypes.test.ts`
  - `npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionService.test.ts`
  - `npx vitest run src/features/city-view/scene/office/prepared-work-sessions/PreparedWorkSessionView.test.ts`
  - `npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts`
  - `npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- Full validation:
  - `npm test`
  - `npx tsc --noEmit`
  - `npm run build`
  - `git diff --check`
  - `git diff --cached --check`

## Complexity Tracking

No constitution violations.
