# Implementation Plan: Reviewer Question Loop

**Branch**: `codex/reviewer-question-loop` | **Date**: 2026-07-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/051-reviewer-question-loop/spec.md`

## Summary

Extend the local `orchestrate` workflow with one bounded clarification round. The structured review schema remains version 1 and adds `decision: "questions"` plus validated question objects. Orchestration handles `review -> answer-questions -> final-review` before existing Approved/Changes Requested logic. Implementer answers are parsed through a separate structured answer module and written as separate JSON artifacts when valid.

## Technical Context

**Language/Version**: JavaScript CommonJS workflow tooling, TypeScript/Vitest tests

**Primary Dependencies**: Existing `agentWorkflow.js`, `agentRunner.js`, `reviewCommand.js`, `structuredReview.js`, `orchestrateCommand.js`, Node.js built-ins

**Storage**: Existing `.agent-workflow/runs/<feature-id>/` artifacts plus additive question/answer state fields and structured answer JSON artifacts

**Testing**: Vitest with deterministic process adapters, fixtures, temporary repositories, and no live AI calls in automated tests

**Target Platform**: Local developer machines, including Windows PowerShell

**Project Type**: Local CLI workflow tooling inside a Next.js/Phaser repository

**Performance Goals**: No additional work on flows without questions; one extra Implementer run and one extra Reviewer run only when questions are valid

**Constraints**: One question round only, local-only, no production `src/` changes, no automatic remote mutation, no new runtime dependencies

**Scale/Scope**: Structured parser extension, answer parser, orchestration transitions, prompt templates, tests, docs, and Spec Kit artifacts

## Existing System Review

- `structuredReview.js` validates schema version 1 decisions, findings, structured artifacts, and Markdown/structured reconciliation.
- `reviewCommand.js` records independent review prompt, execution, raw Markdown result, and valid structured JSON artifacts.
- `orchestrateCommand.js` owns the automated stage loop and already consumes structured findings for fix prompts.
- `agentRunner.js` owns process execution, role-based runner resolution, timeout cleanup, and unsafe runner rejection.
- `agentWorkflow.js` provides atomic state writes, run path containment, BOM-tolerant state loading, and validation defaults.

## Design Decisions

- Keep schema version 1 and add `questions` as a backward-compatible decision value.
- Validate decision consistency inside `structuredReview.js` so invalid mixed states become `Unknown`.
- Add `tools/agent-workflow/structuredAnswers.js` for answer extraction, validation, normalization, and diagnostics.
- Add `answer-questions` and `final-review` orchestration stages; do not add them to the legacy manual prompt stage list.
- Reuse existing `runAgentPrompt` subprocess path for Implementer answers and `runReviewWithoutStateWrite` for final review with a new prompt builder.
- Use conditional dry-run wording because question stages are only known after initial review.
- Persist state after each completed stage so resume can continue from answer or final-review without repeating completed work.

## Constitution Check

- Spec First: Pass. `spec.md` exists.
- Plan Before Code: Pass. This plan defines implementation before code changes.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass. Changes stay in workflow tooling, tests, and docs.
- Validation Is Required: Pass. Focused, full, dry-run, smoke, and independent review validation are required.

## Project Structure

### Documentation

```text
specs/051-reviewer-question-loop/
|-- spec.md
|-- plan.md
|-- research.md
|-- data-model.md
|-- quickstart.md
|-- contracts/
|   |-- structured-review-questions.md
|   `-- structured-answers.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
tools/agent-workflow/
|-- structuredReview.js
|-- structuredReview.test.ts
|-- structuredAnswers.js
|-- structuredAnswers.test.ts
|-- orchestrateCommand.js
|-- orchestrateCommand.test.ts
|-- reviewCommand.js
|-- reviewCommand.test.ts
|-- templates/independent-review.md
|-- templates/orchestrate-answer-questions.md
|-- templates/orchestrate-final-review.md
`-- README.md
```

## Phase 0 Research

See [research.md](./research.md).

## Phase 1 Design

See [data-model.md](./data-model.md), [contracts/structured-review-questions.md](./contracts/structured-review-questions.md), [contracts/structured-answers.md](./contracts/structured-answers.md), and [quickstart.md](./quickstart.md).

## Constitution Check Post-Design

- Spec First: Pass.
- Plan Before Code: Pass.
- Tasks Gate Implementation: Pass once `tasks.md` exists.
- Preserve Application Stability: Pass.
- Validation Is Required: Pass.

## Complexity Tracking

No constitution violations.
