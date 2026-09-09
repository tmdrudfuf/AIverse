# Feature Specification: Autonomous Company Operations End-to-End Verification

**Feature Branch**: `codex/148-autonomous-company-operations-end-to-end`

**Created**: 2026-09-03

**Status**: Draft

**Input**: ADOS Spec 148 authoritative requirements: "Prove that the controlled autonomous company workflow built across Specs 142-147 actually composes safely end to end for a canonical registered project, without weakening any individual safety policy."

## Overview

This feature is an integration and runtime-verification feature. It adds no new
production orchestration engine and changes no Spec 142-147 policy semantics. It
demonstrates one controlled autonomous project cycle:

Spec 147 bounded suggestion generation -> Spec 145 controlled acceptance ->
Spec 141 backlog -> Spec 146 controlled Ready promotion -> Spec 144 controlled
autonomous execution -> Spec 142 / Spec 138 development bridge -> ADOS ->
implementer -> independent reviewer -> validation -> exact HEAD -> publication.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - One Controlled Autonomous Cycle (Priority: P1)

An operator who has independently enabled all four automation controls for one
canonical project observes a single suggestion travel the full chain - Spec 147
generation through ADOS execution, independent Codex review assignment,
validation, exact HEAD, and the human-only publication gate - without any stage
being skipped or any safety gate being disabled.

**Why this priority**: This is the entire purpose of Spec 148.

**Independent Test**: With Project A having Auto Suggestions, Auto Accept, Auto
Ready, and Auto Execute all explicitly enabled, fire one bounded lifecycle
event and confirm the ordered progression suggestion -> accepted backlog task ->
Ready -> autonomous execution -> development bridge -> ADOS run, each transition
occurring exactly once; then confirm the chain continues into review - the
reviewer for the run resolves from its own durable implementer id (Codex,
distinct from the Claude implementer) - and that when the ADOS run reports
run-level completion (`execution.evidence.completed`) the office-observable
Spec 144 active-execution count drops from 1 to 0 and the daily-proof task
reaches `completed` through the existing operator transition. While the run is
still in flight the task stays `in_progress` and nothing auto-approves or
fabricates completion. The same cycle's review / validation / exact HEAD /
publication stage cannot be represented on the in-office chain (the office
`ExternalProjectAdosExecution` schema types its review/validation/publish
sub-stage flags as the literal `false`); it is exercised by
`spec148RoleAssignmentEvidence.test.ts`, which runs the
`candidate == validated == reviewed == exact HEAD` + Approved-review
convergence biconditional **iff**-style (both directions),
**unconditionally**, over this run's own durable ADOS records
(`candidate.json` / `validation-runtime.json` / `review-runtime.json`) using
the production comparator `validationPolicy.js` `targetsMatch` and the real
`reviewConvergence.js` `computeConvergenceStatus`, carrying the real durable
review decision - not a hand-built object. Per authoritative requirement 23 the ADOS process spawn is
the only injected boundary; push, PR readiness, approval, merge, and remote
deletion remain the human-only publication boundary and are not performed by
the runtime.

**Acceptance Scenarios**:

1. **Given** Project A has all four automation policies independently enabled,
   **When** one bounded planning lifecycle event occurs, **Then** Spec 147
   invokes the existing Spec 143 suggestion path and produces at most the
   configured bounded number of project-scoped suggestions.
2. **Given** a proposed suggestion exists for Project A, **When** Spec 145
   evaluates it, **Then** it converts through the existing Spec 143 -> Spec 141
   path into a backlog-state task and is never marked Ready by Spec 145.
3. **Given** an accepted backlog task exists for Project A, **When** Spec 146
   evaluates it, **Then** the task transitions backlog -> Ready exactly once
   through existing Spec 141 transition semantics and Spec 146 starts no
   development.
4. **Given** a Ready task exists for Project A, **When** Spec 144 evaluates it,
   **Then** Spec 144 alone authorizes one bounded execution through the Spec 142
   / Spec 138 bridge with exact canonical project and task context.
5. **Given** the bridge produced a development request, **When** execution
   starts, **Then** a durable ADOS run identity is recorded and observable by
   the office.
6. **Given** the ADOS run has started, **When** review is assigned, **Then**
   the reviewer is Codex (distinct from the Claude implementer) and publication
   does not converge until an Approved independent review is aligned on
   `validated == reviewed == exact HEAD`; while the run is in flight the task
   stays `in_progress` and no completion is fabricated.
7. **Given** the ADOS run reports run-level completion
   (`execution.evidence.completed`), **When** the office evaluates it, **Then**
   the Spec 144 active-execution count drops to 0 (probe
   `autonomyActiveExecutionCount`) and the daily-proof task reaches `completed`
   through the existing operator transition - no autonomous
   `in_progress -> completed` path exists or is added.

