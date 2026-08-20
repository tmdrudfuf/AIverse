# Implementation Plan: Reviewer Runtime Uncommitted Target Blocked Result Explanation

**Branch**: `codex/114-reviewer-runtime-uncommitted-target-blocked-result` | **Date**: 2026-08-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/114-reviewer-runtime-uncommitted-target-blocked-result/spec.md`

## Summary

Update the Reviewer Runtime blocked-result dashboard row so a blocked result caused by an uncommitted review target explicitly names the uncommitted target and tells the player to inspect the result. Keep generic blocked wording and all ready, completed, timed-out, and failed rows behaviorally unchanged.

## Technical Context

**Language/Version**: TypeScript with the existing Next.js application

**Primary Dependencies**: Existing React, Phaser, and Vitest setup

**Storage**: N/A

**Testing**: Focused Vitest coverage for Reviewer Runtime display rows; full validation is prohibited in this runtime by the ADOS handoff

**Target Platform**: Desktop web browser dashboard

**Project Type**: Web application

**Performance Goals**: No measurable runtime cost; this is a static row text selection change

**Constraints**: Keep dashboard row text within the existing wrap budget; do not run validation, start review, publish, merge, deploy, mutate GitHub, or perform remote workflow actions from this runtime

**Scale/Scope**: One display helper, its focused test coverage, and Spec Kit traceability artifacts

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Spec First**: PASS. `spec.md` defines the user-facing uncommitted-target blocked explanation.
- **Plan Before Code**: PASS. This plan identifies the targeted display surface and constraints before implementation.
- **Tasks Gate Implementation**: PASS once `tasks.md` exists for this feature.
- **Preserve Application Stability**: PASS. Scope is limited to the Reviewer Runtime display helper, focused tests, and feature artifacts.
- **Validation Is Required**: PASS. Validation commands are documented, but this ADOS runtime must not execute them.

## Project Structure

### Documentation (this feature)

```text
specs/114-reviewer-runtime-uncommitted-target-blocked-result/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
`-- tasks.md
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/reviewer-runtime/
|-- ReviewerRuntimeView.ts
`-- ReviewerRuntimeView.test.ts
```

**Structure Decision**: Keep the change inside the existing Reviewer Runtime display module. No new feature area, dependency, runtime state, or input handler is needed.

## Phase 0: Research

See [research.md](./research.md).

## Phase 1: Design & Contracts

See [data-model.md](./data-model.md), [contracts/reviewer-runtime-uncommitted-target-blocked-result.md](./contracts/reviewer-runtime-uncommitted-target-blocked-result.md), and [quickstart.md](./quickstart.md).

## Constitution Check

*Post-design re-check.*

- **Spec First**: PASS. The feature remains documented as a user-facing blocked-result explanation.
- **Plan Before Code**: PASS. Design artifacts are present.
- **Tasks Gate Implementation**: PASS after task generation.
- **Preserve Application Stability**: PASS. The planned code surface is tightly scoped.
- **Validation Is Required**: PASS. Focused and full validation commands are listed only for an allowed validation runtime.
