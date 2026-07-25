# Feature Specification: Reviewer Question Loop

**Feature Branch**: `codex/reviewer-question-loop`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "Implement a bounded one-round Reviewer clarification flow before final Approved or Changes Requested decisions in the local agent workflow."

## Clarifications

### Session 2026-07-25

- No critical ambiguities detected worth formal clarification. The feature scope is explicitly one question round, schema version 1 extension unless a version bump is required, local-only orchestration, and human-only remote mutation.

## User Scenarios & Testing

### User Story 1 - Reviewer Requests Clarification Before Final Decision (Priority: P1)

An AIverse maintainer can run the automated workflow when the Reviewer needs clarification, and the workflow asks the Implementer for one structured answer set before requesting a final Reviewer decision.

**Why this priority**: Reviewers sometimes need evidence or context before approving or requesting changes. The workflow should handle that handoff without manual prompt copying or unlimited conversation.

**Independent Test**: Use deterministic mock runners where the initial Reviewer returns a valid structured `questions` decision, the Implementer returns valid structured answers, the final Reviewer returns `approved`, validation passes, and the workflow reaches `human-merge-decision`.

**Acceptance Scenarios**:

1. **Given** the initial Reviewer returns valid structured questions, **When** `orchestrate` runs, **Then** the workflow writes the question review artifacts, runs the Implementer answer stage, writes answer artifacts, runs final review, and continues only from the final decision.
2. **Given** the final Reviewer approves after answers, **When** final validation passes, **Then** the workflow reaches `human-merge-decision` without consuming a fix cycle.

### User Story 2 - Continue Existing Fix Cycle After Final Changes Requested (Priority: P1)

An AIverse maintainer can still use the existing fix-cycle behavior when the final Reviewer decision after answers is `changes_requested`.

**Why this priority**: Clarification is not a substitute for fixing. If answers reveal a code change is required, the existing bounded fix loop should handle it.

**Independent Test**: Use mock runners where the initial Reviewer asks questions, the Implementer answers, the final Reviewer returns valid structured Changes Requested findings, and the workflow enters exactly one existing fix cycle without incrementing fix count for the question round.

**Acceptance Scenarios**:

1. **Given** the final Reviewer returns valid `changes_requested`, **When** fix cycles remain, **Then** the workflow starts the normal fix stage using structured blocking findings.
2. **Given** a question round occurred, **When** the workflow enters the fix stage, **Then** `fixCycleCount` reflects only actual fix attempts, not clarification.

### User Story 3 - Stop Safely on Invalid Clarification Data (Priority: P2)

An AIverse maintainer gets conservative behavior when questions or answers are malformed, unsafe, incomplete, duplicated, or repeated beyond the one-round limit.

**Why this priority**: Clarification content is untrusted artifact content and must not be interpreted as commands or as approval.

**Independent Test**: Use fixture outputs covering invalid question states, unsafe questions, invalid answer sets, timeouts, repeated final `questions`, and resume cases.

**Acceptance Scenarios**:

1. **Given** a structured `questions` decision contains blocking findings or no questions, **When** orchestration evaluates it, **Then** it blocks without running the Implementer answer stage.
2. **Given** Implementer answers are missing, duplicated, empty, or reference unknown question IDs, **When** orchestration validates answers, **Then** it blocks without running final review.
3. **Given** the final Reviewer asks questions again, **When** the workflow has already used the one allowed question round, **Then** it blocks as `Unknown` or equivalent conservative terminal state.

### Edge Cases

- Markdown-only reviews continue to work for Approved and Changes Requested.
- Existing Spec 050 structured review artifacts remain readable.
- `approved` with questions or blocking findings is invalid.
- `changes_requested` with unanswered questions is invalid.
- `questions` with blocking findings or an empty question list is invalid.
- Duplicate question IDs are invalid.
- Questions requesting secrets, remote mutation, command execution, bypassing validation, or unrelated work are invalid.
- Answer sets with missing, duplicate, unknown, or extra answers are invalid.
- Answer-stage and final-review timeouts block safely.
- Resume from pending answer or final-review stage does not repeat completed stages.
- Role-swapped Implementer/Reviewer configurations continue to work.

