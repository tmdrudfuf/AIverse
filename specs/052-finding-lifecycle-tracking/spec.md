# Feature Specification: Finding Lifecycle Tracking

**Feature Branch**: `codex/finding-lifecycle-tracking`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description: "Implement Spec 052 - Finding Lifecycle Tracking for blocking and non-blocking review findings across review and fix/re-review cycles."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Track Initial Findings (Priority: P1)

An agent workflow operator runs an implementation through review and receives a machine-readable record of every blocking and non-blocking finding that the Reviewer raised.

**Why this priority**: The workflow cannot safely reason about later fixes unless the first set of findings is preserved with stable identities.

**Independent Test**: Run an initial review that returns Changes Requested with structured findings and verify the workflow records each finding as currently open/new without requiring lifecycle metadata.

**Acceptance Scenarios**:

1. **Given** no previous finding history, **When** the Reviewer returns a valid structured Changes Requested review with blocking finding `F1`, **Then** the workflow records `F1` as new and active.
2. **Given** no previous finding history, **When** the Reviewer returns Approved with no findings, **Then** the workflow records no active findings and may continue toward final verification.
3. **Given** no previous finding history, **When** the Reviewer returns Markdown-only Changes Requested, **Then** legacy heuristic behavior remains available for the initial fix handoff.

---

### User Story 2 - Classify Findings on Re-review (Priority: P1)

After an Implementer fixes review feedback, the Reviewer can classify every prior finding as `still_open` or `resolved`, and introduce genuinely new findings as `new`.

**Why this priority**: Re-review must not lose previous findings, repeatedly present the same issue as new, or approve while unresolved blocking findings remain.

**Independent Test**: Run a fix/re-review cycle where prior finding `F1` is resolved and verify the workflow records the resolution and advances only when no blocking finding remains open.

**Acceptance Scenarios**:

1. **Given** prior blocking finding `F1`, **When** re-review classifies `F1` as `resolved` and returns Approved with no blocking findings, **Then** final verification may run.
2. **Given** prior blocking finding `F1`, **When** re-review classifies `F1` as `still_open` and includes current blocking finding `F1`, **Then** the next fix cycle targets `F1` if the fix-cycle budget remains.
3. **Given** prior blocking finding `F1`, **When** re-review classifies `F1` as `resolved` and introduces current blocking finding `F2` marked `new`, **Then** the next fix cycle targets only active blocker `F2`.

---

### User Story 3 - Stop on Invalid Lifecycle Data (Priority: P1)

When the Reviewer omits or contradicts required lifecycle metadata, the workflow stops conservatively instead of approving, discarding history, or starting a blind fix cycle.

**Why this priority**: Lifecycle metadata is a safety boundary. Invalid lifecycle data must not be interpreted as evidence that findings were fixed.

**Independent Test**: Run a re-review with a previous structured finding and missing lifecycle classifications; verify the workflow ends as Unknown or blocked and does not enter fix or final verification.

**Acceptance Scenarios**:

1. **Given** prior finding `F1`, **When** re-review omits a classification for `F1`, **Then** the workflow stops safely.
2. **Given** prior finding `F1`, **When** re-review marks `F1` as `new`, **Then** the workflow rejects the lifecycle result.
3. **Given** prior blocking finding `F1`, **When** re-review returns Approved while `F1` is `still_open`, **Then** approval is rejected.

---

### User Story 4 - Preserve Question Loop Semantics (Priority: P2)

If a Reviewer asks clarification questions before a final decision, lifecycle classification applies only to the final decision-producing review after the Implementer answers.

**Why this priority**: Spec 051 question loops must remain bounded and must not accidentally resolve or consume findings.

**Independent Test**: Run a re-review that asks questions, collect valid answers, then run final review with lifecycle classifications and verify lifecycle history updates once.

**Acceptance Scenarios**:

1. **Given** prior finding `F1`, **When** re-review asks questions, **Then** no lifecycle classification is finalized yet.
2. **Given** valid answers for a re-review question round, **When** final review classifies `F1`, **Then** the workflow applies lifecycle once to the final review.

### Edge Cases

