# Implementation Plan: Human Execution Approval Foundation

**Branch**: `codex/072-human-execution-approval-foundation` | **Date**: 2026-07-30 | **Spec**: [spec.md](./spec.md)

## Summary

Add a focused Human Execution Approval layer after Execution Readiness. The layer records an immutable provider-neutral approval only after explicit local human input, after command-time Execution Plan revalidation and current readiness re-evaluation. It does not start runtime, invoke agents, spawn processes, inspect real paths, mutate repositories, or mutate GitHub.

## Technical Context

**Language/Version**: TypeScript in the existing Vite/Vitest project
**Primary Dependencies**: Existing office domain modules and dashboard renderer
**Storage**: Local in-memory controller state only
**Testing**: Vitest via `npm test`, TypeScript, build, diff checks
**Constraints**: No runtime execution, no filesystem preflight, no Git/GitHub mutation, no subprocesses

## Constitution Check

- Reuse existing ProjectTask, employee, readiness, execution-plan, session, controller, and dashboard architecture.
- Keep changes feature-specific and avoid generic workflow infrastructure.
- Preserve human-gated remote operations; this local implementation must not push or create a PR.
- Validate with focused and full tests before independent review.

## Project Structure

### Documentation

```text
specs/072-human-execution-approval-foundation/
  spec.md
  plan.md
  research.md
  data-model.md
  contracts/human-execution-approval.md
  quickstart.md
  tasks.md
```

### Source

```text
src/features/city-view/scene/office/
  human-execution-approvals/
    HumanExecutionApprovalTypes.ts
    HumanExecutionApprovalService.ts
    HumanExecutionApprovalView.ts
```

## Design

### Module Ownership

`human-execution-approvals` owns approval identifiers, immutable records, result records, validation of approval-specific preconditions, and display formatting. It delegates plan and readiness correctness to the existing Execution Plan and Execution Readiness services.

### Reuse

The controller reuses existing ProjectTask collections, employee registry, confirmed assignments, prepared sessions, active work sessions, execution plans, readiness results, repository metadata, role context, validation commands, mutation scope, and project isolation conventions.

### Revalidation Order

The controller handles an explicit approval command by:

1. Finding the selected promoted ProjectTask and Execution Plan.
2. Revalidating the Execution Plan using the Spec 070 service.
3. Re-evaluating readiness using the Spec 071 service.
4. Calling the Human Execution Approval service only with the current plan and readiness outcome.
5. Recording a local immutable result and, when allowed, approval record.

### Identity

Approval ID:

```text
<projectId>:human-execution-approval:<executionPlanId>:approval-v1
```

The ID excludes timestamps, names, random values, and UI positions.

### Stale Approval Policy

Approvals are immutable historical records. Repeated approval returns `AlreadyApproved` only when the current plan/readiness context matches exactly after revalidation. Changed current context blocks approval rather than silently reusing stale approval.

### Dashboard Strategy

Add `[HUMAN EXECUTION APPROVAL]` rows below readiness using scoped priority-aware overflow. Wording distinguishes:

- Ready but not approved
- Approval unavailable
- Approval recorded
- Execution not started
- Awaiting runtime preflight

## Validation Strategy

Focused tests cover identity, service validation, idempotency, controller explicit input, dashboard wording, layout, and runtime safety. Full validation runs `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.