---

### User Story 2 - Independent Controls and Safety Gates (Priority: P1)

The operator can enable or disable each of the four automation stages
independently, and no hidden "Full Auto" flag exists.

**Why this priority**: The composition must not weaken any individual policy.

**Independent Test**: Toggle each policy in isolation and confirm the other
three are unaffected; confirm disabling any one stage halts the chain at that
stage while leaving prior authoritative state intact.

**Acceptance Scenarios**:

1. **Given** any single automation policy is enabled, **When** the other three
   remain default, **Then** only the enabled stage acts and the chain does not
   advance past it.
2. **Given** an active execution exists for Project A, **When** Spec 147 or
   Spec 146 evaluates where policy prohibits extra work, **Then** no extra
   suggestion, Ready transition, or execution is produced and Spec 144
   concurrency limits remain enforced.
3. **Given** a stage fails (provider unavailable, ineligible acceptance, active
   execution gate, ADOS validation failure, reviewer unavailable, exact HEAD
   mismatch), **When** the failure occurs, **Then** the authoritative prior
   state is preserved, a concise block reason is exposed, and no stage
   auto-advances, auto-approves, or fabricates completion.

---

### User Story 3 - Project Isolation and Idempotency (Priority: P1)

Automation for Project A never mutates Project B, and replaying lifecycle events
never duplicates work.

**Why this priority**: Multi-project safety and event-replay safety are core
guarantees of the composed system.

**Independent Test**: Run the full chain for Project A while Project B is also
registered; confirm Project B receives no suggestion, backlog task, Ready
transition, execution, ADOS status, or candidate/reviewer state. Replay each
lifecycle event and confirm no duplicate suggestion, backlog task, Ready
transition, execution request, or ADOS run.

**Acceptance Scenarios**:

1. **Given** the chain runs for Project A, **When** it completes, **Then**
   Project B state is byte-for-byte unchanged.
2. **Given** a completed stage, **When** its triggering event is replayed,
   **Then** existing idempotency mechanisms prevent any duplicate artifact.
3. **Given** the office UI remounts or the session reloads, **When** state is
   restored, **Then** completed stages are not restarted and no duplicate
   planning or execution results.

---

### User Story 4 - Adaptive Role and Exact Candidate Ownership Evidence (Priority: P1)

The verification run exposes the durable ADOS role assignment and proves the
independent-review and exact-HEAD guarantees before any publication.

**Why this priority**: Independent review and exact HEAD are non-negotiable
publication gates.

**Independent Test**: Read the durable ADOS role assignment for this run and
confirm implementer = Claude, reviewer = Codex, mode = adaptive, candidate owner
= Claude, and implementer != reviewer. Confirm a stale approval cannot authorize
a newer candidate and that validated SHA = reviewed SHA = exact HEAD is enforced
before publication. Confirm that if Codex review runtime is unavailable the run
stays blocked rather than self-reviewing.

**Acceptance Scenarios**:

1. **Given** this ADOS run, **When** its role assignment is read from durable
   state, **Then** it reports implementer Claude, reviewer Codex, mode adaptive,
   reason "explicit operator preference for Claude implementer", and candidate
   owner Claude.
2. **Given** a candidate owned by Claude, **When** review is assigned, **Then**
   the reviewer is Codex and Claude cannot review its own candidate.
3. **Given** an approval recorded against an older SHA, **When** a newer
   candidate exists, **Then** the stale approval does not authorize publication.
4. **Given** convergence is evaluated, **When** validated SHA, reviewed SHA, and
   exact HEAD are not identical, **Then** the run is not converged.

### Edge Cases

- Suggestion provider unavailable: chain halts at Spec 147 with a concise
  failure reason; no backlog task is created.
- Acceptance ineligible (duplicate, wrong project, policy filter): chain halts
  at Spec 145; backlog is not mutated.
- Active-execution gate: Spec 146 and Spec 144 skip with an active-execution
  reason; no extra Ready or execution is produced.
- ADOS validation failed / reviewer unavailable / exact HEAD mismatch: run stays
  blocked; no auto-approval, no fabricated completion.
- Reload / office remount mid-cycle: truthful state is preserved; completed
  stages do not restart.
- Any later autonomous cycle requires a fresh bounded lifecycle event and
  respects cooldown, capacity, and idempotency; no `complete -> generate ->
  execute -> complete` infinite loop is introduced.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Verification MUST reuse the existing authoritative implementations
  for project registry, Spec 143 suggestion generation, Spec 145 acceptance,
  Spec 141 backlog/task state, Spec 146 readiness promotion, Spec 144 autonomous
  execution, Spec 142 development bridge, Spec 138 in-office development request,
  external ADOS execution/status, portfolio state, and office visualization.
