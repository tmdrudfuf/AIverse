# Implementation Plan: In-Office Development Request

**Branch**: `codex/138-in-office-development-request` | **Date**: 2026-08-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/138-in-office-development-request/spec.md`

## Summary

Create a real in-office development request flow for the active bound project company. Reuse the existing project-company binding, portal development request, ADOS preparation/execution/status, browser session persistence, Project Status, and Spec 136 live visualization systems. Replace older hard-coded external-project defaults with request-bound durable requirements-file preparation and deterministic project-scoped feature identity.

## Technical Context

**Language/Version**: TypeScript, React/Next.js, Phaser

**Primary Dependencies**: Existing AIverse office portal, project registry, BrowserOfficeSessionService, active project-company binding, external development request, external ADOS preparation/execution/status, and live visualization modules

**Storage**: Existing browser office session persistence for request/run records, plus trusted Node-side requirements-file materialization under AIverse's own `.aiverse/external-requests/<project>/<request>-requirements.md` durable artifact area before ADOS spawn. The target project's primary checkout is not used for temporary requirements staging.

**Testing**: Vitest targeted tests; ADOS will run the full configured validation pipeline outside this runtime

**Target Platform**: Browser application with Node-backed trusted local execution only when explicitly enabled

**Project Type**: Web application with Phaser scene runtime

**Performance Goals**: Request/status derivation remains synchronous in the existing portal render cycle.

**Constraints**: Mutate only the feature worktree; do not run full ADOS validation here; do not start review/publish/merge/deploy/GitHub mutation; do not use unsafe shell command construction.

**Scale/Scope**: One active project-company office context and project-scoped request/run records; no multi-project scheduling or autonomous backlog generation.

## Constitution Check

- Spec First: PASS. `spec.md` captures user value, scenarios, requirements, edge cases, and success criteria.
- Plan Before Code: PASS. This plan identifies affected architecture, storage, validation, and safety constraints.
- Tasks Gate Implementation: PASS after `tasks.md` is created before application code changes.
- Preserve Application Stability: PASS. Changes are scoped to existing request/preparation/execution/status/visualization modules and focused tests.
- Validation Is Required: PASS. Targeted tests and diff checks will be run here; ADOS will run the full configured validation pipeline.

## Project Structure

### Documentation (this feature)

```text
specs/138-in-office-development-request/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- in-office-development-request.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/
|-- external-development-requests/
|-- external-ados-run-preparation/
|-- external-ados-execution/
|-- external-ados-run-status/
|-- browser-session/
|-- project-company-binding/
|-- LiveAgentWorkVisualization.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalRegistry.ts
```

**Structure Decision**: Extend existing office/portal ADOS modules. Do not add a second project registry, second status provider, or disconnected development UI.

## Complexity Tracking

No constitution violations.
