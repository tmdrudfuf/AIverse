# Feature Specification: Candidate Task Promotion Approval Foundation

**Feature Branch**: `codex/065-candidate-task-promotion-approval-foundation`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Implement a deterministic, provider-neutral Candidate Task promotion approval foundation. Human decisions may approve, reject, defer, request review, or reset Candidate Task proposals, but approval must not create active work, mutate employees, start sessions, invoke agents, or mutate GitHub."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Evaluate promotion eligibility (Priority: P1)

As a project operator, I can see whether a Candidate Task with an assignment recommendation is eligible for human promotion review before I make any decision.

**Why this priority**: Eligibility is the safety gate between candidate proposals and any future promotion step. It prevents approval from being confused with execution.

**Independent Test**: Given Candidate Task and assignment recommendation collections, promotion review records are derived with deterministic eligibility states, reason codes, stable identifiers, and no mutation of tasks, recommendations, employees, work sessions, or provider state.

**Acceptance Scenarios**:

1. **Given** an open Candidate Task with a `Recommended` assignment, **When** promotion review records are derived, **Then** the item is eligible and remains `PendingReview`.
2. **Given** a closed Candidate Task, **When** promotion review records are derived, **Then** the item is `Ineligible` and cannot be approved.
3. **Given** assignment recommendations are unavailable or belong to another project, **When** promotion review records are derived, **Then** the item is not approvable and explains the reason.

---

### User Story 2 - Record local human promotion decisions (Priority: P1)

As a project operator, I can explicitly record a local decision to approve for future promotion, reject, defer, request review, or reset a Candidate Task proposal without starting work.

**Why this priority**: Spec 065 introduces the human-controlled decision layer. The decision must be traceable but must not activate the task.

**Independent Test**: Applying decision transitions updates the same stable decision record, rejects unsafe transitions, preserves project isolation, and never creates ProjectTasks, work sessions, employee mutations, provider mutations, or AI execution.

**Acceptance Scenarios**:

1. **Given** an eligible pending Candidate Task, **When** the human approves it, **Then** the decision status becomes `Approved`, `activeTaskCreated` remains `false`, and `executionStarted` remains `false`.
2. **Given** an ineligible Candidate Task, **When** the human attempts approval, **Then** the decision is not approved and no execution side effect occurs.
3. **Given** a human previously deferred a Candidate Task, **When** upstream Candidate Task data refreshes with the same identity, **Then** the deferred decision remains associated with that Candidate Task.

---

### User Story 3 - Display promotion review safely (Priority: P2)

As a project operator viewing the project dashboard, I can see promotion review state below issue, Candidate Task, and assignment recommendation rows with wording that distinguishes approval-for-promotion from active work.

**Why this priority**: The feature must be visible in the existing dashboard but remain the lowest-priority planning row and never imply that work started.

**Independent Test**: Render dashboard fixtures for pending, approved, rejected, deferred, needs-review, ineligible, and unavailable states; verify bounded text, `+N more`, action labels, and row priority below assignments.

**Acceptance Scenarios**:

1. **Given** promotion reviews exist, **When** the dashboard renders, **Then** a `[PROMOTION REVIEW]` row shows count, selected proposal, status, eligibility, reason, and safe actions.
2. **Given** the lower dashboard panel is crowded, **When** rows are fitted, **Then** promotion review rows are dropped before assignment, Candidate Task, and issue rows.
3. **Given** an approved proposal, **When** the dashboard renders, **Then** it uses language such as "Approved for future promotion" and never says "Working", "Started", "Executing", or "Assigned and active".

### Edge Cases

