# Spec 086 - Approved Re-Review Promotion Execution Foundation

**Feature Branch**: `codex/086-approved-re-review-promotion-execution-foundation`

**Created**: 2026-08-10

**Status**: Draft

**Input**: User description: "Approved Re-Review Promotion Execution Foundation"

## User Scenarios & Testing

### User Story 1 - Execute Approved Re-Review Promotion (Priority: P1)

As the human operator, I need the Promote action after an Approved post-validation re-review to record the final Review Promotion and result for the fresh reviewer runtime, so the continuation flow has a durable, auditable completion record without triggering any downstream execution.

**Why this priority**: Eligibility alone is not enough; the positive re-review path must finish with an explicit human promotion record that can be reviewed later and does not accidentally start validation, repository mutation, or remote publishing.

**Independent Test**: Complete the validation and post-validation re-review continuation with an Approved decision, press Promote, then verify exactly one current promotion/result is recorded for the post-validation reviewer runtime and no downstream execution state changes.

**Acceptance Scenarios**:

1. **Given** a completed post-validation re-review with an Approved decision and no current post-validation promotion, **When** the human presses Promote, **Then** the system records a granted Review Promotion result for the post-validation reviewer runtime.
2. **Given** the human has just promoted that Approved post-validation re-review, **When** the promotion record is inspected, **Then** it references the post-validation review target and reviewer runtime rather than the original pre-validation review target.
3. **Given** the human presses Promote again for the same Approved post-validation re-review, **When** the request is processed, **Then** the existing promotion remains the single current promotion and the result reports an idempotent already-promoted outcome.
4. **Given** the Promote action is processed, **When** the surrounding workflow state is inspected, **Then** no validation, implementer, reviewer, repository, GitHub, push, pull request, merge, deployment, or publication step is started by promotion execution.

### Edge Cases

- A historical promotion for an older reviewer runtime remains immutable and MUST NOT be overwritten when the post-validation promotion is recorded.
- Promotion result records MUST remain deterministic for repeated Promote input on the same post-validation reviewer runtime.
- Re-review completion without explicit Promote input MUST NOT create a promotion or promotion result.
- Missing, stale, or non-Approved post-validation review evidence MUST block promotion rather than falling back to pre-validation review evidence.

## Requirements

### Functional Requirements

- **FR-001**: System MUST execute the existing human Promote action for an Approved post-validation re-review only after explicit human input.
- **FR-002**: System MUST record the Review Promotion against the current post-validation reviewer runtime and post-validation review target.
- **FR-003**: System MUST record a granted Review Promotion Result for the same post-validation reviewer runtime when promotion succeeds.
- **FR-004**: System MUST keep repeated Promote input idempotent for the same post-validation reviewer runtime and MUST NOT create duplicate promotions or results.
- **FR-005**: System MUST preserve historical promotions for older reviewer runtimes without rewriting, deleting, or treating them as the current post-validation promotion.
- **FR-006**: System MUST retain safety flags proving promotion execution did not start validation, implementer execution, reviewer execution, repository mutation, GitHub mutation, push, pull request, merge, deployment, or publication.

### Key Entities

- **Post-Validation Review Target**: The fresh review target produced after validation completes and fixes are ready for re-review.
- **Post-Validation Reviewer Runtime**: The reviewer execution record tied to the post-validation review target and Approved decision.
- **Review Promotion**: The immutable human promotion record proving the Approved reviewer runtime was explicitly promoted.
- **Review Promotion Result**: The deterministic result record proving whether the human promotion request was granted, blocked, or idempotently already promoted.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Pressing Promote after an Approved post-validation re-review creates exactly one current Review Promotion for the post-validation reviewer runtime.
- **SC-002**: The successful promotion result is granted, references the created promotion, and uses the same post-validation reviewer runtime identity.
- **SC-003**: Pressing Promote twice for the same Approved post-validation re-review leaves exactly one promotion and one current promotion result.
- **SC-004**: Promotion execution changes zero downstream execution counts for validation, reviewer runtime, implementer runtime, repository mutation, GitHub mutation, push, pull request, merge, deployment, or publication.
- **SC-005**: Historical pre-validation promotions remain byte-for-byte unchanged after the post-validation promotion is recorded.

## Assumptions

- Spec 085 already establishes that Approved post-validation re-reviews are eligible for Promote.
- The existing human Promote input remains the only user action that records a Review Promotion.
- ADOS validation and independent review are run outside this runtime per handoff policy.
