# Feature Specification: Candidate Task AI Employee Assignment Foundation

**Feature Branch**: `codex/064-candidate-task-ai-employee-assignment-foundation`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Implement a deterministic, provider-neutral AI employee assignment foundation that maps Candidate Tasks to suitable existing AIverse employees. Recommendations are proposals only and must not start work or mutate tasks, issues, employees, or remote providers."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Recommend an employee for candidate tasks (Priority: P1)

As a project operator viewing AIverse Candidate Tasks, I can see a deterministic recommendation for which existing AI employee appears suitable to handle each eligible candidate task.

**Why this priority**: This is the next planning layer after Spec 063, connecting candidate work proposals to existing AIverse employee capability data without activating work.

**Independent Test**: Given a candidate task collection and a set of existing employees, the assignment layer produces at most one primary recommendation per candidate task, with stable identifiers, match tier, reason codes, matched capabilities, and no mutation of candidate tasks or employees.

**Acceptance Scenarios**:

1. **Given** an open Bug candidate task and an available software-capable employee, **When** assignment recommendations are generated, **Then** the recommendation status is `Recommended`, the employee is identified, and the match tier is deterministic.
2. **Given** the same candidate task and employee data across two runs, **When** recommendations are generated, **Then** recommendation identifiers and ordering are identical.
3. **Given** a closed candidate task, **When** recommendations are generated, **Then** no employee is assigned and the recommendation explains that closed candidate tasks are not assignable proposals.

---

### User Story 2 - Handle no-match and unavailable states honestly (Priority: P1)

As a project operator, I can distinguish between no employees, no matching employee, unavailable candidate task input, and successful empty recommendation output.

**Why this priority**: The system must not invent an employee or imply assignment confidence where the data does not support it.

**Independent Test**: Generate recommendations with no employees, employees without required capabilities, empty candidate tasks, and unavailable candidate task collections; verify explicit states and reason codes.

**Acceptance Scenarios**:

1. **Given** there are no employees, **When** open candidate tasks are evaluated, **Then** each recommendation is unavailable or unassigned with a safe no-employee reason.
2. **Given** employees exist but none match a Research candidate task, **When** recommendations are generated, **Then** the recommendation is `NeedsReview` or `Unassigned` and no employee is invented.
3. **Given** candidate task mapping is unavailable, **When** recommendations are generated, **Then** the assignment recommendation collection remains unavailable rather than presenting a successful empty result.

---

### User Story 3 - Display assignment recommendations without implying work started (Priority: P2)

As a player viewing the project dashboard, I can see assignment recommendations separately from raw issues and candidate tasks, using language that makes clear no employee has started work.

**Why this priority**: The planning layer should be visible in the reachable dashboard while preserving the human-gated boundary before active assignment.

**Independent Test**: Render the project dashboard with candidate task recommendations and confirm rows are labeled as recommendations, show count, employee, role, task type, match tier, and status, and never use active-work language such as "started" or "in progress".

**Acceptance Scenarios**:

1. **Given** a recommended assignment exists, **When** the dashboard renders, **Then** `[ASSIGNMENT RECOMMENDATIONS]` and one bounded top recommendation row appear after Candidate Task rows when space allows.
2. **Given** no suitable employee exists, **When** the dashboard renders, **Then** the row clearly says no suitable employee or needs review.
3. **Given** the lower panel is space constrained, **When** assignment rows would overflow, **Then** assignment rows are dropped before Candidate Task rows and before Spec 062 issue detail rows.

### Edge Cases