- **FR-002**: Verification MUST NOT introduce a second orchestration engine or a
  new production coordinator; existing stage coordinators remain authoritative.
- **FR-003**: The four automation controls (Auto Suggestions, Auto Accept, Auto
  Ready, Auto Execute) MUST remain independently enabled/disabled with no hidden
  "Full Auto" flag, and runtime evidence MUST prove each stage is independently
  enabled for the test project.
- **FR-004**: The E2E development request MUST be a small, deterministic,
  low-risk task and MUST NOT run destructive or arbitrary repository work.
- **FR-005**: A bounded lifecycle event MUST cause Spec 147 to invoke the
  existing Spec 143 suggestion path, verifying project-scoped policy ON,
  cooldown, planning capacity, no blocking active work, bounded suggestion
  count, and correct canonical project ownership; Spec 147 MUST NOT create a
  backlog task directly.
- **FR-006**: The generated suggestion MUST reach Spec 145 through the normal
  authoritative suggestion lifecycle, converting via the existing Spec 143 ->
  Spec 141 path into a backlog-state task; Spec 145 MUST NOT mark the task
  Ready.
- **FR-007**: The accepted backlog task MUST reach Spec 146 through normal
  project state and transition backlog -> Ready exactly once via deterministic
  selection; Spec 146 MUST NOT start development or invoke Spec 144 directly.
- **FR-008**: The Ready task MUST be evaluated by Spec 144 through its own
  policy, which alone authorizes one bounded execution with concurrency safety
  and deterministic Ready-task selection.
- **FR-009**: Execution MUST reuse the established Spec 142 / Spec 138 bridge
  with exact canonical project binding, exact repository/worktree context,
  structured task requirements, no task-text shell interpolation, no
  cross-project fallback, and no global latest-project singleton.
- **FR-010**: The real ADOS execution integration MUST be exercised so the
  generated development request reaches the configured ADOS project execution
  path and produces durable run status observable by the office; no mock-only
  shortcut may skip ADOS semantics.
- **FR-011**: The durable ADOS role assignment used by the run MUST be exposed
  from ADOS durable state (not a fake UI label): implementer Claude, reviewer
  Codex, mode adaptive, reason "explicit operator preference for Claude
  implementer". Claude MUST NOT review its own candidate. If Codex review
  runtime is unavailable, the run MUST remain safely blocked rather than
  self-reviewing.
- **FR-012**: The candidate produced by Claude MUST durably identify Claude as
  candidate owner and the independent reviewer MUST be Codex. Before publication
  the run MUST prove candidate owner != reviewer and validated SHA = reviewed
  SHA = exact HEAD. No stale review approval may be reused.
- **FR-013**: The office MUST be able to truthfully represent lifecycle states
  equivalent to Planning, Backlog, Ready, Engineering, Review, Validation/QA,
  and Complete, and MUST NOT fabricate percentage progress.
- **FR-014**: Spec 140 portfolio/project-company state MUST remain correct while
  the run progresses, distinguishing the tested project as planning, ready,
  active, attention-needed/blocked, or completed, with no state leaking into
  another project.
- **FR-015**: Runtime evidence MUST include at least one second canonical
  project context that receives none of Project A's suggestion, backlog task,
  Ready transition, execution, ADOS status, or candidate/reviewer state.
- **FR-016**: Replaying or duplicating relevant lifecycle events MUST NOT create
  duplicate suggestions, accepted backlog tasks, Ready transitions, execution
  requests, or ADOS runs; existing idempotency mechanisms MUST be exercised.
- **FR-017**: While the tested project has active execution, Spec 147 MUST NOT
  generate uncontrolled extra work where policy prohibits it, Spec 146 MUST NOT
  produce unsafe extra Ready work where policy prohibits it, and Spec 144
  concurrency limits MUST remain enforced. Safety gates MUST NOT be disabled to
  demonstrate autonomy.
- **FR-018**: Reload/re-entry during or after the lifecycle MUST preserve
  truthful project state and MUST NOT restart completed stages or produce
  duplicate planning/execution.
- **FR-019**: If any stage fails, the authoritative prior state MUST be
  preserved, a concise failure/block reason MUST be exposed, and the run MUST
  NOT silently advance, auto-approve, or fabricate completion.
- **FR-020**: The composition MUST prove at most one sequential autonomous
  cycle and MUST NOT introduce an uncontrolled recursive loop; any later cycle
  MUST require a fresh bounded lifecycle event and respect
  cooldown/capacity/idempotency.
