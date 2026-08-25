# Feature Specification: External Project Development Request Draft

**Feature Branch**: `codex/127-external-project-development-request-draft`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "External Project Development Request Draft"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Draft a Development Request (Priority: P1)

As an AIverse operator viewing a configured external project draft, I can create a local development request draft from the Project Dashboard so the project has a concrete next-work request before any task, runtime, repository, or GitHub action starts.

**Why this priority**: Specs 125 and 126 let operators create an external project and assign repository identity. The next step is capturing the intended development request without triggering the execution pipeline.

**Independent Test**: Add or select the external project draft, apply a configured repository identity, activate the dashboard action, and confirm a development request draft is visible for that project.

**Acceptance Scenarios**:

1. **Given** the external project draft has a configured repository identity, **When** the operator activates its Project Dashboard action, **Then** one development request draft is created for that project and shown in the dashboard.
2. **Given** the development request draft has been created, **When** the dashboard is inspected, **Then** the draft shows the project, repository signal, branch/spec context, draft status, and local-only side-effect boundary.

---

### User Story 2 - Keep Draft Creation Idempotent (Priority: P2)

As an operator, I can press the dashboard action repeatedly without creating duplicate development request drafts.

**Why this priority**: Dashboard actions are exploratory and repeated key presses must not create noisy duplicated workflow state.

**Independent Test**: Activate the configured external project dashboard action twice and confirm exactly one request draft exists with the same identity.

**Acceptance Scenarios**:

1. **Given** a development request draft already exists for the external project, **When** the operator activates the dashboard action again, **Then** the existing draft remains the only draft for that project.
2. **Given** the existing draft is reused, **When** the dashboard is rendered, **Then** the request row remains stable and selected project context is unchanged.

---

### User Story 3 - Persist the Draft in Browser Session State (Priority: P3)

As an operator, I can reload the browser office session after creating the development request draft and still see the draft on the external project dashboard.

**Why this priority**: The previous external-project slices persist project and repository identity metadata; the development request draft must survive the same session continuity path.

**Independent Test**: Create a development request draft, save and restore browser office session state, and confirm the restored external project dashboard shows the same draft.

**Acceptance Scenarios**:

1. **Given** a development request draft exists, **When** browser office session state is saved and restored, **Then** the draft remains attached to the external project.
2. **Given** the draft is restored, **When** the dashboard is inspected, **Then** no runtime, repository, GitHub, task promotion, or validation result is implied by the draft.

### Edge Cases

- If the external project draft does not exist, no development request draft is created.
- If repository identity is still unknown, the existing repository identity edit action remains the first dashboard action and no development request draft is created.
- Repeated creation attempts for the same project reuse the existing draft.
- Draft creation does not read local files, call remote services, start runtimes, spawn subprocesses, mutate repositories, mutate GitHub, publish, merge, deploy, or run validation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Project Dashboard MUST support creating one development request draft for the external project draft after repository identity is configured.
- **FR-002**: The development request draft MUST be local-only metadata and MUST NOT start the execution, review, validation, repository sync, issue sync, or runtime pipeline.
- **FR-003**: The request draft MUST include project id, repository provider, owner/name when known, branch/spec context when known, status, creation time, and side-effect boundary text.
- **FR-004**: Repeated dashboard activation MUST NOT create duplicate request drafts for the same external project.
- **FR-005**: The dashboard MUST render a visible row summarizing the request draft after it is created.
- **FR-006**: Browser office session save/restore MUST preserve development request drafts.
- **FR-007**: The repository identity edit overlay MUST remain the dashboard action while the external project draft still has unknown repository identity.
- **FR-008**: Creating or restoring a development request draft MUST NOT mutate project registry entries, repository mappings, task collections, employee state, runtime state, GitHub state, repositories, or validation state.

### Key Entities

- **External Project Development Request Draft**: A local-only draft request attached to the external project draft and repository identity context.
- **Request Draft Context**: Captured project and repository metadata used to explain what future development work would target.
- **Browser Office Session State**: Existing session continuity storage that restores portal workflow draft state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Operators can create the development request draft in one dashboard action after repository identity is configured.
- **SC-002**: Repeated dashboard activation leaves exactly one request draft for the external project.
- **SC-003**: 100% of supported request draft fields are present after browser session restore.
- **SC-004**: Draft creation performs zero external repository, filesystem, runtime, validation, publish, merge, deploy, or GitHub side effects.

## Assumptions

- This slice captures a single default development request draft; free-form editing belongs to a later feature.
- Repository identity must be configured before request draft creation because the request needs a target context.
- Existing browser office session persistence is the continuity mechanism for the draft.
