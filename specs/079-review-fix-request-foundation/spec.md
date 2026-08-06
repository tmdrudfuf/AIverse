# Feature Specification: Review Fix Request Foundation

**Feature Branch**: `codex/079-review-fix-request-foundation`
**Created**: 2026-08-05
**Status**: Draft
**Input**: User description: "Review Fix Request Foundation"

## User Scenarios and Testing

### User Story 1 - Record a human fix request for Changes Requested (Priority: P1)

A human reviews a completed Reviewer Runtime decision classified as `ChangesRequested` and explicitly records that fixes should be requested for that exact reviewed context.

**Why this priority**: This is the first post-review branch that captures the need for fixes without starting any fix execution.

**Independent Test**: Given a current valid runtime chain and a completed reviewer decision of `ChangesRequested`, invoking only the explicit fix-request action creates one immutable Review Fix Request and one result, with all execution and mutation flags false.

**Acceptance Scenarios**:

1. **Given** a valid current chain through Reviewer Runtime Result with decision `ChangesRequested`, **When** the human invokes `Request review fixes`, **Then** a Review Fix Request is recorded for that exact Reviewer Runtime and no execution starts.
2. **Given** the dashboard renders a `ChangesRequested` review decision, **When** no explicit action is invoked, **Then** no Review Fix Request is created.

---

### User Story 2 - Block stale or unsafe fix requests (Priority: P1)

A human attempts to request fixes after the review chain became stale, non-requestable, or unsafe.

**Why this priority**: A fix request must never authorize a changed context or bypass the existing review decision and runtime chain integrity boundary.

**Independent Test**: Mutate one upstream chain field after a `ChangesRequested` decision, then invoke the fix-request action. The result is `Blocked`, no request is created, and no source state changes.

**Acceptance Scenarios**:

1. **Given** an approved, unknown, blocked, timed out, failed, stale, missing, or project-mismatched reviewer decision, **When** the human requests fixes, **Then** the command is blocked and no request is stored.
2. **Given** a valid human actor is not supplied, **When** a request is attempted, **Then** the command is blocked even if an identical request already exists.

---

### User Story 3 - Repeated requests remain idempotent and visible (Priority: P2)

A human repeats the same fix-request input for the same unchanged context and sees stable dashboard state.

**Why this priority**: Repeated input should be harmless, deterministic, and clear while preserving the original request record.

**Independent Test**: Invoke the fix-request action twice against the same current `ChangesRequested` context. The second invocation returns `AlreadyRequested`, creates no duplicate request, preserves the first request timestamp, and the dashboard renders a single current request row.

**Acceptance Scenarios**:

1. **Given** an existing current Review Fix Request, **When** the same human repeats the request after command-time revalidation still passes, **Then** the result is `AlreadyRequested` and the request collection still contains exactly one current request.
2. **Given** a historical request exists but the current chain changed, **When** the human repeats the action, **Then** the result is `Blocked`, not `AlreadyRequested`.

### Edge Cases

- A completed reviewer result with decision `Unknown` is not requestable as a fix request.
- A historical request remains immutable when the chain becomes stale, but it is not shown as currently applicable.
- Same raw Reviewer Runtime IDs in different projects do not collide.
- Existing Review Promotions are left untouched; this feature does not rewrite Specs 075-078 records.
- A request never starts Codex, Claude, a subprocess, Validation Runtime, repository mutation, or GitHub mutation.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST introduce a provider-neutral Review Fix Request domain model and result model.
- **FR-002**: The system MUST require an explicit human input action to create a Review Fix Request.
- **FR-003**: The system MUST create a request only for a current Reviewer Runtime Result whose freshly classified Review Decision is exactly `ChangesRequested` with a concrete reviewer decision of `ChangesRequested`.
- **FR-004**: The system MUST block `Approved`, `Unknown`, `Blocked`, `TimedOut`, `Failed`, `Unavailable`, `Stale`, missing, malformed, project-mismatched, or foreign reviewer contexts.
- **FR-005**: The system MUST revalidate current Runtime Chain Integrity at command time by reusing the existing review-decision chain integrity service.
- **FR-006**: The system MUST reject non-human request actors including Codex, Claude, agent, bot, automation, and workflow labels.
- **FR-007**: The request MUST bind to the exact project, Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, Implementer Runtime, Review Target, Reviewer Runtime, Reviewer Runtime Result, ProjectTask, employee, repository, worktree, branch, implementer, reviewer, validation commands, mutation scope, and rules versions available in the current chain.
- **FR-008**: The request MUST preserve existing Review Decision, Review Promotion, Runtime Chain Integrity, runtime evidence, ProjectTask, employee, repository metadata, and GitHub state without mutation.
- **FR-009**: The request MUST use deterministic identity: `<projectId>:review-fix-request:<reviewerRuntimeId>:review-fix-request-v1`.
- **FR-010**: Repeated identical current requests MUST return `AlreadyRequested` only after full current revalidation and exact-context comparison.
- **FR-011**: Changed or stale current context MUST NOT return `AlreadyRequested` from a historical request.
- **FR-012**: The request and result MUST keep `fixExecutionStarted`, `validationRuntimeStarted`, `codexStarted`, `claudeStarted`, `subprocessStarted`, `validationStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.
- **FR-013**: The dashboard MUST show `[REVIEW FIX REQUEST]` rows with safe wording and without hiding higher-priority source, sync, focus, runtime, reviewer, or review-decision rows unconditionally.
- **FR-014**: Product code MUST NOT invoke Codex, invoke Claude, spawn subprocesses, execute validation commands, edit files, mutate repositories, mutate GitHub, or start Validation Runtime.

### Key Entities

- **ReviewFixRequestCommand**: Explicit human command naming the project, Reviewer Runtime, actor, and request time.
- **ReviewFixRequest**: Immutable exact-context request snapshot for a concrete `ChangesRequested` Reviewer Runtime decision.
- **ReviewFixRequestResult**: Immutable result snapshot with status `Requested`, `AlreadyRequested`, `Blocked`, or `Failed`.
- **ReviewFixRequestCollection**: Per-project immutable collection of request records.
- **ReviewFixRequestResultCollection**: Per-project immutable collection of request results.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit request creates exactly one request and one result with deterministic IDs.
- **SC-002**: Repeated valid input creates no duplicate and returns `AlreadyRequested` only after current revalidation.
- **SC-003**: Stale or non-`ChangesRequested` decisions block safely and preserve source records.
- **SC-004**: Dashboard wording distinguishes `Changes Requested`, `Review Fix Request Recorded`, and `No fix execution started`.
- **SC-005**: Full repository validation passes: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Canonical workflow roles are restored for implementation/review only; the product domain remains provider-neutral.
- Specs 075-078 are historical merged work and are reused, not rewritten.
- `Local Human` remains the local human actor label used by prior approval/promotion features.
- Validation Runtime and any automatic fix execution belong to a later feature.
