# Feature Specification: Claude Implementer Runtime Foundation

**Feature Branch**: `codex/075-claude-implementer-runtime-foundation`

**Created**: 2026-07-30

**Status**: Draft

**Input**: User description: "Spec 075 adds a deterministic, bounded, provider-neutral Implementer Runtime layer after Runtime Start, whose first concrete product provider is Claude CLI. It requires an explicit human Start-Implementer action distinct from Runtime Start, enforces the approved Claude=Implementer/Codex=Reviewer role binding without relying on repository defaults, revalidates the complete execution chain immediately before spawn, validates command safety, and produces a bounded terminal result without invoking Codex, running validation, or performing any GitHub mutation."

## User Scenarios & Testing

### User Story 1 - Start the Claude Implementer Runtime (Priority: P1)

A human operator, viewing a project whose Runtime Start has been recorded, takes an explicit action distinct from anything that produced Runtime Start, causing the approved Claude CLI command to be safely invoked for the current approved execution context.

**Why this priority**: This is the only new product capability Spec 075 introduces — a real, bounded, safety-validated Implementer process start — and every other requirement exists to make this one action safe and honest.

**Independent Test**: Build a valid chain through Runtime Start with an approved Claude=Implementer/Codex=Reviewer binding, issue the explicit Start Implementer action, and verify exactly one Implementer Runtime result with a truthful terminal status (`Completed`, `TimedOut`, `Blocked`, or `Failed`), `implementerStarted`/`agentStarted` reflecting only what actually happened, and `reviewerStarted`/`validationStarted`/`githubMutationStarted` remaining false.

**Acceptance Scenarios**:

1. **Given** a current Runtime Start binding Claude as Implementer and Codex as Reviewer, **When** the human takes the explicit Start Implementer action, **Then** the system revalidates the full chain, safety-validates the exact Claude command, invokes the Claude provider, and records exactly one bounded terminal result.
2. **Given** the same Runtime Start, **When** the dashboard renders, re-renders, or the controller initializes, **Then** no Implementer Runtime attempt occurs without the distinct explicit action.
3. **Given** a completed Implementer Runtime result, **Then** the dashboard shows Claude Implementer Completed, Changes Require Validation, and Codex Reviewer Not Started — never a claim of correctness, validation success, or review approval.

---

### User Story 2 - Block Stale, Mismatched, or Unsafe Starts (Priority: P2)

A human operator receives a safe, deterministic Blocked or Failed result when the execution chain, role binding, command configuration, or working-directory context is stale, mismatched, or unsafe.

**Why this priority**: An Implementer Runtime that spawns a real process must never do so against a context that changed after Runtime Start, an unapproved role binding, or an unsafe command — this is the safety boundary the rest of the feature depends on.

**Independent Test**: Individually stale the plan, approval, preflight, or Runtime Start; individually swap the approved role binding; individually corrupt the configured command; individually mismatch the worktree/branch/spec path — and verify each produces `Blocked` with a distinct reason code and no provider invocation.

**Acceptance Scenarios**:

1. **Given** a Runtime Start whose upstream plan/readiness/approval/preflight no longer revalidate identically, **When** Start Implementer is pressed, **Then** the result is `Blocked` and the Claude provider is never invoked.
2. **Given** an execution context that does not bind Claude as Implementer and Codex as Reviewer (default repository mapping, swapped fields, or same agent in both roles), **When** Start Implementer is pressed, **Then** the result is `Blocked` with a role-mismatch reason and the Claude provider is never invoked.
3. **Given** a configured Claude command/arguments/input-mode that does not match the approved configuration, or that contains an unsafe pattern (remote GitHub mutation, destructive filesystem command, shell chaining, encoded/wrapped commands), **When** Start Implementer is pressed, **Then** the result is `Blocked` and no subprocess is spawned.
4. **Given** a working directory that is not the exact approved feature worktree, **When** Start Implementer is pressed, **Then** the result is `Blocked`.
5. **Given** an active (in-flight) Implementer Runtime for the same Runtime Start, **When** Start Implementer is pressed again, **Then** the result is `Blocked` and no second process is spawned.

---

### User Story 3 - Display Implementer Runtime State Safely (Priority: P3)

The Project Dashboard displays Implementer Runtime state — including the unavailable, ready-for-explicit-action, blocked, completed, timed-out, and failed cases — without ever implying validation success, Codex review, a commit, or a GitHub mutation that did not happen.

**Why this priority**: This is the first stage in the pipeline that can honestly claim a real external process ran; the wording boundary between "Claude completed" and "the result is correct" is the primary way the feature avoids misleading the human operator.

