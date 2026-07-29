# Feature Specification: Approved Candidate ProjectTask Promotion Foundation

**Feature Branch**: `codex/066-approved-candidate-project-task-promotion-foundation`

**Created**: 2026-07-28

**Status**: Draft

**Input**: User description: "Promote a human-approved Candidate Task into an active local ProjectTask, without starting work, assigning employees, invoking AI agents, or mutating GitHub."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Promote an approved Candidate Task (Priority: P1)

As a project operator, I can explicitly promote an approved Candidate Task into the existing AIverse ProjectTask list so the proposal becomes a trackable task.

**Why this priority**: This is the first boundary where approved planning data becomes a real local ProjectTask, and it must be explicit, deterministic, and safe.

**Independent Test**: Given an approved promotion decision, matching open Candidate Task, matching recommended assignment, and existing task collection, one explicit promote command creates exactly one `Todo` ProjectTask with stable provenance and no execution side effects.

**Acceptance Scenarios**:

1. **Given** an open Candidate Task with a valid `Recommended` assignment and an `Approved` human decision, **When** the human promotes it, **Then** exactly one local ProjectTask is created with a deterministic ID and `Todo` status.
2. **Given** the same approved Candidate Task is promoted again, **When** the human repeats the command, **Then** no duplicate ProjectTask is created and the result reports the existing promoted task.
3. **Given** an approved Candidate Task is promoted, **When** the ProjectTask is displayed, **Then** it is unassigned, not started, and traceable to the source Candidate Task and issue.

---

### User Story 2 - Block unsafe or stale promotion (Priority: P1)

As a project operator, I need the system to revalidate current Candidate Task, assignment recommendation, and decision data at promotion time before creating a ProjectTask.

**Why this priority**: Approval can become stale. Promotion must not rely only on a previously rendered dashboard row.

**Independent Test**: Promotion attempts for pending, rejected, deferred, needs-review, ineligible, unavailable, closed, stale-project, stale-recommendation, missing-recommendation, and malformed-provenance inputs return explicit blocked results and create no ProjectTask.

**Acceptance Scenarios**:

1. **Given** a Candidate Task whose local decision is not `Approved`, **When** promotion is requested, **Then** promotion is rejected and no ProjectTask is created.
2. **Given** an approved Candidate Task has become closed, **When** promotion is requested, **Then** promotion is blocked as currently ineligible and the prior approval remains a historical decision only.
3. **Given** an assignment recommendation belongs to another project or Candidate Task, **When** promotion is requested, **Then** promotion is blocked as stale.

---

### User Story 3 - Show promotion results safely (Priority: P2)

As a project operator viewing the project dashboard, I can see whether an approved Candidate Task has been promoted, already existed, or was blocked without implying that work started.

**Why this priority**: The new ProjectTask boundary must be visible, but dashboard wording and layout must preserve the distinction between active records and started work.

**Independent Test**: Render dashboard fixtures for approved-not-promoted, promoted, already-promoted, blocked, multiple promoted tasks, long titles, and crowded panels; verify bounded text, `+N more`, safe language, and row priority below existing ProjectTask/Candidate/assignment rows.

**Acceptance Scenarios**:

1. **Given** a promotion succeeds, **When** the dashboard renders, **Then** it shows a promotion result and the created active ProjectTask as `Todo`, unassigned, and not started.
2. **Given** promotion is blocked, **When** the dashboard renders, **Then** it shows a concise safe reason and does not hide the Candidate Task.
3. **Given** the lower dashboard panel is crowded, **When** rows are fitted, **Then** promotion result rows are dropped before promotion review, assignment, Candidate Task, issue, and active task detail rows.

### Edge Cases