- **FR-021**: After Spec 148, manual suggestion generation, manual suggestion
  review, manual backlog -> Ready, and manual Start Development MUST remain
  functional, and the operator MUST be able to disable each automation stage
  independently.
- **FR-022**: Stable runtime evidence MUST be produced for one complete
  controlled cycle, including project A identity, project B isolation identity,
  four automation policy states, suggestion id, accepted task id, backlog state,
  Ready transition, execution/development request identity, ADOS durable run id,
  ADOS role assignment, candidate owner, reviewer identity,
  candidate/validated/reviewed SHA where available, exact HEAD result,
  publication/completion result, duplicate-event/idempotency evidence,
  active-run gating evidence, and reload persistence evidence. Tracked runtime
  evidence MUST use stable repository-relative paths and MUST NOT persist
  absolute feature-worktree-specific paths.
- **FR-023**: Deterministic automated coverage MUST exist for the checks listed
  in "Required Tests" (A through Z) of the authoritative requirements.

### Key Entities

- **Autonomous Cycle Evidence**: A repository-relative JSON record capturing one
  complete controlled cycle across Specs 141-147 and ADOS.
- **ADOS Role Assignment**: Durable ADOS run state naming implementer, reviewer,
  mode, reason, and candidate owner for the verification run.
- **Existing Stage Policies and Coordinators**: The authoritative Spec 141-147
  services and the Spec 142/138 bridge, reused unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: One controlled autonomous project cycle is demonstrated end to end
  in the expected order with each transition occurring exactly once.
- **SC-002**: Each of the four automation controls can be toggled independently
  with zero effect on the other three in 100% of trials.
- **SC-003**: The second project receives zero artifacts from the first
  project's cycle in 100% of trials.
- **SC-004**: Replaying each lifecycle event produces zero duplicate
  suggestions, backlog tasks, Ready transitions, execution requests, or ADOS
  runs.
- **SC-005**: With an active execution present, prohibited extra
  planning/Ready/execution work is produced zero times and concurrency limits
  hold.
- **SC-006**: Reload restores policy and lifecycle state without restarting a
  completed stage in 100% of trials.
- **SC-007**: The durable role assignment for this run reports implementer
  Claude and reviewer Codex, the two are distinct, and the candidate owner is
  Claude.
- **SC-008**: Convergence is not reported unless validated SHA = reviewed SHA =
  exact HEAD, and a stale approval never authorizes a newer candidate.
- **SC-009**: No new fabricated percentage-progress field is introduced by
  Spec 148.
- **SC-010**: Manual suggestion generation, manual review, manual backlog ->
  Ready, and manual Start Development remain functional after Spec 148.

## Assumptions

- The controlled deterministic E2E harness drives the existing
  `OfficeProjectPortalController` and real Spec 141-147 services with a
  deterministic Spec 143 suggestion provider fixture and the real
  `ExternalProjectAdosExecutionService`, replacing only its injectable
  `ImplementerRuntimeProvider` (the OS process spawn) with a deterministic fake,
  per authoritative requirement 23.
- The real ADOS execution-path semantics (preparation validation, trusted-policy
  and safe-command checks, structured requirements request, durable
  execution/result/run-status records observable by the office) are exercised by
  that real service in the harness. The durable role assignment and run id are
  mirrored into the tracked, sanitized `ados-run.sanitized.json` and transcribed
  unchanged into `runtime-evidence.json`; `spec148RoleAssignmentEvidence.test.ts`
  cross-checks both against the durable `.agent-workflow/runs/148-.../ados-run.json`
  when it is present. `runtime-evidence.json.shaAlignment` names the durable ADOS
  sources where the candidate / validated / reviewed SHAs are available and the
  module enforcing `validated == reviewed == exact HEAD`, instead of freezing a
  SHA literal or review decision that goes stale the moment the artifact is
  committed. Exact-HEAD convergence and publication remain the human-only gate
  and require an Approved independent Codex review of the exact re-validated
  candidate.
- `.agent-workflow/` run state is gitignored; role-assignment values are mirrored
  into a tracked sanitized artifact (no absolute paths) rather than read only
  from an untracked path at test time.
- Office lifecycle states (Planning, Backlog, Ready, Engineering, Review,
  Validation/QA, Complete) and portfolio attention states (planning, ready,
  active, attention-needed/blocked, completed) are already representable by
  existing views and are asserted, not redesigned.

## Explicit Non-Goals

New autonomous planning policy; changing Spec 144-147 policy semantics; global
scheduler; infinite continuous autonomy; new AI provider abstraction; automatic
model switching inside AIverse; token accounting UI; replacing ADOS; bypassing
independent review; bypassing exact HEAD; removing operator controls; office
redesign; generic workflow engine rewrite.