**Independent Test**: Render unavailable, blocked, completed, timed-out, and failed states and verify each pairs with "Codex Reviewer Not Started" and never with "Validation Passed," "Codex Approved," or "Ready to Merge." Render a realistic full dashboard containing both `[RUNTIME START]` and `[IMPLEMENTER RUNTIME]` and verify neither row overlaps the drawn panel.

**Acceptance Scenarios**:

1. **Given** no Runtime Start exists, **When** the dashboard renders, **Then** it shows Implementer Unavailable / Runtime Start Required / Agent Not Started.
2. **Given** a current Runtime Start with no Implementer Runtime attempt yet, **When** the dashboard renders, **Then** it shows Claude Implementer Ready / Explicit Human Start Required / Codex Reviewer Not Started.
3. **Given** a completed, timed-out, blocked, or failed Implementer Runtime result, **When** the dashboard renders, **Then** it shows the matching safe wording, Codex Reviewer Not Started, and Remote Mutation Disabled.
4. **Given** a realistic full dashboard with both Runtime Start and Implementer Runtime rows present, **When** the lower panel's row budget is exceeded, **Then** the Implementer Runtime row is the first pipeline-stage row dropped, and no rendered row overlaps the drawn panel.

### Edge Cases

- Switching to a different project's dashboard never shows a previous project's Implementer Runtime result.
- The same raw Runtime Start/plan/project identifiers under a different project never cross-resolve.
- A historical terminal result remains immutable but is not shown as currently applicable if the upstream chain has since changed.
- Actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow are rejected as the human Start-Implementer actor.
- Reaching Runtime Start, opening the dashboard, or the passage of time never triggers an Implementer Runtime attempt by itself.
- A repository-default role mapping (Codex=Implementer) must not silently satisfy this feature's approved Claude=Implementer binding.
- A configured Claude command that differs from the safety-validated command must never be the one actually spawned.
- Timeout must not leave a duplicate or orphaned process, and must not silently retry.
- Codex is never invoked, classified, or started by product code as part of this feature.

## Requirements

### Functional Requirements

- **FR-001**: System MUST require a distinct, explicit human Start-Implementer action, never triggered by Runtime Start's existence, dashboard render, controller initialization, navigation, or elapsed time.
- **FR-002**: System MUST reject Start-Implementer actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow.
- **FR-003**: System MUST revalidate, in order, Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, and the approved Implementer/Reviewer role binding before any command-safety check or provider invocation.
- **FR-004**: System MUST verify the approved role binding as explicit data (Implementer = `claude`, Reviewer = `codex`) rather than deriving it from the pipeline's generic `Implementer`/`Reviewer` role labels or any repository-default agent mapping; a binding that does not match, or that assigns the same agent to both roles, MUST block.
- **FR-005**: System MUST validate the exact configured Claude command and argument vector for safety before spawn, and MUST spawn exactly that validated command and argument vector — never a substituted, probed, or otherwise different command.
- **FR-006**: System MUST reject unsafe commands/arguments including remote Git/GitHub mutation, destructive filesystem operations, shell chaining, command substitution, unsafe redirection, encoded command wrappers, and repository/worktree-boundary escapes.
- **FR-007**: System MUST validate that the working directory is the exact approved feature worktree, repository, branch, and specification path recorded on the current Runtime Start.
- **FR-008**: System MUST construct a bounded, deterministic prompt containing only approved context, excluding secrets, tokens, raw environment variables, and unrelated data.
- **FR-009**: System MUST produce exactly one immutable, bounded terminal result per Implementer Runtime attempt, using only statuses truthfully supported by the underlying invocation mechanism (no fabricated live `Starting`/`Running` state).
- **FR-010**: System MUST prevent a second concurrent Implementer Runtime start for the same Runtime Start; an active attempt MUST block a duplicate start without invoking the provider again.
- **FR-011**: System MUST NOT invoke Codex, classify Codex output, request a review, run the dedicated Validation stage, stage files, commit, push, create or update a PR, mark a PR ready, merge, or perform any other GitHub mutation, as part of this feature.
- **FR-012**: System MUST keep `reviewerStarted`, `validationStarted`, and `githubMutationStarted` false on every Implementer Runtime record and result, regardless of outcome.
- **FR-013**: System MUST set `agentStarted`/`implementerStarted` true only after a confirmed provider spawn, and MUST NOT set them true on a pre-spawn block or a spawn failure.
- **FR-014**: System MUST invalidate a project's current Implementer Runtime state whenever upstream plan/readiness/approval/preflight/Runtime Start revalidation invalidates, using the same shared invalidation path Runtime Preflight/Runtime Start already use.
- **FR-015**: System MUST expose Project Dashboard Implementer Runtime rows with safe wording that never claims validation success, Codex approval, a commit, or a GitHub mutation, and that keeps Codex Reviewer Not Started paired with every non-unavailable state.
- **FR-016**: System MUST preserve existing Runtime Start, Runtime Preflight, and all earlier pipeline dashboard rows; when the lower panel's row budget is exceeded, the Implementer Runtime row MUST be the first pipeline-stage row dropped.

