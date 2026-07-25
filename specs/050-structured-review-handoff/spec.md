# Feature Specification: Structured Review Handoff

**Feature Branch**: `codex/structured-review-handoff`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Evolve the Markdown-based review handoff into a provider-neutral structured review handoff while preserving human-readable review output and conservative workflow safety."

## User Scenarios & Testing

### User Story 1 - Capture Structured Reviewer Decisions (Priority: P1)

An AIverse maintainer can run the existing review workflows and receive both the human-readable Markdown review and a validated machine-readable review object when the Reviewer provides the structured payload.

**Why this priority**: Automated fix cycles need deterministic review data, but humans still need readable review evidence.

**Independent Test**: Use a mock Reviewer returning Markdown plus one designated fenced JSON structured review block and verify the workflow records the raw Markdown, validates the structured object, writes a structured JSON artifact, and classifies the decision consistently.

**Acceptance Scenarios**:

1. **Given** Reviewer output with `# Review Decision: Approved` and a valid structured payload with `decision: "approved"`, **When** the review command runs, **Then** the review is classified as `Approved`, the raw Markdown artifact remains present, and a structured JSON artifact is written.
2. **Given** Reviewer output with `# Review Decision: Changes Requested` and a valid structured payload with blocking findings, **When** orchestration evaluates the review, **Then** the workflow records structured review status `valid` and preserves blocking findings without synthesizing missing data.

### User Story 2 - Feed Structured Blocking Findings to Fix Prompts (Priority: P1)

An AIverse maintainer can let the automated loop send valid structured blocking findings to the Implementer for a focused fix cycle.

**Why this priority**: The handoff between Reviewer and Implementer must be deterministic and provider-neutral.

**Independent Test**: Use mock runners where the Reviewer returns structured `changes_requested`; verify the fix prompt includes finding IDs, severity, file path, location, summary, reason, recommendation, and the raw review path.

**Acceptance Scenarios**:

1. **Given** a valid structured `changes_requested` review with actionable blocking findings, **When** fix cycles remain, **Then** the Implementer fix prompt is generated from those structured findings and includes the raw Markdown review artifact path for context.
2. **Given** a valid structured `changes_requested` review with no actionable blocking findings, **When** orchestration evaluates the review, **Then** it blocks instead of starting a blind fix cycle.

### User Story 3 - Fail Conservatively on Invalid or Conflicting Structured Data (Priority: P2)

An AIverse maintainer receives conservative behavior when structured review data is absent, invalid, unsupported, duplicated, or conflicts with the Markdown decision.

**Why this priority**: Malformed machine-readable output must not fabricate approval or hide blocking findings.

**Independent Test**: Use deterministic fixture outputs covering absent blocks, malformed JSON, unsupported versions, invalid decisions, invalid severities, duplicate finding IDs, multiple structured blocks, unrelated JSON, and Markdown/structured decision conflicts.

**Acceptance Scenarios**:

1. **Given** Markdown-only Reviewer output, **When** no structured block is present, **Then** existing Markdown decision and finding extraction behavior remains available.
2. **Given** a malformed or unsupported structured block, **When** the Markdown says Approved, **Then** the workflow does not treat the result as approval and preserves diagnostics.
3. **Given** Markdown and structured decisions conflict, **When** the workflow reconciles the result, **Then** the outcome is `Unknown` and orchestration blocks conservatively.

### Edge Cases

- Markdown contains unrelated JSON outside the designated structured section.
- Multiple designated structured review blocks are present.
- Structured review has duplicate finding IDs.
- Blocking finding lacks actionable fields.
- Non-blocking findings exist without blocking findings.
- Optional reviewer questions are present.
- Existing state files do not include structured review fields.
- Existing Spec 049 direct approval and fix flows continue to work.
- Dry-run previews do not write structured review artifacts.
- Windows-style repository paths and artifact paths are used.

## Requirements

### Functional Requirements

- **FR-001**: Reviewer prompts MUST require the existing human-readable Markdown review plus exactly one designated fenced JSON structured review payload.
- **FR-002**: The structured payload MUST be provider-neutral and explicitly versioned with `schemaVersion: 1`.
- **FR-003**: The parser MUST locate only the designated structured review payload under the `## Structured Review` section and MUST ignore arbitrary JSON elsewhere.
- **FR-004**: The workflow MUST validate `schemaVersion`, `decision`, finding collections, finding IDs, severity values, and actionable blocking finding content.
- **FR-005**: Supported structured decisions MUST normalize to `approved` or `changes_requested`.
- **FR-006**: Supported severities MUST be `P0`, `P1`, `P2`, or `P3`.
- **FR-007**: Finding IDs MUST be unique within a single structured review.
- **FR-008**: The workflow MUST reject unsupported schema versions, invalid decisions, invalid severities, duplicate finding IDs, malformed JSON, and multiple designated structured blocks.
- **FR-009**: The workflow MUST preserve raw Reviewer Markdown output even when structured parsing fails.
- **FR-010**: A valid structured review MUST be written as a separate local JSON artifact beside the raw Markdown result.
- **FR-011**: Existing Markdown-only Reviewer output MUST remain backward compatible when no structured block is present.
- **FR-012**: Malformed, unsupported, or conflicting structured review data MUST never be treated as approval.
- **FR-013**: Markdown/structured decision conflicts MUST resolve to `Unknown` so orchestration blocks conservatively.
- **FR-014**: When valid structured blocking findings exist, fix prompts MUST use those findings instead of heuristic Markdown extraction.
- **FR-015**: When structured review is absent, orchestration MAY fall back to existing Markdown finding extraction.
- **FR-016**: When structured review is invalid or unsupported, orchestration MUST NOT silently fall back to a fix cycle.
- **FR-017**: A `changes_requested` review without actionable findings MUST block instead of starting a blind fix.
- **FR-018**: Existing state files and review run records without structured fields MUST remain readable.
- **FR-019**: Remote mutation boundaries MUST remain unchanged: no push, PR creation/editing/readiness/approval, merge, remote deletion, or mutating GitHub operation may be automated.

### Key Entities

- **Structured Review**: A versioned, provider-neutral machine-readable representation of one Reviewer decision and associated findings.
- **Structured Review Parse Result**: Parser output describing status (`valid`, `absent`, `invalid`, `unsupported`), normalized data when valid, and diagnostics when not valid.
- **Structured Finding**: A single Reviewer finding with stable in-artifact ID, severity, optional location data, summary, reason, and recommendation.
- **Review Handoff**: The combined raw Markdown artifact, optional structured JSON artifact, decision reconciliation metadata, and fix-prompt findings.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Automated tests cover valid approval, valid changes requested, invalid structured data, absent structured data, conflicts, and structured fix prompts.
- **SC-002**: Existing Spec 049 direct approval and fix-cycle tests continue to pass.
- **SC-003**: Invalid or conflicting structured review content never advances to final verification.
- **SC-004**: Raw Markdown review artifacts remain available for every real review run.
- **SC-005**: Full repository validation passes before commit.

## Assumptions

- This feature extends only local workflow tooling and Spec Kit documentation.
- The structured review schema is local JSON and does not require external services or new dependencies.
- Cross-review finding lifecycle tracking is deferred to a later spec.
