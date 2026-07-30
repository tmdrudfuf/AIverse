# Implementation Plan: Execution Readiness Validation Foundation

**Branch**: `codex/071-execution-readiness-validation` | **Date**: 2026-07-29 | **Spec**: [spec.md](./spec.md)

## Summary

Spec 071 adds a provider-neutral execution-readiness domain after Spec 070 Execution Plans. The implementation creates immutable readiness snapshots and command results from current product-side state only. It does not perform human execution approval, agent runtime startup, subprocess spawning, filesystem preflight, repository mutation, or GitHub mutation.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js application
**Primary Dependencies**: Existing office domain modules and Vitest test runner
**Storage**: Existing in-memory project portal state only
**Testing**: Vitest focused tests plus full `npm test`, TypeScript, build, and diff checks
**Target Platform**: Browser-compatible product code
**Project Type**: Web app/game dashboard domain layer
**Performance Goals**: Synchronous readiness evaluation over current in-memory project state
**Constraints**: No Node filesystem checks, no subprocesses, no Git/GitHub calls, no Codex/Claude runtime invocation, no source state mutation
**Scale/Scope**: One readiness evaluation per selected project/promotion/session flow; project-isolated collections

## Constitution Check

- Spec Kit workflow followed with spec, plan, tasks, and implementation.
- Changes are scoped to the active feature.
- Existing architecture is reused; no duplicate task, employee, session, repository, or workflow engine is introduced.
- Human-gated remote operations remain outside implementation.
- Validation includes focused tests, full suite, TypeScript, build, and diff checks.

## Project Structure

### Documentation

```text
specs/071-execution-readiness-validation/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/
    execution-readiness.md
  quickstart.md
  tasks.md
```

### Source

```text
src/features/city-view/scene/office/
  execution-readiness/
    ExecutionReadinessTypes.ts
    ExecutionReadinessService.ts
    ExecutionReadinessView.ts
    *.test.ts
  OfficeProjectPortalController.ts
  OfficeProjectPortalRegistry.ts
  OfficeProjectPortalTypes.ts
  OfficeProjectPortalView.ts
```

## Architecture Decisions

1. **Focused domain module**: Add `execution-readiness` next to `execution-plans` to keep readiness separate from planning and active runtime state.
2. **Product-side evidence only**: Reuse Execution Plan fields, repository identity/sync metadata, and injected role/evidence signals. Do not check real paths or run commands.
3. **Latest result with immutable snapshot**: Follow existing domain patterns by storing/readiness collections in project portal state. Repeated evaluation can append results while preserving immutable check snapshots.
4. **Command-time revalidation**: Every evaluation recomputes from current task/session/employee/repository/role/validation/mutation-scope state. Prior `Ready` never bypasses current checks.
5. **Dashboard wording**: Render `Ready for Human Execution Decision`, `Human Approval Not Granted`, and `Execution Not Started`. Never render execution/runtime language as active.

## Implementation Phases

### Phase 0 Research

See [research.md](./research.md).

### Phase 1 Design

See [data-model.md](./data-model.md) and [contracts/execution-readiness.md](./contracts/execution-readiness.md).

### Phase 2 Implementation

- Add readiness domain types and service.
- Add check generation and status aggregation.
- Add state fields and controller command integration.
- Add dashboard formatter and row rendering.
- Add focused tests for identity, immutability, Ready/Blocked/Failed, command-time revalidation, project isolation, controller, dashboard, and runtime safety.

## Validation Strategy

Focused:

```powershell
npx vitest run src/features/city-view/scene/office/execution-readiness/ExecutionReadinessTypes.test.ts src/features/city-view/scene/office/execution-readiness/ExecutionReadinessService.test.ts src/features/city-view/scene/office/execution-readiness/ExecutionReadinessView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

Full:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Risk and Mitigation

- **Ready mistaken for approval**: Fixed false `executionApproved` flag, explicit UI text, and tests for forbidden wording.
- **Runtime boundary regression**: Product code avoids `child_process`, filesystem preflight, Codex/Claude invocation, Git, and GitHub mutation; tests scan readiness module imports/strings.
- **Stale readiness**: Service validates current state on every command and tests repeated evaluation after state changes.
- **Dashboard overflow**: Reuse scoped priority-aware trimming and add layout regressions.

## Post-Design Constitution Check

No new constitution violations. The feature remains local, provider-neutral, deterministic, testable, and remote-mutation free.