- Empty succeeded Candidate Task collections produce an empty succeeded promotion review collection.
- Unavailable Candidate Task collections produce unavailable promotion review output, not a fabricated empty success.
- Missing assignment recommendation collections leave Candidate Tasks visible but not approvable.
- `NeedsReview`, `Unassigned`, and `Unavailable` assignment recommendations are visible but cannot be silently approved.
- Same Candidate Task ID in different projects does not collide.
- Candidate Task refresh retains matching human decisions when identity is stable.
- Candidate Task closure after approval updates eligibility while preserving historical decision status.
- Long titles, employee names, notes, and reasons are bounded in dashboard rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define provider-neutral promotion review and decision models separate from Candidate Tasks, assignment recommendations, ProjectTasks, and work sessions.
- **FR-002**: The system MUST consume existing `CandidateTaskCollection` values and MUST NOT remap GitHub issues or call GitHub.
- **FR-003**: The system MUST consume existing `CandidateAssignmentRecommendationCollection` values and MUST NOT rerun assignment matching for promotion.
- **FR-004**: The system MUST produce deterministic promotion review records keyed by project ID, Candidate Task ID, and promotion ruleset version.
- **FR-005**: Promotion approval MUST mean "approved for a future promotion step" and MUST NOT create active ProjectTasks, mutate employees, start work sessions, invoke Codex, invoke Claude, mutate repositories, mutate GitHub issues, or schedule background work.
- **FR-006**: The system MUST support local human decision statuses `PendingReview`, `Approved`, `Rejected`, `Deferred`, `NeedsReview`, `Ineligible`, and `Unavailable`.
- **FR-007**: Eligibility evaluation MUST distinguish open eligible tasks, closed tasks, unavailable Candidate Task source, missing assignment recommendation, stale assignment recommendation, malformed provenance, no suitable employee, needs-review assignment, unassigned assignment, and unavailable assignment.
- **FR-008**: `Recommended` assignment recommendations MAY be eligible for human approval when Candidate Task data and provenance are valid.
- **FR-009**: `NeedsReview`, `Unassigned`, and `Unavailable` assignment recommendations MUST remain visible but MUST NOT be silently approvable in this foundation.
- **FR-010**: Human decisions MUST update the same logical decision identity rather than creating unrelated duplicates.
- **FR-011**: Invalid transitions MUST fail safely and MUST NOT mutate upstream Candidate Tasks, assignment recommendations, employees, tasks, work sessions, or providers.
- **FR-012**: Human decisions MUST be stored only in local in-memory controller/session state.
- **FR-013**: Human decisions MUST be isolated by project and Candidate Task identity.
- **FR-014**: Upstream refresh MUST retain matching human decisions, update eligibility from current upstream data, and avoid showing stale recommendations under another project.
- **FR-015**: Exposed promotion data and nested arrays/metadata MUST be defensively copied.
- **FR-016**: The project dashboard MUST clearly distinguish `[ISSUES]`, `[CANDIDATE TASKS]`, `[ASSIGNMENT RECOMMENDATIONS]`, and `[PROMOTION REVIEW]`.
- **FR-017**: Promotion review rows MUST be lower priority than issue rows, Candidate Task rows, and assignment recommendation rows.
- **FR-018**: Dashboard language MUST NOT imply active execution caused by this feature.

### Key Entities

- **CandidatePromotionReview**: A per-Candidate Task projection combining Candidate Task, assignment recommendation, eligibility, and current local human decision.
- **CandidatePromotionDecision**: A local immutable decision record for one Candidate Task identity and promotion ruleset version.
- **CandidatePromotionReviewCollection**: Per-project promotion review projection derived from Candidate Tasks, assignment recommendations, and local decisions.
- **CandidatePromotionEligibility**: Deterministic evaluator output with eligibility state and reason codes.
- **CandidatePromotionService**: Controller-facing service that derives review collections and applies safe decision transitions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused tests prove eligibility behavior for open, closed, unavailable, missing recommendation, stale recommendation, no-match, and malformed provenance cases.
- **SC-002**: Focused tests prove allowed decision transitions, invalid transition rejection, stable decision identity, repeated-decision idempotency, and project isolation.
- **SC-003**: Focused tests prove defensive copying for decisions, review collections, reason arrays, provenance, Candidate Task data, and assignment recommendation data.
- **SC-004**: Controller tests prove promotion uses existing Candidate Task and assignment recommendation state only, performs no GitHub reads or writes, creates no ProjectTasks, creates no work sessions, mutates no employees, and records approval only locally.
- **SC-005**: View tests prove all promotion statuses render with bounded text, safe action labels, no execution language, `+N more`, no overlap, and lower priority than assignment rows.
- **SC-006**: Full validation passes with `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Durable persistence is deferred; local decisions are in-memory for the active controller/session only.
- This foundation does not implement human override approval for no-match or unavailable assignment outcomes.
- The existing project dashboard keyboard input remains intentionally small: Up/Down select promotion review rows when present, Enter approves an eligible selected proposal, and Action cycles safe local decisions without starting work.
- Removed Candidate Tasks are omitted from current review rows, while matching identities retain decisions if they reappear during the same session.
