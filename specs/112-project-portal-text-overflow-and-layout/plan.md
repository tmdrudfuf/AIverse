# Implementation Plan: Project Portal Text Overflow and Layout Stability

**Branch**: `112-project-portal-text-overflow-and-layout` | **Date**: 2026-08-19 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/112-project-portal-text-overflow-and-layout/spec.md`

## Summary

Stabilize the in-office Project Portal overlay so long project, task, repository, employee, advisory, and runtime text remains inside visible panels without covering footer instructions. The implementation will reuse the existing Phaser view boundary, add small text fitting helpers where the current fixed coordinates are vulnerable, and extend focused portal rendering tests with long-content fixtures.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest stack

**Storage**: N/A

**Testing**: Focused Vitest coverage for portal view rendering helpers and layout positions

**Target Platform**: Browser game UI

**Project Type**: Web application with Phaser scene overlay

**Performance Goals**: No measurable runtime impact; only deterministic string fitting and row filtering during portal render

**Constraints**: Mutate only the feature worktree; do not run validation, start review, publish, merge, deploy, mutate GitHub, or touch the primary repository from this runtime

**Scale/Scope**: One existing Project Portal overlay and its covered view modes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. Feature spec exists under `specs/112-project-portal-text-overflow-and-layout/spec.md`.
- Plan Before Code: PASS. This plan names the affected source and test files before implementation.
- Tasks Gate Implementation: PASS once `tasks.md` is generated.
- Preserve Application Stability: PASS. Scope is limited to portal layout rendering and focused tests.
- Validation Is Required: CONSTRAINED. Validation commands are documented, but this handoff explicitly prohibits running validation from this runtime.

## Project Structure

### Documentation (this feature)

```text
specs/112-project-portal-text-overflow-and-layout/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- portal-layout.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- OfficeProjectPortalView.ts
|-- OfficeProjectPortalView.test.ts
`-- project-dashboard/
    |-- ProjectDashboardView.ts
    `-- ProjectDashboardView.test.ts
```

**Structure Decision**: Keep all behavior in the existing Project Portal and Project Dashboard view files. Tests remain beside the view files, matching the repository's current feature-local test pattern.

## Complexity Tracking

No constitution violations require complexity exceptions.