- Repeated promotion commands and repeated keypresses do not duplicate ProjectTasks.
- Existing manually created tasks remain unchanged, even when titles match promoted Candidate Tasks.
- Two different Candidate Tasks with the same title create distinct promoted ProjectTasks.
- Same Candidate Task ID in different projects does not collide.
- Candidate Task closure after promotion does not delete the created ProjectTask.
- Upstream refresh never auto-promotes merely because a decision is `Approved`.
- Missing or unavailable task collections produce explicit unavailable results.
- Long titles, task IDs, employee names, and reason summaries are bounded in dashboard rows.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define provider-neutral promotion result and promoted-task mapping models separate from Candidate Tasks, assignment recommendations, promotion decisions, employee state, and work sessions.
- **FR-002**: The system MUST reuse existing Candidate Task collections, assignment recommendation collections, promotion decisions, and ProjectTask collections.
- **FR-003**: The system MUST NOT remap GitHub issues, reread GitHub, mutate GitHub, close issues, create comments, create PRs, create branches, or perform remote persistence.
- **FR-004**: Promotion MUST require an explicit human command and MUST NOT occur during render, refresh, approval, or dashboard selection.
- **FR-005**: Promotion MUST revalidate current Candidate Task, assignment recommendation, promotion decision, and existing ProjectTask state at command time.
- **FR-006**: A Candidate Task MUST be promotable only when it exists, is open, has valid provenance, has a matching `Approved` human promotion decision, has a same-project matching assignment recommendation, that recommendation is `Recommended`, and no ProjectTask already exists for the same Candidate Task.
- **FR-007**: `NeedsReview`, `Unassigned`, and `Unavailable` assignment recommendation outcomes MUST block promotion.
- **FR-008**: Non-approved promotion decisions (`PendingReview`, `Rejected`, `Deferred`, `NeedsReview`, `Ineligible`, `Unavailable`) MUST block promotion.
- **FR-009**: The promoted ProjectTask identifier MUST be deterministic from project ID, Candidate Task ID, and promotion ruleset version.
- **FR-010**: Repeated promotion of the same Candidate Task MUST be idempotent and return an `AlreadyPromoted` result without creating a duplicate task.
- **FR-011**: Duplicate detection MUST use stable provenance, at minimum project ID and Candidate Task ID, and MUST NOT rely only on title.
- **FR-012**: Created ProjectTasks MUST use a non-executing initial status and MUST remain unassigned.
- **FR-013**: Promotion MUST NOT mutate employee state, increment workload, trigger movement, create a work session, assign a recommended employee, invoke Codex, invoke Claude, start execution, schedule work, or mark a task complete.
- **FR-014**: Promotion MUST preserve existing ProjectTasks, statuses, assignees, activity logs, and ordering, appending promoted tasks deterministically.
- **FR-015**: Promotion result records MUST include status, reason codes, deterministic ID, created ProjectTask ID when applicable, duplicate indicator, candidate provenance, active-task-created flag, employee-assigned flag fixed to false, work-started flag fixed to false, and execution-started flag fixed to false.
- **FR-016**: Promotion result data and nested reason/provenance arrays MUST be defensively copied.
- **FR-017**: The controller MUST expose an explicit promote command, refresh existing ProjectTask views after success, and isolate results by project.
- **FR-018**: The dashboard MUST distinguish `[PROMOTION REVIEW]`, active ProjectTask rows, and low-priority promotion result rows.
- **FR-019**: Dashboard wording MUST say "Promoted to project task", "Not started", "Unassigned", "Already promoted", or "Promotion blocked" and MUST NOT imply automatic work execution.
- **FR-020**: Promotion result rows MUST be lower priority than existing ProjectTask detail rows, issue rows, Candidate Task rows, assignment rows, and promotion review rows.

### Key Entities

- **CandidateProjectTaskPromotionRequest**: A human-triggered request to promote one Candidate Task for one project.
- **CandidateProjectTaskPromotionResult**: Immutable result of a promotion attempt, including status, reason codes, provenance, and created ProjectTask reference when successful.
- **CandidateProjectTaskPromotionService**: Deterministic validator and mapper from approved Candidate Task data into ProjectTask collection updates.
- **Promoted ProjectTask Provenance**: Provider-neutral metadata encoded in the created ProjectTask description/activity log so the ProjectTask remains traceable without a parallel task type.
- **Promotion Result Collection**: Per-project in-memory collection of latest promotion attempt results for dashboard display.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused tests prove promotion eligibility for approved, pending, rejected, deferred, needs-review, ineligible, unavailable, closed, stale, malformed, missing-recommendation, unassigned, and unavailable-recommendation cases.
- **SC-002**: Focused tests prove ProjectTask mapping preserves title, summary, priority, source provenance, deterministic task ID, `Todo` status, unassigned state, and false execution flags.
- **SC-003**: Focused tests prove idempotency, duplicate prevention, same-title distinct-task behavior, same Candidate Task across projects, and existing-task safety.
- **SC-004**: Controller tests prove explicit promotion uses existing Candidate Task, assignment, decision, and ProjectTask state, refreshes task views, and performs no provider, employee, work-session, AI, or GitHub mutation.
- **SC-005**: View tests prove promoted, already-promoted, blocked, not-started, unassigned, long-text, multi-result, and crowded-layout display behavior.
- **SC-006**: Full validation passes with `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Existing `ProjectTask.status = "Todo"` is the safest non-started state.
- Existing `ProjectTask.assignee` and `assigneeId` are optional, so promoted tasks can remain unassigned.
- Provenance can be preserved through deterministic ID, description text, and activity log metadata without creating a second ProjectTask type.
- Durable persistence remains limited to the existing local in-memory task provider/controller state; Firebase or browser persistence is deferred.
- The dashboard input model remains intentionally small: an approved selected promotion review can be promoted through an explicit action path without adding modal infrastructure.
