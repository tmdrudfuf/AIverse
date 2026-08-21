# Feature Specification: Daily Proof Portal Browser Smoke Validation

**Feature Branch**: `codex/115-daily-proof-portal-browser-smoke-validation`

**Created**: 2026-08-20

**Status**: Draft

**Input**: User description: "Daily Proof Portal Browser Smoke Validation"

## User Scenarios & Testing

### User Story 1 - Smoke Validate Daily Proof Portal Entry (Priority: P1)

An implementer or reviewer can rely on a repeatable smoke check that proves the browser-facing Project Portal still opens Daily Proof and reaches its dashboard without starting agent runtimes, validation, publication, merge, deployment, or remote mutations.

**Why this priority**: Daily Proof is the primary configured project. If the portal entry path breaks, later workflow checks cannot be trusted.

**Independent Test**: Open the Project Portal from a fresh office session, select the default Daily Proof project, enter its dashboard, and confirm the Daily Proof dashboard is selected while runtime and remote-action collections remain untouched.

**Acceptance Scenarios**:

1. **Given** a fresh office browser session, **When** the Project Portal is opened, **Then** Daily Proof is available as the default project selection.
2. **Given** the Project Portal is open on Daily Proof, **When** the user activates the selected project, **Then** the Daily Proof project dashboard is shown.
3. **Given** the Daily Proof dashboard is opened through the smoke path, **When** no explicit runtime controls are pressed, **Then** implementer, reviewer, validation, publishing, merging, deployment, and GitHub mutation flows are not started.

---

### User Story 2 - Smoke Validate Daily Proof Runtime-Start Chain (Priority: P2)

An implementer can rely on a deterministic smoke check that drives the Daily Proof portal through the existing approval and runtime-start preparation chain so regressions in the core portal flow are caught early.

**Why this priority**: The runtime-start chain is the prerequisite for implementer, reviewer, and validation runtime workflows.

**Independent Test**: Drive the Daily Proof candidate task path through issue sync, approval, promotion, assignment, preparation, work start, execution planning, readiness, human approval, preflight, and explicit runtime start, then confirm exactly one runtime-start record exists.

**Acceptance Scenarios**:

1. **Given** a configured Daily Proof repository context, **When** the smoke chain is driven through the existing portal actions, **Then** one runtime-start record is created for the promoted Daily Proof task.
2. **Given** the runtime-start smoke chain completes, **When** no implementer, reviewer, or validation controls are pressed, **Then** no agent runtime, validation runtime, publication, merge, deployment, or GitHub mutation is started.

### Edge Cases

- The portal must ignore the first input frame immediately after opening so the smoke path cannot accidentally activate a project on the open frame.
- The smoke validation must remain local and deterministic when external repository or browser services are unavailable.
- The smoke validation must not require live GitHub, CLI agents, subprocess spawning, deployment services, or the primary repository.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST include a repeatable smoke check for opening the Project Portal and selecting Daily Proof from a fresh browser-facing office session.
- **FR-002**: The smoke check MUST confirm the Daily Proof project dashboard is selected after the user activates the default project.
- **FR-003**: The smoke check MUST confirm the Daily Proof runtime-start preparation chain creates exactly one runtime-start record for the promoted task.
- **FR-004**: The smoke check MUST verify that implementer runtime, reviewer runtime, validation runtime, publication, merge, deployment, and GitHub mutation flows are not started by smoke navigation alone.
- **FR-005**: The smoke check MUST use existing deterministic project and scene fixtures and MUST NOT require live external services.

### Key Entities

- **Daily Proof Project**: The configured project surfaced in the Project Portal and used as the smoke target.
- **Portal Smoke Result**: The observed local state proving the portal entry and runtime-start chain reached the expected state without remote side effects.
- **Runtime-Start Record**: The local readiness marker produced before any implementer, reviewer, or validation runtime is explicitly started.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A maintainer can execute the focused smoke coverage in under 10 seconds on a local development machine.
- **SC-002**: The smoke check catches a broken Daily Proof portal entry path before any agent runtime, validation runtime, or remote mutation can begin.
- **SC-003**: The smoke check verifies exactly one runtime-start record for the Daily Proof flow and zero started downstream runtime collections.
- **SC-004**: The smoke check runs without live GitHub credentials, CLI agent availability, browser automation services, deployment access, or primary repository mutation.

## Assumptions

- Daily Proof remains the first default project in the Project Portal registry.
- Existing controller and Phaser scene stubs are acceptable as browser-facing smoke coverage because they exercise the same portal input path used by the rendered office scene.
- Full validation commands are documented for a later validation runtime, but this ADOS runtime must not execute validation, review, publish, merge, deploy, or GitHub mutation actions.
