# Implementation Plan: Finding Lifecycle Tracking

**Branch**: `codex/finding-lifecycle-tracking` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/052-finding-lifecycle-tracking/spec.md`

## Summary

Add provider-neutral finding lifecycle tracking to the existing local agent workflow. Structured Review schema version 1 remains the base contract and gains an optional `findingLifecycle` array. The orchestrator records initial findings as new, supplies previous finding history to re-review/final-review prompts, validates lifecycle classifications conservatively, writes normalized lifecycle artifacts, and selects only active open blocking findings for fix prompts.

## Technical Context

**Language/Version**: JavaScript/CommonJS with TypeScript tests

**Primary Dependencies**: Existing Node.js standard library, Vitest test suite, Git CLI context collection

**Storage**: JSON state files and run artifacts under `.agent-workflow/`

**Testing**: Vitest focused workflow tests plus full `npm test`

**Target Platform**: Local Windows PowerShell-compatible CLI workflow; cross-platform Node process execution paths preserved

**Project Type**: Local CLI/developer workflow tooling

**Performance Goals**: Lifecycle normalization operates on structured review JSON and remains negligible compared with agent execution and validation commands

**Constraints**: No remote mutation, no live AI in automated tests, old state/artifacts remain readable, invalid lifecycle data stops conservatively

**Scale/Scope**: One orchestration run, one active branch, bounded fix cycles, bounded one-round question loop

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec Kit workflow followed: spec, plan, design artifacts, tasks before implementation.
- Existing architecture is extended at the current parser/orchestration seams.
- Runtime artifacts stay under `.agent-workflow/` and are not committed.
- Remote mutations remain human-only.

## Project Structure

### Documentation (this feature)

```text
specs/052-finding-lifecycle-tracking/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── finding-lifecycle.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
tools/agent-workflow/
├── findingLifecycle.js
├── findingLifecycle.test.ts
├── structuredReview.js
├── structuredReview.test.ts
├── orchestrateCommand.js
├── orchestrateCommand.test.ts
├── reviewCommand.js
├── reviewCommand.test.ts
├── templates/
│   ├── independent-review.md
│   └── orchestrate-final-review.md
└── README.md
```

**Structure Decision**: Lifecycle-specific parsing and normalization belongs in a focused `findingLifecycle.js` module. `structuredReview.js` remains responsible for extracting and validating the provider-neutral structured review object. `orchestrateCommand.js` owns stage transitions, state updates, prompt context, and artifact writing.

## Complexity Tracking

No constitution violations.
