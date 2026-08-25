# Feature Specification: External Project ADOS Run Preparation

**Feature Branch**: `codex/128-external-project-ados-run-preparation`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "External Project ADOS Run Preparation"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prepare an ADOS Run Handoff (Priority: P1)

As an AIverse operator viewing a configured external project with a development request draft, I can prepare a local ADOS run handoff so the intended implementer workflow is visible before any validation, review, runtime, repository, or GitHub action starts.

**Why this priority**: The previous external-project slice captures the requested work. The next useful step is a concrete run-preparation record that carries the handoff constraints and validation list without launching the execution pipeline.

**Independent Test**: Create the external project draft, configure repository identity, create the development request draft, activate the dashboard action again, and confirm an ADOS run preparation row is visible.

**Acceptance Scenarios**:

1. **Given** a configured external project has one development request draft, **When** the operator activates the Project Dashboard action, **Then** one ADOS run preparation is created for that project and shown in the dashboard.
2. **Given** the preparation is visible, **When** the dashboard is inspected, **Then** it shows the feature branch, base SHA, spec path, validation commands, reviewer command, and local-only execution boundary.

---

### User Story 2 - Keep Preparation Idempotent (Priority: P2)

As an operator, I can press the dashboard action repeatedly without creating duplicate ADOS run preparations.

**Why this priority**: Dashboard actions are exploratory and repeated key presses must keep workflow state stable.

**Independent Test**: Activate the prepared external project dashboard action multiple times and confirm exactly one ADOS run preparation remains for the project.

**Acceptance Scenarios**:

1. **Given** an ADOS run preparation already exists, **When** the operator activates the dashboard action again, **Then** the existing preparation remains the only preparation for that project.
2. **Given** the existing preparation is reused, **When** the dashboard is rendered, **Then** the preparation identity and created time remain stable.

---

### User Story 3 - Persist the Preparation in Browser Session State (Priority: P3)

As an operator, I can reload the browser office session after preparing the ADOS run and still see the preparation on the external project dashboard.

**Why this priority**: External-project draft, repository identity, and development request state already use browser session continuity; the run-preparation state must survive that same path.

**Independent Test**: Prepare an ADOS run, save and restore browser office session state, and confirm the restored external project dashboard shows the same preparation.

**Acceptance Scenarios**:

1. **Given** an ADOS run preparation exists, **When** browser office session state is saved and restored, **Then** the preparation remains attached to the external project.
2. **Given** the preparation is restored, **When** the dashboard is inspected, **Then** no runtime, validation, review, repository mutation, GitHub mutation, publish, merge, or deploy result is implied by the preparation.

### Edge Cases

- If the external project draft does not exist, no ADOS run preparation is created.
- If repository identity is still unknown, repository identity configuration remains the first dashboard action.
- If no development request draft exists yet, the dashboard action creates that draft before any ADOS run preparation.
- Repeated preparation attempts for the same project reuse the existing preparation.
- Preparation does not read local files, call remote services, start runtimes, spawn subprocesses, mutate repositories, mutate GitHub, publish, merge, deploy, or run validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Dashboard MUST support creating one ADOS run preparation for the external project after a development request draft exists.
- **FR-002**: The preparation MUST be local-only metadata and MUST NOT start implementer, reviewer, validation, runtime, repository sync, issue sync, publish, merge, deploy, repository mutation, or GitHub mutation flows.
- **FR-003**: The preparation MUST include project id, development request id, feature branch, authoritative base SHA, spec path, validation commands, reviewer command, execution policy version, and mutation boundary text.
- **FR-004**: Repeated dashboard activation MUST NOT create duplicate ADOS run preparations for the same external project.
- **FR-005**: The dashboard MUST render a visible row summarizing the preparation after it is created.
- **FR-006**: Browser office session save/restore MUST preserve ADOS run preparations.
- **FR-007**: Creating or restoring a preparation MUST NOT mutate project registry entries, repository mappings, task collections, employee state, runtime state, validation state, GitHub state, or repositories.

### Key Entities

- **External Project ADOS Run Preparation**: A local-only preparation record attached to a development request draft and the current external project handoff context.
- **ADOS Handoff Context**: Branch, base SHA, spec path, validation commands, reviewer command, policy version, and mutation boundary details needed before an implementer run.
- **Browser Office Session State**: Existing session continuity storage that restores portal workflow preparation state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can create the ADOS run preparation in one dashboard action after a development request draft exists.
- **SC-002**: Repeated dashboard activation leaves exactly one ADOS run preparation for the external project.
- **SC-003**: 100% of supported preparation fields are present after browser session restore.
- **SC-004**: Preparation performs zero validation, review, runtime, filesystem, external repository, publish, merge, deploy, or GitHub side effects.

## Assumptions

- This slice records the handoff for spec 128 only; executing it belongs to later workflow stages outside this runtime.
- The handoff values come from the current ADOS implementer handoff and remain local metadata.
- Existing browser office session persistence is the continuity mechanism for the preparation.
