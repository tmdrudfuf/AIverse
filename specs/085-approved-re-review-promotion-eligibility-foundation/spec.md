# Spec 085 - Approved Re-Review Promotion Eligibility Foundation

**Feature Branch**: `codex/085-approved-re-review-promotion-eligibility-foundation`
**Created**: 2026-08-09
**Status**: Draft
**Input**: User description: "Approved Re-Review Promotion Eligibility Foundation"

## User Scenarios & Testing

### User Story 1 - Promote Approved Re-Review (Priority: P1)

As the human operator, I need an Approved post-validation re-review to become eligible for the same explicit Promote action as the original review, so the continuation flow can finish only after fresh post-validation review evidence approves the fixed work.

**Why this priority**: This is the final positive path after a validation and re-review cycle; without it, approved fixes cannot be promoted safely.

**Independent Test**: Complete a post-validation re-review with an Approved decision, confirm no promotion is recorded automatically, then press Promote and verify the recorded promotion belongs to the post-validation reviewer runtime and review target.

**Acceptance Scenarios**:

1. **Given** a completed validation runtime and a completed post-validation re-review with an Approved decision, **When** the dashboard evaluates promotion eligibility, **Then** it treats the fresh post-validation reviewer runtime as promotable and does not require the old pre-validation reviewer runtime.
2. **Given** that Approved post-validation re-review, **When** the human presses Promote, **Then** exactly one current Review Promotion is recorded for the post-validation reviewer runtime and review target.
3. **Given** an Approved post-validation re-review has just completed, **When** the human has not pressed Promote, **Then** no Review Promotion is created automatically.

### Edge Cases

- Historical promotions for older reviewer runtimes remain visible in state but MUST NOT make the fresh post-validation re-review appear already promoted.
- Repeated Promote for the same post-validation reviewer runtime remains idempotent and MUST NOT create duplicate promotions.
- A stale or missing post-validation review target MUST block promotion rather than falling back to pre-validation review evidence.
- Promotion recording MUST NOT start validation, repository mutation, GitHub mutation, push, PR creation, merge, deployment, or publication.

## Requirements

### Functional Requirements

- **FR-001**: System MUST classify promotion eligibility for an Approved post-validation re-review using the reviewer runtime/result tied to the active post-validation review target.
- **FR-002**: System MUST render an Approved post-validation re-review with no current promotion as eligible for the existing human Promote action.
- **FR-003**: System MUST ignore historical Review Promotions when determining whether the active post-validation reviewer runtime is already promoted.
- **FR-004**: System MUST record a Review Promotion for the post-validation reviewer runtime and review target only after explicit human Promote input.
- **FR-005**: System MUST preserve historical pre-validation and prior-cycle promotions byte-for-byte when a new post-validation promotion is recorded.
- **FR-006**: System MUST retain safety flags proving promotion eligibility and promotion recording did not start validation, repository mutation, GitHub mutation, push, PR creation, merge, deployment, or publication.

### Key Entities

- **Post-Validation Review Target**: The fresh review target created from a completed validation runtime after review fixes have been applied.
- **Reviewer Runtime**: The reviewer execution record whose decision determines whether promotion is currently eligible.
- **Review Promotion**: The immutable human promotion record for an Approved reviewer runtime.
- **Review Decision Classification**: The derived current eligibility state used by both dashboard display and Promote preconditions.

## Success Criteria

### Measurable Outcomes

- **SC-001**: After an Approved post-validation re-review, the dashboard reports the current review decision as promotable before any promotion exists.
- **SC-002**: Pressing Promote after an Approved post-validation re-review creates exactly one Review Promotion whose reviewer runtime and review target match the post-validation re-review.
- **SC-003**: A historical promotion for an older reviewer runtime is never displayed or treated as the current promotion for the fresh post-validation reviewer runtime.
- **SC-004**: Re-review completion alone creates zero Review Promotions.
- **SC-005**: Promotion and promotion result records keep all remote, repository, validation, and publication side-effect flags false.

## Assumptions

- The existing post-validation target, reviewer runtime, review decision, and Review Promotion services remain the correct architectural boundary.
- The existing human Promote input remains the only user action that records a promotion.
- ADOS validation is required for final acceptance but is run outside this handoff runtime.