### Key Entities

- **ImplementerRuntime**: Immutable product-state record binding an exact, revalidated Runtime Start and approved role context to a single Implementer Runtime attempt.
- **ImplementerRuntimeResult**: Immutable command result indicating `Completed`, `TimedOut`, `Blocked`, or `Failed`, with deterministic reason codes and bounded, sanitized evidence.
- **ImplementerRuntimeRequest**: Explicit human request containing project, Runtime Start, approved role binding, and actor/timestamp signals.
- **ImplementerRuntimeEvidence**: Bounded, sanitized record of the actual provider invocation (command, working directory, exit/timeout/signal, truncated output).
- **ImplementerPrompt**: Deterministic, bounded prompt text constructed from approved product state only.
- **ImplementerRuntimeProvider**: Provider-neutral contract for invoking an Implementer agent process; `ClaudeImplementerRuntimeProvider` is its first concrete implementation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit Start-Implementer action produces exactly one Implementer Runtime result in one interaction, using the exact safety-validated Claude command.
- **SC-002**: 100% of blocked or failed attempts preserve upstream Runtime Start/Preflight/Approval/Readiness/Plan records unchanged and keep `implementerStarted`/`agentStarted` false.
- **SC-003**: 100% of completed, timed-out, or failed attempts keep `reviewerStarted`, `validationStarted`, and `githubMutationStarted` false.
- **SC-004**: Dashboard tests cover unavailable, ready, blocked, completed, timed-out, and failed wording without any validation-passed, Codex-approved, or repository-mutated claim, and a realistic full-layout test proves both `[RUNTIME START]` and `[IMPLEMENTER RUNTIME]` render inside the drawn panel.
- **SC-005**: A duplicate Start-Implementer action against an already-active attempt never results in a second provider invocation.
- **SC-006**: Every test asserting the approved role binding does so against a fixture where the pipeline's generic `Implementer`/`Reviewer` labels are unchanged and only the explicit role-binding data differs, proving the binding is not derived from those labels.

## Assumptions

- The existing Runtime Start/Runtime Preflight/Human Execution Approval/Execution Readiness/Execution Plan services are reused unmodified; Spec 075 does not alter their validation logic.
- The human actor label remains provider-neutral as `Local Human`, consistent with Runtime Start.
- The concrete Claude CLI invocation is a bounded, synchronous, blocking subprocess call; the existing pipeline (Plan through Runtime Start) is entirely synchronous, and this spec keeps that property rather than introducing an asynchronous request-version concurrency layer, since the underlying invocation mechanism (a blocking spawn) never produces a genuine in-flight window that a later, independent request could race against.
- The Implementer Runtime lifecycle is truthfully limited to `Completed | TimedOut | Cancelled | Blocked | Failed`; `Cancelled` is modeled for completeness but is not reachable through any product-code path in this spec, since no coherent cancellation trigger exists yet for a blocking spawn.
- Because the game's controller/view/registry modules are bundled into the browser client (verified empirically against this repository's build), the concrete Claude CLI subprocess invocation can only execute in a Node runtime (this repository's own Vitest suite, or the documented manual smoke-test script); in an actual browser session the same provider class safely reports `Blocked` rather than attempting an impossible in-browser process spawn. This mirrors the existing pipeline's own precedent of representing environment evidence (`RepresentedRuntimeEnvironmentProvider`) rather than performing real OS-level inspection from the browser.
- Being a genuine Node runtime is not by itself sufficient to permit a real spawn: `ClaudeImplementerRuntimeProvider` additionally requires the explicit environment variable `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN=1`, without which it reports `Blocked` even in Node. This second gate was added after a real incident during this feature's own development (an early, unmocked integration test spawned five live Claude Code agent processes before being caught) — see plan.md, Architecture Decision 4.
- Spec 076 or later introduces the dedicated product Codex Reviewer Runtime and the dedicated product Validation stage; neither exists yet, and this spec's dashboard/state wording is written to remain true regardless of when they arrive.
