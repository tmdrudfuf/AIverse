# Implementation Plan: Structured Review Handoff

**Branch**: `codex/structured-review-handoff` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/050-structured-review-handoff/spec.md`

## Summary

Add a focused structured review parser and validation module, update the Reviewer prompt contract to request one versioned JSON payload, record valid structured reviews as separate artifacts, reconcile structured and Markdown decisions conservatively, and use valid structured blocking findings for automated fix prompts. Markdown-only output remains supported for backward compatibility when no structured block is present.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript/Vitest tests

**Primary Dependencies**: Existing `agentWorkflow.js`, `agentRunner.js`, `reviewCommand.js`, `orchestrateCommand.js`, Node.js built-ins

**Storage**: Existing `.agent-workflow/runs/<feature-id>/` artifacts plus additive structured review JSON artifacts and state fields

**Testing**: Vitest with deterministic fixtures, injected process adapters, and temporary repositories

**Target Platform**: Local developer machines, including Windows PowerShell

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser repository

**Performance Goals**: Pure parsing is deterministic and bounded by Reviewer output size already captured by the workflow

**Constraints**: Local-only, no product `src/` changes, no remote mutation, no live agent calls in tests, no new runtime dependencies

**Scale/Scope**: One parsing module, integration into review/orchestration paths, prompt/docs updates, and focused tests

## Existing System Review

- `reviewCommand.js` builds independent review prompts, runs the Reviewer, writes prompt/execution/raw result artifacts, classifies Markdown decisions, and appends `reviewRuns`.
- `orchestrateCommand.js` reuses independent review prompt generation and currently extracts actionable fix findings heuristically from Markdown.
- `agentWorkflow.js` provides run path containment, default validation commands, BOM-tolerant state loading, atomic state writing, and Markdown decision detection.
- `agentRunner.js` owns local process execution, timeout cleanup, runner safety checks, and role resolution helpers.
- Existing tests already use deterministic process adapters and temporary repositories; Spec 050 should follow that style.

## Design Decisions

- Add `tools/agent-workflow/structuredReview.js` as a pure parser/validator/reconciler.
- Locate the structured payload only in the `## Structured Review` Markdown section.
- Require exactly one fenced `json` block in that section for structured parsing to be valid.
- Return explicit parse status and diagnostics instead of throwing for ordinary malformed Reviewer output.
- Reconcile valid structured decisions with Markdown decisions before exposing the review outcome.
- Treat absent structured data as backward-compatible Markdown-only output.
- Treat invalid, unsupported, duplicated, or conflicting structured data as `Unknown` for successful Reviewer executions.
- Write a separate JSON artifact only when structured status is `valid`.
- Keep orchestration changes small: prefer structured blocking findings when valid, otherwise use legacy Markdown extraction when status is `absent`.

## Constitution Check

- Spec First: Pass. `spec.md` exists for this feature.
- Plan Before Code: Pass. This plan defines implementation before code changes.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass. Planned changes stay in workflow tooling and specs; no product `src/` files.
- Validation Is Required: Pass. Focused and full validation are required.

## Project Structure

### Documentation

```text
specs/050-structured-review-handoff/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   `-- structured-review.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
tools/agent-workflow/
|-- structuredReview.js
|-- structuredReview.test.ts
|-- reviewCommand.js
|-- reviewCommand.test.ts
|-- orchestrateCommand.js
|-- orchestrateCommand.test.ts
|-- templates/independent-review.md
`-- README.md
```

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/structured-review.md](./contracts/structured-review.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass.
- Validation Is Required: Pass.

## Complexity Tracking

No constitution violations.
