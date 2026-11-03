# Feature Specification: Real Execution Server Bridge

**Feature Branch**: `codex/149-real-execution-server-bridge`

**Created**: 2026-11-03

**Status**: Draft

**Input**: User description: "AIverse is not a game. It is a tool for maintaining and updating the projects I actually own, and for designing new ones, through a visible office/company interface. Right now the Implementer and Reviewer runtimes that would do real work are built and tested, but they can never actually run from the browser app I use day to day — they always report Blocked. Close that gap first, before GitHub write access or new-project design: let an approved run on one of my registered real projects genuinely execute."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - An Approved Run Actually Executes (Priority: P1)

As the operator of my own AIverse instance, when I approve a queued Implementer or Reviewer run against one of my registered real local projects, the run genuinely executes against that project and I see a real result (success, failure, or findings) in the office UI — not a placeholder "Blocked" status.

**Why this priority**: This is the entire point of the feature. Everything else in the office/company UI (backlog, suggestions, approvals, review decisions) already exists; only the final step — the run actually happening — is missing.

**Independent Test**: With real execution enabled on this machine (User Story 2) and a registered real project selected, approve a queued run and observe it reach a genuine terminal status that reflects the real project's own files/history (e.g., a real test failure surfaces as a real finding, not a canned one).

**Acceptance Scenarios**:

1. **Given** real execution is enabled on this machine and Project A is a registered real local project, **When** the operator approves a queued Implementer run for Project A, **Then** the run executes against Project A's actual local files and reports a genuine terminal status with evidence drawn from that execution.
2. **Given** an Implementer run has completed for real, **When** the operator approves the follow-up Reviewer run, **Then** the Reviewer run independently inspects the same real project state and reports its own genuine terminal status.
3. **Given** a real run is in progress for Project A, **When** the operator views the office for Project A, **Then** the displayed status reflects the real run's current state, not a simulated one.

---

### User Story 2 - Real Execution Is an Explicit, Visible Choice (Priority: P1)

As the operator, I can tell at a glance whether real execution is enabled on this machine, and turning it on is a deliberate action I take once per machine — never something that happens implicitly just because I opened the app or clicked around.

**Why this priority**: A silent switch from "harmless visualization" to "spawns real processes against my real repositories" would violate the project's existing human-only-boundary discipline and could surprise the operator with unintended side effects on their own code.

**Independent Test**: On a fresh machine where real execution has never been enabled, confirm every run attempt reports a clear "not enabled" status rather than either executing or silently doing nothing. Enable it, then confirm the office UI now shows real execution as active.

**Acceptance Scenarios**:

1. **Given** real execution has never been enabled on this machine, **When** the operator approves a run, **Then** the UI reports that real execution is not enabled and does not execute anything.
2. **Given** the operator has explicitly enabled real execution on this machine, **When** they open any registered project's office, **Then** the UI clearly indicates real execution is active for this machine.
3. **Given** real execution is enabled, **When** the operator disables it, **Then** subsequent run attempts again report "not enabled" rather than executing.

---

### User Story 3 - Failures Are Honest and Never Leave a Mess (Priority: P2)

As the operator, when a real run crashes, times out, is cancelled, or the app is closed mid-run, I see an honest terminal status (never a false success) and no orphaned process keeps running against my project after I've moved on.

**Why this priority**: Real execution is a consequential action against the operator's own real code. Silent false-success or an orphaned background process would be actively harmful, not just inconvenient.

**Independent Test**: Trigger a run that exceeds its time budget, and separately cancel a run mid-flight; confirm both end in a reported terminal status and that no process tied to that run continues executing afterward.

**Acceptance Scenarios**:

1. **Given** a real run exceeds its allotted time, **When** the timeout is reached, **Then** the run is terminated, reported as timed out, and no further output from it is applied to the project's state.
2. **Given** the operator cancels a real run in progress, **When** cancellation is requested, **Then** the run stops and is reported as cancelled, not as success or silent disappearance.
3. **Given** a real run's process crashes unexpectedly, **When** the crash occurs, **Then** the run is reported as failed with whatever evidence was captured before the crash, not as blocked or successful.

