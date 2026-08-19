# Feature Specification: Task Completion Progression Feedback

**Feature Branch**: `codex/107-task-completion-progression-feedback`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Task Completion Progression Feedback"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - See Completion Progression Immediately (Priority: P1)

As the player marking a project task complete, I can immediately see whether that completion advanced company progression without leaving the task flow.

**Why this priority**: Task completion is the moment that earns progression. Feedback must happen at that moment so the player understands the impact of the work they just finished.

**Independent Test**: Mark a review-ready task Done from task detail and verify the task stays Done while a visible progression feedback row reflects the updated company level or newly reached milestone state.

**Acceptance Scenarios**:

1. **Given** a selected task is in Review, **When** the player marks it Done, **Then** the task detail shows the task as Done and includes completion progression feedback.
2. **Given** the completed task satisfies a company progression milestone, **When** the task is marked Done, **Then** progression triggers are refreshed immediately for the current office session.

---

### User Story 2 - Preserve Existing Completion Workflow (Priority: P2)

As the player, completing a task should still release employee work state and preserve existing task activity behavior.

**Why this priority**: Progression feedback must not break the task management and employee simulation loops that already depend on task status transitions.

**Independent Test**: Complete an assigned Review task and verify employee release, activity log updates, and task status behavior remain unchanged.

**Acceptance Scenarios**:

1. **Given** an assigned task is in Review, **When** it is marked Done, **Then** the assigned employee is released if no other loaded task needs them.
2. **Given** a task is marked Done, **When** its activity log is inspected, **Then** the existing status-change entry remains present.

---

### User Story 3 - Avoid False Progression Feedback (Priority: P3)

As the player, invalid or non-completing task actions should not create level-up feedback or stale progression events.

**Why this priority**: Progression feedback loses meaning if it appears for tasks that were not actually completed or repeats old level-up triggers.

**Independent Test**: Open an already Done task or move an In Progress task to Review and verify no new completion progression trigger is created.

**Acceptance Scenarios**:

1. **Given** a task is already Done, **When** the player presses the task action, **Then** no new progression trigger is created.
2. **Given** a task moves from In Progress to Review, **When** the transition completes, **Then** no completion progression feedback is created for a Done transition.

### Edge Cases

- The completed task is the first loaded Done task and satisfies the first completed-project milestone.
- The completed task does not change the company level because another milestone is still unmet.
- Multiple loaded tasks are already Done before the current task is completed.
- The task collection is missing or the selected task is stale when the input is received.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Task detail MUST show clear completion progression feedback after a task is marked Done.
- **FR-002**: Completing a task MUST refresh the company progression trigger state immediately in the same office session.
- **FR-003**: Completion feedback MUST distinguish between a level-up event and normal progress toward future milestones.
- **FR-004**: Non-Done task transitions MUST NOT create task completion progression triggers.
- **FR-005**: Repeating an action on an already Done task MUST NOT create duplicate progression triggers.
- **FR-006**: Existing task status activity, employee release, browser office session persistence, and project-management suggestion behavior MUST remain unchanged.
- **FR-007**: The feature MUST NOT start validation, review, agent runtime, repository mutation, GitHub mutation, publishing, merging, or deployment.

### Key Entities

- **Task Completion Progression Feedback**: A visible summary of how the latest task completion affected company progression.
- **Company Progression Trigger**: The existing in-session record that a company level has just been reached.
- **Selected Task Detail Context**: The current project and task identity being inspected when the completion action occurs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player who marks a Review task Done can see completion progression feedback before leaving task detail.
- **SC-002**: A task completion that reaches a new company level updates the current office progression trigger state in the same interaction.
- **SC-003**: Moving a task to Review or pressing action on an already Done task creates zero new completion progression triggers.
- **SC-004**: Existing completion side effects for task activity and employee release remain observable after the feature.

## Assumptions

- A loaded Done task counts as one completed project for the existing company progression rules.
- Feedback is local to the office session and uses existing in-memory progression state.
- This feature does not add new company progression milestones or change existing milestone thresholds.
