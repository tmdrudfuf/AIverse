# Feature Specification: Controlled AI Suggestion Acceptance Policy

**Feature Branch**: `codex/145-controlled-ai-suggestion-acceptance-policy`
**Created**: 2026-09-01
**Status**: Draft
**Input**: ADOS handoff requirements for Spec 145.

## User Scenarios & Testing

### User Story 1 - Explicit Project Auto-Accept (Priority: P1)

As an operator, I can explicitly enable automatic acceptance for one registered project, choose eligible priorities, and evaluate already-generated AI suggestions so only valid same-project suggestions become ordinary backlog tasks.

**Independent Test**: With Project A auto-accept enabled for `high` only and Project B disabled, Project A accepts exactly one valid high-priority suggestion into backlog while a low-priority Project A suggestion and Project B urgent suggestion remain proposed.

### User Story 2 - Safety and Idempotency (Priority: P1)

As an operator, I need malformed, duplicate, rejected, already accepted, cross-project, stale, or disconnected-project suggestions to fail closed without creating tasks or starting execution.

**Independent Test**: Repeated evaluation, reload, and project re-entry never create duplicate backlog tasks or Ready/execution side effects.

### User Story 3 - Auditability and Persistence (Priority: P2)

As an operator, I can see concise project-scoped policy and evaluation status in the office planning surface, and subtle read-only portfolio status, across reloads.

**Independent Test**: Reload restores enabled state, allowed priorities, latest evaluation result, and suggestion-to-task provenance for each project without creating new consent.

## Requirements

- **FR-001**: Every project MUST default to manual suggestion review with automatic acceptance disabled.
- **FR-002**: Policy state MUST be project-scoped with no global fallback.
- **FR-003**: Missing, malformed, stale, or ambiguous policy state MUST fail closed to manual review only.
- **FR-004**: Operators MUST explicitly enable automatic suggestion acceptance per project.
- **FR-005**: Enabling suggestion generation or autonomous execution MUST NOT imply suggestion acceptance consent.
- **FR-006**: Automatic evaluation MUST validate canonical project ownership, suggestion identity, title, description, structured fields, state, priority/category values where present, length bounds, and cross-project identifiers.
- **FR-007**: Only proposed suggestions MAY be auto-accepted.
- **FR-008**: Rejected, accepted, stale, malformed, cross-project, and previously converted suggestions MUST NOT be auto-accepted.
- **FR-009**: `suggestion.projectId`, `policy.projectId`, and created backlog `task.projectId` MUST match exactly.
- **FR-010**: Duplicate protection MUST deterministically compare against same-project planning tasks and previous suggestion associations, detecting at least normalized title duplicates.
- **FR-011**: Operator-selected allowed priorities MUST determine eligibility; absent or invalid suggestion priority MUST fail closed.
- **FR-012**: Each evaluation MUST accept no more than the policy maximum, defaulting to one.
- **FR-013**: Multiple eligible suggestions MUST be selected deterministically by configured priority order, oldest generated time, then stable id.
- **FR-014**: Automatic acceptance MUST reuse the existing manual suggestion-to-backlog conversion semantics.
- **FR-015**: Automatically accepted tasks MUST always be created in `backlog` state and MUST NOT be marked Ready.
- **FR-016**: Automatic acceptance MUST NOT invoke Start Development, Spec 142, Spec 144, ADOS execution/preparation, Codex, Claude, Git, or GitHub mutations.
- **FR-017**: AI-generated suggestion text MUST be treated only as bounded, validated data and MUST NOT be executed, passed as shell or Git arguments, used to mutate repository files, or used to invoke ADOS.
- **FR-018**: If automatic acceptance fails before backlog task creation, the suggestion MUST remain available for manual review, no partial task MAY exist, no execution MAY start, and a concise deterministic failure reason MUST be exposed.
- **FR-019**: If backlog task creation succeeds but provenance persistence encounters a retry scenario, the existing state/transaction semantics MUST remain idempotent so repeated evaluation cannot create duplicate tasks.
- **FR-020**: Backlog tasks created from suggestions MUST preserve source suggestion id, acceptance mode, and accepted time.
- **FR-021**: Manual suggestion Accept and Reject MUST remain functional and distinguishable from automatic acceptance where provenance is stored.
- **FR-022**: Policies, allowed priorities, latest evaluation results, suggestions, and provenance MUST persist through the existing browser office session architecture.
- **FR-023**: Repeated evaluation, double-clicks, reloads, suggestion generation events, and project re-entry MUST be idempotent.
- **FR-024**: Active ADOS runs MUST remain untouched by suggestion acceptance.
- **FR-025**: Disconnected, removed, stale, or unregistered projects MUST fail closed.
- **FR-026**: Policy evaluation MUST operate only on already-generated suggestions and MUST NOT call an AI model.
- **FR-027**: The office UI MUST show compact project-scoped controls for canonical project, Auto Accept on/off, allowed priorities, and latest result near the backlog suggestion surface.
- **FR-028**: Portfolio status MAY show read-only project-scoped AI Accept status and pending count, and MUST NOT mutate policy.

## Key Entities

- **Project Suggestion Acceptance Policy**: Per-project operator consent and deterministic eligibility constraints.
- **AI Backlog Suggestion**: Existing Spec 143 candidate in proposed, accepted, rejected, or stale state.
- **Backlog Task Provenance**: Association between a created backlog task and the suggestion acceptance event.
- **Evaluation Result**: Concise deterministic accepted/skipped/failure outcome for operator audit.

## Success Criteria

- **SC-001**: In a two-project scenario, Project A can auto-accept exactly one eligible suggestion while Project B remains manual.
- **SC-002**: Re-running evaluation five times creates no duplicate task from the same suggestion.
- **SC-003**: Auto-accepted tasks are observable as backlog state, not Ready or execution state.
- **SC-004**: Operators can understand the latest accepted and skipped reasons from concise UI text.
- **SC-005**: Manual accept/reject flows continue to pass existing behavior checks.

## Assumptions

- Spec 143 does not expose a category taxonomy in the existing suggestion model, so category filtering is omitted rather than inventing one.
- Existing project registry and binding services remain authoritative for canonical project identity.