## Requirements

### Functional Requirements

- **FR-001**: The structured review contract MUST support a backward-compatible `decision: "questions"` state in schema version 1.
- **FR-002**: A `questions` decision MUST contain at least one valid question and MUST contain no blocking findings.
- **FR-003**: `approved` MUST contain no questions and no blocking findings.
- **FR-004**: `changes_requested` MUST contain no questions and at least one valid actionable blocking finding.
- **FR-005**: Mixed decision states MUST be rejected conservatively and MUST NOT reach final verification or start a fix cycle.
- **FR-006**: Each question MUST include unique `id`, non-empty `question`, and non-empty `reason`.
- **FR-007**: Questions MUST reject content that requests secrets, credentials, remote mutation, command execution, validation bypass, safety-rule bypass, or unrelated work.
- **FR-008**: The workflow MUST support exactly one clarification round before the final Reviewer decision.
- **FR-009**: The Implementer answer stage MUST be clarification-only and MUST instruct the Implementer not to edit files, commit, reinterpret the stage as a fix request, or mutate remote state.
- **FR-010**: Implementer answers MUST be captured as raw Markdown/text and, when valid, as a separate structured answer JSON artifact.
- **FR-011**: Every answer MUST reference exactly one known question ID, every question MUST receive exactly one answer, and duplicate or unknown answers MUST be rejected.
- **FR-012**: Empty answers MUST be rejected. Evidence MAY be omitted but MUST NOT be invented by the workflow.
- **FR-013**: After valid answers, the workflow MUST run one final Reviewer review using original review artifacts, normalized questions, raw answer artifact, and normalized answers.
- **FR-014**: A final Reviewer `questions` decision after the answer stage MUST stop conservatively and MUST NOT start another question loop.
- **FR-015**: Question requests MUST NOT consume fix-cycle count.
- **FR-016**: Existing Approved and Changes Requested flows from Specs 049 and 050 MUST remain backward compatible.
- **FR-017**: The workflow MUST persist additive state fields for question status, questions, answers, diagnostics, artifact paths, and question-cycle count.
- **FR-018**: Dry-run MUST display conditional question-loop stages and prompt paths without spawning subprocesses, mutating state, writing artifacts, modifying files, or performing remote operations.
- **FR-019**: All generated runtime files MUST remain under `.agent-workflow/` and MUST NOT be committed.
- **FR-020**: Remote mutation boundaries MUST remain unchanged and human-only.

### Key Entities

- **Reviewer Question Review**: A structured review with `decision: "questions"` and validated questions.
- **Reviewer Question**: A provider-neutral question requiring Implementer clarification before final review.
- **Implementer Answer Set**: A separate structured answer artifact mapping each question ID to exactly one answer.
- **Final Review**: The Reviewer decision after answers; it may approve or request changes but must not ask questions again in this spec.
- **Question Cycle**: The single allowed clarification round for one orchestration run.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A mock-runner E2E workflow can complete `review -> questions -> answer -> final-review -> approved -> final-verification -> human-merge-decision` with zero fix cycles.
- **SC-002**: Automated tests cover valid question parsing, invalid mixed states, unsafe questions, valid answers, invalid answer sets, final review Approved, final review Changes Requested, repeated questions, resume, role swap, timeouts, and existing Spec 050 compatibility.
- **SC-003**: Invalid clarification data never advances to final verification, approval, or fix.
- **SC-004**: Full repository validation passes before commit.

## Assumptions

- The feature remains local-only and extends `tools/agent-workflow`.
- Schema version 1 can be extended backward-compatibly because older artifacts using only `approved` and `changes_requested` remain valid.
- Multi-round question negotiation, question lifecycle tracking, and PR comment integration are deferred.
