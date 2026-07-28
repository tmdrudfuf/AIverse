# Feature Specification: GitHub Issue Candidate Task Mapping Foundation

**Feature Branch**: `codex/issue-candidate-task-mapping`

**Created**: 2026-07-27

**Status**: Draft

**Input**: User description: "Implement a provider-neutral mapping layer that converts Issue Snapshots from Spec 062 into AIverse Candidate Tasks. This spec does not assign work to AI employees yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Map synchronized issues into candidate tasks (Priority: P1)

As a player viewing a project with synchronized issues, I can see that every raw issue snapshot has a matching AIverse Candidate Task with deterministic task metadata.

**Why this priority**: This is the core domain boundary between external issue data and future AI employee work assignment.

**Independent Test**: Given an in-memory issue snapshot collection with several open and closed issues, mapping produces exactly one candidate task per issue with stable IDs, copied labels/assignees, inferred priority, inferred task type, source metadata, and no duplicate tasks.

**Acceptance Scenarios**:

1. **Given** a succeeded issue sync collection for Daily Proof with three issues, **When** candidate task mapping runs, **Then** exactly three candidate tasks are produced and each task references one originating issue.
2. **Given** two runs over the same issue snapshots, **When** mapping runs repeatedly, **Then** every candidate task ID and inferred field is identical across runs.
3. **Given** a mapped candidate task is mutated by a caller, **When** mapping runs again from the same issue snapshots, **Then** the new result is unaffected by the previous mutation.

---

### User Story 2 - Infer provider-neutral task metadata (Priority: P1)

As a future AI work planner, I can consume candidate tasks whose priority and task type are inferred deterministically from provider-neutral issue labels, without depending on GitHub-specific behavior.

**Why this priority**: Future assignment logic needs stable, auditable metadata before any AI employee can safely receive work.

**Independent Test**: Feed issue snapshots with labels such as `bug`, `enhancement`, `documentation`, maintenance-oriented labels, research labels, and unknown labels; verify priority and task type inference exactly matches the documented rules.

**Acceptance Scenarios**:

1. **Given** an issue labeled `bug`, **When** it is mapped, **Then** its estimated priority is `High` and task type is `Bug`.
2. **Given** an issue labeled `enhancement`, **When** it is mapped, **Then** its estimated priority is `Medium` and task type is `Feature`.
3. **Given** an issue labeled `documentation`, **When** it is mapped, **Then** its estimated priority is `Low` and task type is `Documentation`.
4. **Given** an issue with no known labels, **When** it is mapped, **Then** its estimated priority is `Normal` and task type is `Unknown`.

---

### User Story 3 - Display candidate tasks separately from raw issues (Priority: P2)

As a player viewing the project dashboard, I can distinguish raw GitHub Issues from AIverse Candidate Tasks so I understand that the system has interpreted issues but has not assigned or executed work.

**Why this priority**: The UI must make the new domain layer visible without implying assignment, execution, or GitHub mutation.

**Independent Test**: Render the project dashboard with a succeeded issue sync collection and confirm separate candidate-task rows show count, top task priority/type, linked issue number, title, and state while the raw issue rows remain labeled as raw issue sync output.

**Acceptance Scenarios**:

1. **Given** a succeeded issue sync collection, **When** the project dashboard renders, **Then** raw issue rows remain labeled as issue synchronization output and candidate task rows are labeled as AIverse Candidate Tasks.
2. **Given** issue sync is unavailable, failed, syncing, or not started, **When** the dashboard renders, **Then** candidate task rows honestly report that candidate tasks are unavailable or pending rather than fabricating an empty success.

### Edge Cases

- Empty succeeded issue collection: mapping succeeds with zero candidate tasks and the UI distinguishes this from unavailable issue sync.
- Unavailable, failed, syncing, or not-started issue sync: no candidate tasks are fabricated.
- Duplicate issue snapshots with the same issue ID or issue number in one collection: mapping keeps one candidate task per unique issue identity and remains deterministic.
- Labels and assignees are copied defensively so caller mutation cannot alter mapped tasks or future results.
- Closed issues remain mapped but retain closed status so future assignment logic can decide whether to ignore them.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define a provider-neutral Candidate Task domain model that is separate from existing executable project tasks.
- **FR-002**: Each synchronized Issue Snapshot in a succeeded collection MUST map to exactly one Candidate Task.
- **FR-003**: A Candidate Task MUST include stable ID, originating issue ID, issue number, project ID, title, summary, labels, assignees, open/closed status, estimated priority, estimated task type, source provider, timestamps, and synchronization metadata.
- **FR-004**: Candidate Task mapping MUST operate only on the already-synchronized Issue Snapshot collection in state and MUST NOT trigger another GitHub or provider request.
- **FR-005**: Priority inference MUST be deterministic: `bug` maps to `High`, `enhancement` maps to `Medium`, `documentation` maps to `Low`, and no known labels maps to `Normal`.
- **FR-006**: Task type inference MUST be deterministic and provider-neutral, supporting at least `Bug`, `Feature`, `Documentation`, `Maintenance`, `Research`, and `Unknown`.
- **FR-007**: Inference rules MUST be isolated from controller and view code so future providers can override or extend mapping without changing UI rendering.
- **FR-008**: Candidate Task arrays and nested label/assignee arrays MUST be defensively copied and immutable from the caller's perspective.
- **FR-009**: The controller MUST reuse current issue-sync results and store or expose candidate tasks per project without mutating the issue sync collection.
- **FR-010**: The dashboard MUST display Candidate Tasks separately from raw GitHub Issue rows and MUST not imply AI employee assignment or task execution.
- **FR-011**: The feature MUST NOT implement task execution, employee assignment, AI coding, issue mutation, GitHub mutation, persistence, Firebase, scheduling, or workflow automation.

### Key Entities

- **CandidateTask**: AIverse-local interpretation of one synchronized issue as potential future work. It is not an executable task and has no assignee.
- **CandidateTaskCollection**: Per-project collection of candidate tasks derived from the latest issue snapshot collection, including mapping status and sync metadata.
- **CandidateTaskMapper**: Provider-neutral mapper that converts an issue snapshot collection into a candidate task collection and owns inference rules.
- **CandidateTaskService**: Thin domain service used by the controller to derive candidate tasks from synchronized issue snapshots.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Unit tests prove label mapping, priority inference, task type inference, deterministic mapping, immutability, empty collections, and duplicate prevention.
- **SC-002**: Controller tests prove candidate tasks are derived from existing issue sync results without calling an issue provider again.
- **SC-003**: UI tests prove the dashboard distinguishes raw issue rows from AIverse Candidate Task rows and shows count, priority, type, issue number, title, and state when space allows.
- **SC-004**: Tests prove unavailable or incomplete issue sync states do not create fabricated candidate tasks.
- **SC-005**: Full validation passes with `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Candidate Tasks are in-memory projections only for this spec.
- Candidate Tasks intentionally differ from existing `ProjectTask` records because assignment and execution are future work.
- Source provider is copied from the issue snapshot collection and issue snapshots; no provider-specific behavior is required for GitHub beyond labels already present on snapshots.
- Dashboard display may drop lower-priority candidate task detail rows under the existing lower-panel row budget, matching Spec 062 row fitting behavior.
