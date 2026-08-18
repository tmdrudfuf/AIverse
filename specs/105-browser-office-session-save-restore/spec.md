# Feature Specification: Browser Office Session Save Restore

**Feature Branch**: `codex/105-browser-office-session-save-restore`

**Created**: 2026-08-17

**Status**: Draft

**Input**: User description: "Browser Office Session Save Restore"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Restore Active Office Work (Priority: P1)

As a returning AIverse player, I want active office work sessions to survive a browser refresh so that employees and promoted project tasks do not appear to lose in-progress work.

**Why this priority**: Active work is the highest-value state produced by the office workflow. Losing it on refresh breaks continuity and makes the project dashboard unreliable.

**Independent Test**: Start or seed an active office work session, recreate the browser office state, and verify the same active session, task progress, and employee working state are present.

**Acceptance Scenarios**:

1. **Given** an active office work session exists, **When** the browser office state is recreated in the same browser, **Then** the active work session is restored with its associated task and employee status.
2. **Given** restored active work exists, **When** the project dashboard is opened, **Then** active work appears without requiring the user to repeat assignment, preparation, or start actions.

---

### User Story 2 - Save Session Workflow Results (Priority: P2)

As a returning player, I want the office to remember the workflow records that led to active work so that refreshed state remains auditable and duplicate actions are blocked consistently.

**Why this priority**: Active work depends on prepared sessions, start results, task collections, and employees. Restoring only the visible session without provenance would make follow-up workflow steps inconsistent.

**Independent Test**: Persist a snapshot containing task collections, employees, confirmed assignment records, prepared session records, start results, and work sessions, then restore it and verify all included records are copied back into a fresh office state.

**Acceptance Scenarios**:

1. **Given** session workflow records were saved, **When** the office state is recreated, **Then** the records are restored for the matching browser snapshot.
2. **Given** a restored active session already exists, **When** the user attempts to start the same prepared work again, **Then** the system treats it as already started rather than creating a duplicate active session.

---

### User Story 3 - Recover Safely From Missing Or Bad Saved State (Priority: P3)

As a player, I want the office to open normally when saved browser state is missing, stale, or malformed so that a bad local snapshot never blocks the game.

**Why this priority**: Browser storage is user-controlled and can be cleared or corrupted. The feature must fail open to the default office state.

**Independent Test**: Provide missing, invalid, wrong-version, and wrong-project saved snapshots and verify a new office state is created without throwing and without importing bad data.

**Acceptance Scenarios**:

1. **Given** no saved office session exists, **When** the office state is created, **Then** the default office state is used.
2. **Given** saved office session data is malformed or from an unsupported version, **When** the office state is created, **Then** the saved data is ignored and the default state remains usable.

### Edge Cases

- Browser storage APIs are unavailable, throw, or reject access.
- Saved data contains valid JSON but does not match the expected office session snapshot shape.
- Saved data was created for a different project or obsolete schema version.
- Saving an empty default state must not erase project registry defaults or create phantom active work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST save browser-local office session state after active work or related workflow records change.
- **FR-002**: The system MUST restore saved active work sessions, task collections, employees, confirmed assignment records, prepared session records, active work start results, and project dashboard selection state when the browser office state is recreated.
- **FR-003**: The system MUST preserve enough restored workflow provenance to prevent duplicate active work starts for an already restored session.
- **FR-004**: The system MUST ignore missing, malformed, wrong-version, or inaccessible saved state without preventing normal office use.
- **FR-005**: The system MUST keep saved browser session data local to the browser and avoid remote publication, repository mutation, or GitHub mutation as part of save or restore.
- **FR-006**: Users MUST be able to continue from restored active work without repeating completed assignment, preparation, or work-start actions.

### Key Entities

- **Office Session Snapshot**: Browser-local saved record of restorable office session state, including version, saved time, active work, task collections, employee records, prepared session records, and start results.
- **Restorable Office State**: The subset of portal state that can be safely merged into a new default office state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can refresh or recreate the browser office state and see previously active work restored within one normal office open action.
- **SC-002**: Restored active work preserves task status, assigned employee, and active session identity with no duplicate session created for the same task.
- **SC-003**: Missing or invalid saved state produces zero user-blocking errors and leaves the office in the default usable state.
- **SC-004**: Save and restore operate entirely locally, with no remote, repository, or GitHub mutations.

## Assumptions

- Browser-local persistence is sufficient for this feature; cross-device account sync is out of scope.
- Only office workflow state required for active work continuity is saved; transient rendering objects, providers, and async request counters are not persisted.
- The feature targets the existing Daily Proof office workflow and should remain extensible to additional projects.