- Empty succeeded candidate task collection: recommendation collection succeeds with zero recommendations.
- Unavailable candidate task collection: recommendation collection is unavailable and preserves the upstream reason.
- Duplicate candidate task identifiers: at most one recommendation is generated for each unique candidate task.
- Missing employee availability data: treated as needing review without outranking explicitly available equal matches.
- Busy but capable employees: may be recommended only when no equally capable available employee outranks them.
- Long task titles and employee names: dashboard display remains bounded and does not overlap adjacent panels.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define provider-neutral assignment recommendation models separate from active ProjectTask assignments.
- **FR-002**: The system MUST consume existing Candidate Task collections from Spec 063 and MUST NOT remap raw GitHub issues or call GitHub.
- **FR-003**: The system MUST consume existing AIverse employee records and MUST NOT create, edit, delete, or duplicate employee registry data.
- **FR-004**: Every eligible Candidate Task MUST produce at most one primary assignment recommendation.
- **FR-005**: Recommendation identifiers MUST be deterministic from candidate task ID, selected employee ID or no-match marker, and assignment ruleset version.
- **FR-006**: Matching MUST be deterministic, rule-based, and MUST NOT use an LLM or runtime agent execution.
- **FR-007**: Capability derivation MUST be provider-neutral and based only on existing employee role, status, assigned task/project fields, and capability strings.
- **FR-008**: Unavailable employees MUST NOT be selected over available equally capable employees.
- **FR-009**: Busy employees MUST NOT outrank equally capable available employees.
- **FR-010**: Deterministic tie-breaking MUST use match strength, availability, workload, then stable employee identifier.
- **FR-011**: No-match output MUST distinguish no employees, no matching employee, unavailable candidate task data, and closed candidate tasks.
- **FR-012**: Recommendation data and nested arrays MUST be defensively copied.
- **FR-013**: Controller integration MUST reuse current candidate task results and current employee state only, and MUST NOT create ProjectTask records, work sessions, or employee state changes.
- **FR-014**: Dashboard rows MUST clearly distinguish `[ISSUES]`, `[CANDIDATE TASKS]`, and `[ASSIGNMENT RECOMMENDATIONS]`.
- **FR-015**: Assignment recommendation rows MUST be lower visibility priority than Spec 062 issue list/detail rows and Spec 063 candidate task rows.
- **FR-016**: The feature MUST NOT implement active assignment approval, task execution, employee movement, repository mutation, issue mutation, remote GitHub mutation, persistence, Firebase, scheduling, webhooks, external LLM calls, Codex/Claude runtime invocation, push, PR creation, or merge.

### Key Entities

- **EmployeeCapabilityProfile**: Provider-neutral view of an existing employee's role, availability, current workload marker, and normalized capabilities.
- **CandidateAssignmentRecommendation**: Immutable proposal connecting one Candidate Task to a recommended employee or explicit no-match state.
- **CandidateAssignmentRecommendationCollection**: Per-project recommendation projection derived from a Candidate Task collection and current employees.
- **CandidateAssignmentMatcher**: Rule-based deterministic matcher.
- **CandidateAssignmentService**: Controller-facing service for producing recommendation collections.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Focused tests prove capability derivation, role/capability mapping, no duplicate capabilities, and immutable profile output.
- **SC-002**: Focused tests prove deterministic matching for Bug, Feature, Documentation, Maintenance, Research, and Unknown task types.
- **SC-003**: Focused tests prove unavailable/busy employee handling, deterministic tie-breaking, no-match behavior, duplicate prevention, closed-task policy, and immutability.
- **SC-004**: Controller tests prove recommendations use existing Candidate Task results and employee state only, create no ProjectTask records, mutate no employees, create no work sessions, and perform no GitHub request.
- **SC-005**: View tests prove recommendation rows are bounded, clearly labeled, lower priority than issue and candidate rows, and do not overlap panels.
- **SC-006**: Full validation passes with `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Existing employee `status: "Idle"` means available for recommendation ranking; `Working` and `Offline` do not outrank available matches.
- Existing `assignedTaskId` is the current workload marker for deterministic tie-breaking.
- Closed Candidate Tasks are preserved in recommendation output but are not recommended to an employee in this foundation.
- Recommendation timestamps use candidate task mapping timestamps where available so repeated mapping over the same inputs remains deterministic.
- Recommendations are proposals only and cannot be accepted in this Spec.
