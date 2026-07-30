# Research: Explicit Work Session Start Foundation

## Decision: Reuse Existing WorkSession for Active State

**Rationale**: The repository already has `WorkSession`, `WorkSessionStatus`, dashboard summaries, employee simulation, and task detail rendering that understand active work sessions. Reusing this model avoids a parallel active-session system and preserves existing dashboard behavior.

**Alternatives considered**:

- Add a new active-session record separate from `WorkSession`: rejected because it would duplicate the active-session domain and require additional dashboard translation.
- Mutate the Spec 068 prepared-session record to active: rejected because prepared sessions are historical evidence and should remain immutable.

## Decision: Keep Prepared and Confirmed Assignment Records Immutable

**Rationale**: Spec 067 and Spec 068 deliberately model assignment and preparation as historical records. Active work should reference those records rather than rewriting them.

**Alternatives considered**:

- Flip flags on prepared-session records: rejected because it weakens auditability and makes repeated validation harder.
- Add compatibility flags to confirmed assignments: rejected because `workSessionCreated` would imply an active session was created by Spec 067, which is not true.

## Decision: Start Updates Task and Employee Logical State

**Rationale**: Spec 069 explicitly introduces logical work started. The existing task active state is `In Progress`, and the existing employee logical work state is `Working`. Updating both allows existing simulation and dashboard summaries to reflect active work without AI execution.

**Alternatives considered**:

- Only create a work-session record and derive everything else: rejected because existing task and employee UI already use explicit task status and employee status.
- Start agent execution immediately: out of scope and unsafe for this foundation.

## Decision: Revalidate Before Returning AlreadyStarted

**Rationale**: Spec 068 fixed the same class of stale duplicate handling. The start service must not return `AlreadyStarted` before checking current task, assignment, employee, and active-session consistency.

**Alternatives considered**:

- Early duplicate return: rejected because stale task or employee state could falsely appear valid.

## Decision: No Subprocess, Repository, or GitHub Mutation

**Rationale**: The feature creates a local active logical session only. Agent execution and repository mutation belong to future specs.

**Alternatives considered**:

- Call the existing AI service to generate activity text: rejected because this spec forbids Codex/Claude runtime execution and keeps start deterministic.