- Re-review lacks structured lifecycle data while previous structured findings exist.
- A lifecycle entry references an unknown ID not present in current findings.
- A previous finding is marked `new`.
- A new current finding is marked `resolved`.
- A resolved finding remains in current blocking findings.
- A still-open finding is omitted from current findings.
- A reused finding ID changes severity or summary/recommendation in a way that breaks continuity.
- A repeated `questions` decision after answers must still stop safely.
- Interrupted runs must not duplicate lifecycle transitions on resume.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The workflow MUST record structured blocking and non-blocking findings from an initial review as finding history entries.
- **FR-002**: Initial review lifecycle metadata MUST be optional; current findings are treated as `new` when no previous finding history exists.
- **FR-003**: Re-review and final-review after questions MUST require valid lifecycle classifications when previous structured findings exist.
- **FR-004**: Supported lifecycle statuses MUST be exactly `new`, `still_open`, and `resolved`.
- **FR-005**: Every previous finding MUST receive exactly one lifecycle classification on lifecycle-required reviews.
- **FR-006**: New current findings MUST be classified as `new` and MUST NOT reuse an existing finding ID from the same workflow run.
- **FR-007**: Previous findings MUST NOT be classified as `new`.
- **FR-008**: Current findings classified as `still_open` MUST reuse the previous finding ID and remain present in the current finding set.
- **FR-009**: Current findings classified as `resolved` MUST NOT appear as current blocking findings.
- **FR-010**: Approval MUST be impossible while any previous blocking finding is classified `still_open`.
- **FR-011**: Changes Requested MUST require at least one actionable current blocking finding after lifecycle normalization.
- **FR-012**: Invalid lifecycle metadata MUST produce Unknown or a blocked terminal state and MUST NOT start a fix cycle or final verification.
- **FR-013**: The workflow MUST preserve raw Markdown review artifacts, raw structured review artifacts, normalized lifecycle JSON artifacts, and lifecycle diagnostics.
- **FR-014**: The Implementer fix prompt MUST include only active open blocking findings and MUST exclude resolved findings from active fix instructions.
- **FR-015**: Reused finding IDs MUST pass deterministic continuity checks for ID, severity, summary, and recommendation presence; incompatible reuse MUST be rejected.
- **FR-016**: Markdown-only initial reviews MUST keep existing behavior; Markdown-only re-reviews with previous structured findings MUST stop conservatively.
- **FR-017**: Question reviews MUST NOT finalize lifecycle status; lifecycle applies only to the final Approved or Changes Requested review after valid answers.
- **FR-018**: Missing lifecycle fields in old state files MUST default safely without making old files unreadable.
- **FR-019**: Resume MUST NOT duplicate completed lifecycle transitions or erase existing finding history.
- **FR-020**: Remote mutation boundaries MUST remain human-only and unchanged.

### Key Entities *(include if feature involves data)*

- **Structured Finding**: A Reviewer-supplied blocking or non-blocking issue with an ID, severity, summary, optional location context, reason, and recommendation.
- **Finding History Entry**: The workflow's additive record of a finding ID, kind, severity, first/last seen sequence, current status, and source artifact paths.
- **Lifecycle Classification**: A Reviewer-supplied status for one finding ID in one review sequence.
- **Normalized Lifecycle**: A workflow-generated JSON artifact summarizing previous findings, classifications, new findings, still-open findings, resolved findings, diagnostics, and review sequence.
- **Review Sequence**: A monotonically increasing number for decision-producing reviews within one orchestration run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of previous structured findings receive exactly one accepted lifecycle classification on lifecycle-required re-reviews.
- **SC-002**: 100% of invalid lifecycle cases in the required test matrix stop before fix or final verification.
- **SC-003**: Active fix prompts include zero resolved findings across lifecycle smoke tests.
- **SC-004**: Existing Spec 050 and Spec 051 tests remain green without requiring live AI agents.
- **SC-005**: A mock E2E run demonstrates `F1` Changes Requested, fix, `F1` resolved, Approved, final verification, and human merge decision.

## Assumptions

- Finding IDs are stable only within the current orchestration run or feature review history.
- Structured Review schema version 1 can be extended additively with optional `findingLifecycle` without a version increment.
- Deterministic continuity checks compare explicit fields and do not attempt semantic matching.
- Cross-PR memory, waivers, GitHub review-thread sync, and multi-reviewer consensus are out of scope.
