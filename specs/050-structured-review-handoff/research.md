# Research: Structured Review Handoff

## Decision: Use a Designated Markdown Section With One JSON Fence

**Rationale**: Reviewer output remains readable for humans, while the parser can deterministically locate the intended machine payload under `## Structured Review`. This avoids parsing unrelated JSON examples from the rest of the review.

**Alternatives considered**:

- Parse any JSON object in the output: rejected because arbitrary examples could be mistaken for the handoff payload.
- Replace Markdown with JSON only: rejected because human review artifacts must remain readable.
- Use provider-specific tool output formats: rejected because workflow roles must remain provider-neutral.

## Decision: Pure Parser Module

**Rationale**: A focused `structuredReview.js` module keeps parsing, validation, normalization, and decision reconciliation out of the orchestration engine.

**Alternatives considered**:

- Add parsing directly to `orchestrateCommand.js`: rejected because orchestration already owns stage flow and subprocess behavior.
- Add parsing to `agentWorkflow.js`: rejected because it would turn shared workflow utilities into a collection of review-specific logic.

## Decision: Conservative Conflict Policy

**Rationale**: Only internally consistent approval can advance. A structured `changes_requested` must never be weakened to approval, and a structured approval cannot erase a Markdown `Changes Requested` heading.

**Policy**:

- Valid structured decision plus matching Markdown decision: use the structured decision.
- Valid structured decision with Markdown decision `Unknown`: use the structured decision.
- Valid structured decision conflicting with Markdown decision: classify the review as `Unknown`.
- Present but invalid or unsupported structured block: classify the review as `Unknown`.
- Absent structured block: retain existing Markdown-only behavior.

## Decision: Additive Artifacts and State Fields

**Rationale**: Existing run artifacts and state files must remain readable. Structured data is useful only when valid, so valid structured reviews are written as separate JSON artifacts and state gains additive status/path fields.

**Alternatives considered**:

- Embed structured data inside the raw Markdown artifact only: rejected because the orchestrator needs a stable JSON artifact for replay and diagnostics.
- Rewrite existing review run records: rejected for backward compatibility.

## Decision: No Cross-Review Finding Lifecycle

**Rationale**: Stable IDs are required only within one artifact for deterministic handoff. Tracking whether findings are new, resolved, or still open across re-reviews is explicitly out of scope.