---

### Edge Cases

- What happens if the operator approves a second run for a project while a real run is already in progress for that same project? (Must not run two real processes concurrently against the same local project.)
- What happens if the registered project's local path no longer exists or is unreadable when a run is approved?
- What happens if the operator approves a run for a project whose local path is now a different repository than when it was registered (moved/replaced on disk)?
- What happens if real execution is enabled but the underlying CLI tool required for a given role (Implementer or Reviewer) is missing or broken on this machine?
- What happens if the app (browser tab) is closed or the machine sleeps while a real run is in progress?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST allow an approved Implementer or Reviewer run against a registered real local project to genuinely execute, producing evidence (status, output, findings) derived from that real execution rather than a simulated or canned result.
- **FR-002**: The system MUST NOT execute any real run unless the operator has explicitly enabled real execution on this machine; this enablement MUST be a distinct, deliberate action, never an implicit side effect of normal app use.
- **FR-003**: The system MUST make the current real-execution-enabled/disabled state visible in the office UI at all times.
- **FR-004**: The capability to start a real process MUST NOT be reachable from within the browser page's own script context; it MUST be reachable only through a boundary the operator controls on their own machine.
- **FR-005**: The system MUST run at most one real process at a time per registered project, rejecting or queuing a second concurrent request for the same project rather than running both.
- **FR-006**: The system MUST terminate a real run that exceeds a bounded time limit and report it as timed out.
- **FR-007**: The system MUST allow the operator to cancel a real run in progress and report it as cancelled, not as success.
- **FR-008**: The system MUST report a crashed real run as failed, preserving whatever evidence was captured before the crash.
- **FR-009**: The system MUST record a durable, inspectable audit trail (command run, working project, outcome, evidence) for every real run, independent of whether that run succeeded.
- **FR-010**: The system MUST continue to preserve the existing human-only boundary: a real run MUST NOT push, open, approve, or merge anything, or delete any branch, regardless of its outcome.
- **FR-011**: The system MUST refuse a run request whose target local path is missing, unreadable, or fails the existing path-safety checks, reporting this as a distinct, honest status rather than attempting to run anyway. (Project registration and identity — matching a project id to its local path — is already enforced where the run request is composed, before the server boundary; the server independently re-checks only what it alone can verify: that the given path genuinely exists and is safe to use as a working directory.)

### Key Entities *(include if feature involves data)*

- **Real Execution Enablement State**: Whether this machine currently permits real runs; who/what changed it last; scoped to the machine, not to any single project.
- **Real Run**: One real execution attempt tied to a registered project and a role (Implementer or Reviewer); has a terminal status (completed, failed, timed out, cancelled, refused) and carries evidence.
- **Run Audit Record**: The durable, inspectable record of a Real Run's command, target project, outcome, and evidence, kept regardless of outcome.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a machine where the operator has enabled real execution, 100% of approved runs against a registered real project reach a genuine terminal status (not "Blocked") without the operator restarting the app.
- **SC-002**: On a machine where real execution has not been enabled, 100% of run attempts report "not enabled" and zero real processes are started.
- **SC-003**: 100% of real runs that time out, are cancelled, or crash are reported with an honest terminal status, and zero of them leave a process still running against the project after that status is reported.
- **SC-004**: Every real run, successful or not, has a corresponding audit record the operator can inspect afterward.

## Assumptions

- The operator runs AIverse themselves, on their own machine, against their own registered real local projects; this feature does not need to support multiple untrusted end users sharing one deployment.
- "Real execution" reuses the Implementer/Reviewer runtime logic and safety checks already built and tested in this codebase (command/path safety validation, timeout handling); this feature closes the gap that currently keeps that logic from ever being reachable from the app the operator actually uses, it does not redesign that logic.
- GitHub write access (opening real pull requests) and a brand-new-project design flow are explicitly out of scope for this feature and will be specified separately.
- The operator has the required CLI tool(s) (e.g. Claude CLI, Codex CLI) already installed and authenticated on their own machine; this feature is responsible for reporting honestly when a tool is missing or fails, not for installing or authenticating it.
