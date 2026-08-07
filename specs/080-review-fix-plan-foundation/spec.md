# Feature Specification: Review Fix Plan Foundation

**Feature Branch**: `codex/080-review-fix-plan-foundation`
**Created**: 2026-08-06
**Status**: Draft
**Input**: User description: "Continue the AIverse roadmap with the next unimplemented Spec 080 after Review Fix Request Foundation."

## User Scenarios & Testing

### User Story 1 - Plan requested review fixes (Priority: P1)

A human has recorded a current Review Fix Request for a concrete `ChangesRequested` review and explicitly creates a provider-neutral plan describing the fix context that a later runtime could use.

**Why this priority**: This is the next safe boundary after a fix request. It records what should be fixed without starting Codex, Claude, validation, repository mutation, or GitHub mutation.

**Independent Test**: Given a current valid review chain and current Review Fix Request, invoking only the explicit `Plan review fixes` action creates exactly one immutable Review Fix Plan and one result with all runtime, validation, process, repository, and GitHub mutation flags false.

**Acceptance Scenarios**:

1. **Given** a valid current chain through a `ChangesRequested` reviewer result and current Review Fix Request, **When** the human invokes `Plan review fixes`, **Then** a Review Fix Plan is recorded for that exact request and no execution starts.
2. **Given** a Review Fix Request exists, **When** the dashboard renders or refreshes, **Then** no Review Fix Plan is created automatically.

---

### User Story 2 - Block stale or unsafe fix plans (Priority: P1)

A human attempts to create a plan after the review chain, fix request, project context, role context, validation commands, or mutation scope changed.

**Why this priority**: A plan must not authorize fixes for stale review evidence or bypass the Review Fix Request boundary.

**Independent Test**: Mutate one upstream field after recording a Review Fix Request, then invoke the plan action. The result is `Blocked`, no plan is created, and source records remain unchanged.

**Acceptance Scenarios**:

1. **Given** no current Review Fix Request, a non-requestable review decision, or a stale request, **When** the human asks to plan fixes, **Then** the command is blocked and no plan is stored.
2. **Given** the actor is an agent, automation, Codex, Claude, bot, or workflow label, **When** the plan action is invoked, **Then** the command is blocked before idempotency is considered.

---

### User Story 3 - Repeat planning idempotently (Priority: P2)

A human repeats the same plan action for an unchanged current fix request and sees stable dashboard state.

**Why this priority**: Repeated deliberate input should be harmless while preserving the original immutable plan snapshot.

**Independent Test**: Invoke the plan action twice against the same current Review Fix Request. The second invocation returns `AlreadyPlanned`, creates no duplicate plan, preserves the original `plannedAt`, and the dashboard shows one current plan.

**Acceptance Scenarios**:

1. **Given** an identical current Review Fix Plan already exists, **When** the same human repeats the plan action after command-time revalidation still passes, **Then** the result is `AlreadyPlanned` and no duplicate plan is created.
2. **Given** a historical plan exists but the current fix-request context changed, **When** the human repeats the action, **Then** the result is `Blocked`, not `AlreadyPlanned`.

### Edge Cases

- A `ReviewFixRequestResult` with `Blocked` or `Failed` does not make a plan eligible.
- A historical Review Fix Request remains immutable when the chain changes, but it is not currently plannable.
- Same raw Reviewer Runtime or Review Fix Request IDs in different projects do not collide.
- Review Promotion records remain untouched; fix planning does not rewrite the approved-review path.
- A plan never starts Codex, Claude, subprocesses, Validation Runtime, validation commands, repository mutation, GitHub mutation, or automatic fix execution.

## Requirements

### Functional Requirements

- **FR-001**: The system MUST introduce a provider-neutral Review Fix Plan domain model and result model.
- **FR-002**: The system MUST require an explicit human input action to create a Review Fix Plan.
- **FR-003**: The system MUST create a plan only for a current Review Fix Request whose freshly revalidated Review Decision is a concrete `ChangesRequested`.
- **FR-004**: The system MUST block missing, stale, project-mismatched, malformed, or non-current Review Fix Requests.
- **FR-005**: The system MUST revalidate current Review Decision and Runtime Chain Integrity at command time by reusing the existing review-decision and review-fix-request boundaries.
- **FR-006**: The system MUST reject non-human plan actors including Codex, Claude, agent, bot, automation, and workflow labels.
- **FR-007**: The plan MUST bind to the exact project, Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, Implementer Runtime, Review Target, Reviewer Runtime, Reviewer Runtime Result, Review Fix Request, ProjectTask, employee, repository, worktree, branch, implementer, reviewer, validation commands, mutation scope, and rules versions available in the current chain.
- **FR-008**: The plan MUST preserve existing Review Decision, Review Promotion, Review Fix Request, Runtime Chain Integrity, runtime evidence, ProjectTask, employee, repository metadata, and GitHub state without mutation.
- **FR-009**: The plan MUST use deterministic identity: `<projectId>:review-fix-plan:<reviewFixRequestId>:review-fix-plan-v1`.
- **FR-010**: Repeated identical current plan commands MUST return `AlreadyPlanned` only after full current revalidation and exact-context comparison.
- **FR-011**: Changed or stale current context MUST NOT return `AlreadyPlanned` from a historical plan.
- **FR-012**: The plan and result MUST keep `fixExecutionStarted`, `validationRuntimeStarted`, `codexStarted`, `claudeStarted`, `subprocessStarted`, `validationStarted`, `repositoryMutationStarted`, and `githubMutationStarted` false.
- **FR-013**: The dashboard MUST show `[REVIEW FIX PLAN]` rows with safe wording and without hiding higher-priority source, sync, focus, runtime, reviewer, review-decision, or review-fix-request rows unconditionally.
- **FR-014**: Product code MUST NOT invoke Codex, invoke Claude, spawn subprocesses, execute validation commands, start Validation Runtime, edit files, mutate repositories, mutate GitHub, or begin automatic fix execution.

### Key Entities

- **ReviewFixPlanCommand**: Explicit human command naming the project, Review Fix Request, actor, and planning time.
- **ReviewFixPlan**: Immutable exact-context planning snapshot for a concrete current Review Fix Request.
- **ReviewFixPlanResult**: Immutable result snapshot with status `Planned`, `AlreadyPlanned`, `Blocked`, or `Failed`.
- **ReviewFixPlanCollection**: Per-project immutable collection of plan records.
- **ReviewFixPlanResultCollection**: Per-project immutable collection of plan results.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit plan action creates exactly one plan and one result with deterministic IDs.
- **SC-002**: Repeated valid input creates no duplicate and returns `AlreadyPlanned` only after current revalidation.
- **SC-003**: Stale, missing, non-human, or non-`ChangesRequested` contexts block safely and preserve source records.
- **SC-004**: Dashboard wording distinguishes `Review Fix Request Recorded`, `Review Fix Plan Recorded`, and `No fix execution started`.
- **SC-005**: Full repository validation passes: `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`.

## Assumptions

- Spec 080 follows Spec 079 as the next provider-neutral planning boundary before any future fix execution or Validation Runtime.
- Canonical workflow roles are restored for implementation/review only; product records remain provider-neutral.
- `Local Human` remains the local human actor label used by prior approval, promotion, and fix-request features.
- Validation Runtime, Codex fix execution, Claude review execution, repository mutation, and GitHub mutation belong to later features.
