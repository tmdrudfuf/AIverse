# Feature Specification: Codex Reviewer Runtime Foundation

**Feature Branch**: `codex/076-codex-reviewer-runtime-foundation`

**Created**: 2026-07-31

**Status**: Draft

**Input**: User description: "Spec 076 adds a deterministic, bounded, provider-neutral Reviewer Runtime layer after a Completed Implementer Runtime, whose first concrete product provider is Codex CLI. It requires an explicit human Start-Reviewer action distinct from Start-Implementer, enforces the approved Claude=Implementer/Codex=Reviewer role binding without relying on repository defaults, revalidates the complete execution chain (including a Completed, unstale Implementer Runtime) immediately before spawn, resolves a review target that can never dishonestly claim a clean committed tree, validates command safety, parses a bounded Approved/Changes-Requested decision with findings, and produces a bounded terminal result without invoking Claude, running the dedicated Validation stage, or performing any GitHub mutation."

## User Scenarios & Testing

### User Story 1 - Start the Codex Reviewer Runtime (Priority: P1)

A human operator, viewing a project whose Implementer Runtime has reached a Completed result, takes an explicit action distinct from Start-Implementer, causing the approved Codex CLI command to be safely invoked against the resolved review target for the current approved execution context.

**Why this priority**: This is the only new product capability Spec 076 introduces — a real, bounded, safety-validated Reviewer process start — and every other requirement exists to make this one action safe and honest.

**Independent Test**: Build a valid chain through a Completed Implementer Runtime with an approved Claude=Implementer/Codex=Reviewer binding, issue the explicit Start Reviewer action, and verify exactly one Reviewer Runtime result with a truthful terminal status (`Completed`, `TimedOut`, `Blocked`, or `Failed`), a decision (`Approved`, `ChangesRequested`, or `Unknown`) kept strictly separate from that status, `agentStarted`/`reviewerStarted` reflecting only what actually happened, and `validationStarted`/`githubMutationStarted` remaining false.

**Acceptance Scenarios**:

1. **Given** a Completed Implementer Runtime under a current Runtime Start binding Claude as Implementer and Codex as Reviewer, **When** the human takes the explicit Start Reviewer action, **Then** the system revalidates the full chain, resolves a review target, safety-validates the exact Codex command, invokes the Codex provider, and records exactly one bounded terminal result.
2. **Given** the same Completed Implementer Runtime, **When** the dashboard renders, re-renders, or the controller initializes, **Then** no Reviewer Runtime attempt occurs without the distinct explicit action.
3. **Given** a completed Reviewer Runtime result with an `Approved` decision, **Then** the dashboard shows the decision and blocking-finding count paired with a statement that human decision is still required — never a claim that the change was merged, validated, or is ready to merge.

---

### User Story 2 - Block Stale, Mismatched, Uncommitted, or Unsafe Starts (Priority: P2)

A human operator receives a safe, deterministic Blocked or Failed result when the execution chain, the Implementer Runtime, the role binding, the review target, or the command configuration is stale, missing, mismatched, uncommitted, or unsafe.

**Why this priority**: A Reviewer Runtime that spawns a real process must never do so against a context that changed after the Implementer Runtime completed, an unapproved role binding, a review target that cannot honestly be called a clean committed tree, or an unsafe command — this is the safety boundary the rest of the feature depends on.

**Independent Test**: Individually stale the plan, readiness, approval, preflight, or Runtime Start; omit or stale the Implementer Runtime; individually swap the approved role binding; individually corrupt the configured command; individually mismatch the worktree/branch/spec path; and construct a review target whose working-tree state is not `Clean` — and verify each produces `Blocked` with a distinct reason code and no provider invocation.

**Acceptance Scenarios**:

1. **Given** a chain whose upstream plan/readiness/approval/preflight/Runtime Start no longer revalidate identically, **When** Start Reviewer is pressed, **Then** the result is `Blocked` and the Codex provider is never invoked.
2. **Given** no Implementer Runtime, or an Implementer Runtime that is not `Completed`, or one that has already started a Reviewer/Validation/GitHub mutation, **When** Start Reviewer is pressed, **Then** the result is `Blocked` and the Codex provider is never invoked.
3. **Given** an execution context that does not bind Claude as Implementer and Codex as Reviewer (default repository mapping, swapped fields, or same agent in both roles), **When** Start Reviewer is pressed, **Then** the result is `Blocked` with a role-mismatch reason and the Codex provider is never invoked.
4. **Given** a review target whose working-tree state is not exactly `Clean`, **When** Start Reviewer is pressed, **Then** the result is `Blocked` before any command-safety check or provider invocation is reached.
5. **Given** a configured Codex command/arguments/input-mode that does not match the approved configuration, or that contains an unsafe pattern (remote GitHub mutation, destructive filesystem command, shell chaining, unsafe redirection, encoded/wrapped commands), **When** Start Reviewer is pressed, **Then** the result is `Blocked` and no subprocess is spawned.
6. **Given** an active (in-flight) Reviewer Runtime for the same review target, **When** Start Reviewer is pressed again, **Then** the result is `Blocked` and no second process is spawned.

---

### User Story 3 - Display Reviewer Runtime State Safely (Priority: P3)

The Project Dashboard displays Reviewer Runtime state — including the unavailable, ready-for-explicit-action, blocked, completed-with-decision, timed-out, and failed cases — without ever implying a merge, a mutation, or that a human still does not need to decide.

**Why this priority**: This is the first stage in the pipeline that can honestly claim a real independent review ran; the wording boundary between "Codex Approved" and "ready to merge" is the primary way the feature avoids misleading the human operator.

**Independent Test**: Render unavailable, ready, blocked, completed-approved, completed-changes-requested, completed-unknown, timed-out, and failed states and verify each pairs with safe wording and never with "Merged," "Ready to Merge," "Validation Passed," or "GitHub Mutation Applied." Render a realistic full dashboard containing `[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` and verify no row overlaps the drawn panel.

**Acceptance Scenarios**:

1. **Given** no Completed Implementer Runtime exists, **When** the dashboard renders, **Then** it shows Codex unavailable, needing a Completed Implementer Runtime, not started.
2. **Given** a Completed Implementer Runtime with no Reviewer Runtime attempt yet, **When** the dashboard renders, **Then** it shows Codex ready, explicit start required, not started.
3. **Given** a completed, timed-out, blocked, or failed Reviewer Runtime result, **When** the dashboard renders, **Then** it shows the matching safe wording and never a merge, validation, or mutation claim.
4. **Given** a realistic full dashboard with `[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` rows present, **When** the lower panel's row budget is exceeded, **Then** the Reviewer Runtime row is the first pipeline-stage row dropped, and no rendered row overlaps the drawn panel.

### Edge Cases

- Switching to a different project's dashboard never shows a previous project's Reviewer Runtime result.
- The same raw Implementer Runtime/plan/project identifiers under a different project never cross-resolve.
- A historical terminal result remains immutable but is not shown as currently applicable if the upstream chain has since changed.
- Actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow are rejected as the human Start-Reviewer actor.
- Reaching a Completed Implementer Runtime, opening the dashboard, or the passage of time never triggers a Reviewer Runtime attempt by itself.
- A repository-default role mapping (Codex=Implementer) must not silently satisfy this feature's approved Codex=Reviewer binding.
- A configured Codex command that differs from the safety-validated command must never be the one actually spawned.
- This repository's pipeline has no real git-backed commit stage yet, so a deterministic, zero-I/O review-target resolution can never honestly report a `Clean` working tree; the feature's own fallback is to mark it `Uncommitted` and block, never to fabricate `Clean`.
- Conflicting explicit decision markers (both `Decision: Approved` and `Decision: Changes Requested` present) never resolve to `Approved`.
- An `Approved` decision co-occurring with a parsed blocking finding, or with a non-zero process exit code, is downgraded rather than trusted at face value.
- Timeout must not leave a duplicate or orphaned process, and must not silently retry.
- Claude is never invoked, and the dedicated Validation stage is never run, by product code as part of this feature.

## Requirements

### Functional Requirements

- **FR-001**: System MUST require a distinct, explicit human Start-Reviewer action, never triggered by a Completed Implementer Runtime's existence, dashboard render, controller initialization, navigation, or elapsed time, and never satisfied by the same keypress as Start-Implementer.
- **FR-002**: System MUST reject Start-Reviewer actor labels equivalent to Claude, Codex, agent, bot, automation, or workflow.
- **FR-003**: System MUST revalidate, in order, Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, the Implementer Runtime (must be `Completed`, unstale, and not already the source of a started Reviewer/Validation/GitHub mutation), and the approved Implementer/Reviewer role binding before resolving a review target, checking command safety, or invoking the provider.
- **FR-004**: System MUST verify the approved role binding as explicit data (Implementer = `claude`, Reviewer = `codex`) rather than deriving it from the pipeline's generic `Implementer`/`Reviewer` role labels or any repository-default agent mapping; a binding that does not match, or that assigns the same agent to both roles, MUST block.
- **FR-005**: System MUST resolve a deterministic Review Target (worktree, base/feature branch, review-target commit, merge base, changed files, working-tree state) from approved product state only, and MUST block with a distinct reason code whenever the resolved working-tree state is not exactly `Clean` — never fabricating a committed, clean target this repository's pipeline cannot yet honestly produce.
- **FR-006**: System MUST validate the exact configured Codex command and argument vector for safety before spawn, and MUST spawn exactly that validated command and argument vector — never a substituted, probed, or otherwise different command.
- **FR-007**: System MUST reject unsafe commands/arguments including remote Git/GitHub mutation, destructive filesystem operations, shell chaining, command substitution, unsafe redirection, encoded command wrappers, and repository/worktree-boundary escapes.
- **FR-008**: System MUST validate that the working directory is the exact approved feature worktree, repository, branch, and specification path recorded on the current Runtime Start and Implementer Runtime.
- **FR-009**: System MUST construct a bounded, deterministic Reviewer prompt containing only approved context (project/feature/spec identifiers, worktree, base/feature branch, review-target commit, a capped changed-file list, and explicit stop-condition/prohibition clauses), excluding secrets, tokens, raw environment variables, unrelated data, and any embedded diff text — Codex inspects the exact review-target commit in the working directory itself.
- **FR-010**: System MUST parse Codex's output into exactly one of `Approved`, `ChangesRequested`, or `Unknown`, using only explicit decision markers, never free-form approval-sounding prose; conflicting explicit markers, an `Approved` decision co-occurring with a parsed blocking finding, or an `Approved` decision co-occurring with a non-zero process exit code, MUST NOT resolve to a trusted `Approved`.
- **FR-011**: System MUST produce exactly one immutable, bounded terminal result per Reviewer Runtime attempt, using only statuses truthfully supported by the underlying invocation mechanism (no fabricated live `Starting`/`Running` state), and MUST keep the terminal status strictly separate from the parsed decision.
- **FR-012**: System MUST prevent a second concurrent Reviewer Runtime start for the same review target; an active attempt MUST block a duplicate start without invoking the provider again.
- **FR-013**: System MUST NOT invoke Claude, run the dedicated Validation stage, stage files, commit, push, create or update a PR, mark a PR ready, merge, or perform any other GitHub mutation, as part of this feature.
- **FR-014**: System MUST keep `validationStarted` and `githubMutationStarted` false on every Reviewer Runtime record and result, regardless of outcome, and MUST keep `implementerStarted` true (reflecting the Implementer Runtime this review target is built from) without implying a second Implementer start.
- **FR-015**: System MUST set `agentStarted`/`reviewerStarted` true only after a confirmed provider spawn, and MUST NOT set them true on a pre-spawn block or a spawn failure.
- **FR-016**: System MUST invalidate a project's current Reviewer Runtime state whenever upstream plan/readiness/approval/preflight/Runtime Start/Implementer Runtime revalidation invalidates, using the same shared invalidation path Runtime Preflight/Runtime Start/Implementer Runtime already use.
- **FR-017**: System MUST expose Project Dashboard Reviewer Runtime rows with safe wording that never claims a merge, a mutation, or that human review of the decision is no longer required, and that pairs a `Completed`/`Approved` result with an explicit statement that human decision is still required.
- **FR-018**: System MUST preserve existing Runtime Start, Runtime Preflight, and Implementer Runtime dashboard rows; when the lower panel's row budget is exceeded, the Reviewer Runtime row MUST be the first pipeline-stage row dropped.

### Key Entities

- **ReviewerRuntime**: Immutable product-state record binding an exact, revalidated review target and approved role context to a single Reviewer Runtime attempt.
- **ReviewerRuntimeResult**: Immutable command result indicating `Completed`, `TimedOut`, `Blocked`, or `Failed`, carrying a separate `Approved`/`ChangesRequested`/`Unknown` decision, blocking/non-blocking finding counts, deterministic reason codes, and bounded, sanitized evidence.
- **ReviewerRuntimeRequest**: Explicit human request containing project, Runtime Start, approved role binding, and actor/timestamp signals.
- **ReviewTarget**: Deterministic, zero-I/O record of the exact worktree, base/feature branch, review-target commit, merge base, changed files, and working-tree state Codex is asked to review.
- **ReviewerRuntimeEvidence**: Bounded, sanitized record of the actual provider invocation (command, working directory, review-target commit, exit/timeout/signal, truncated output).
- **ReviewerPrompt**: Deterministic, bounded prompt text constructed from approved product state only, excluding any embedded diff.
- **ReviewerRuntimeFinding**: Bounded, parsed finding (severity, blocking, category, optional file/line, message, optional suggestion) extracted from Codex's output.
- **ReviewerRuntimeProvider**: Provider-neutral contract for invoking a Reviewer agent process; `CodexReviewerRuntimeProvider` is its first concrete implementation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: A valid explicit Start-Reviewer action against a Completed Implementer Runtime and a `Clean` review target produces exactly one Reviewer Runtime result in one interaction, using the exact safety-validated Codex command.
- **SC-002**: 100% of blocked or failed attempts preserve upstream Runtime Start/Implementer Runtime/Preflight/Approval/Readiness/Plan records unchanged and keep `agentStarted`/`reviewerStarted` false.
- **SC-003**: 100% of completed, timed-out, or failed attempts keep `validationStarted` and `githubMutationStarted` false.
- **SC-004**: Dashboard tests cover unavailable, ready, blocked, completed-approved, completed-changes-requested, completed-unknown, timed-out, and failed wording without any merge, validation-passed, or repository-mutated claim, and a realistic full-layout test proves `[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` all render inside the drawn panel.
- **SC-005**: A duplicate Start-Reviewer action against an already-active attempt never results in a second provider invocation.
- **SC-006**: Every test asserting the approved role binding does so against a fixture where the pipeline's generic `Implementer`/`Reviewer` labels are unchanged and only the explicit role-binding data differs, proving the binding is not derived from those labels.
- **SC-007**: Every test that reaches the Codex command-safety or spawn-allow gate does so via a directly constructed `Clean` review-target fixture, proving the always-`Uncommitted` deterministic resolution genuinely blocks every controller-driven attempt without exception.

## Assumptions

- The existing Execution Plan/Execution Readiness/Human Execution Approval/Runtime Preflight/Runtime Start/Implementer Runtime services are reused unmodified; Spec 076 does not alter their validation logic.
- The human actor label remains provider-neutral as `Local Human`, consistent with Runtime Start and Implementer Runtime.
- The concrete Codex CLI invocation is a bounded, synchronous, blocking subprocess call, following the same pattern Spec 075 established for Claude; this spec keeps that property rather than introducing an asynchronous request-version concurrency layer, for the same reason Spec 075 documented (a blocking spawn has no genuine in-flight window a later request could race against).
- The Reviewer Runtime lifecycle is truthfully limited to `Completed | TimedOut | Blocked | Failed`, with no `Cancelled` member (Spec 075's `Cancelled` was itself unreachable through any product-code path; Spec 076 does not carry forward even the unreachable placeholder).
- This repository's simulated pipeline has no product-side "create a commit" stage; the deterministic Review Target resolver therefore always reports `workingTreeState: "Uncommitted"`, matching this spec's own explicit fallback instruction (mark clearly `Uncommitted`, never fabricate the exact-HEAD gate). Consequently, no path through the controller/UI can produce a `Clean` review target in this repository today — the real Codex spawn path is exercised only via a directly constructed `Clean` fixture at the service level, exactly as a future real git-backed stage is expected to supply.
- Because the game's controller/view/registry modules are bundled into the browser client (verified empirically for Spec 075 and unchanged since), the concrete Codex CLI subprocess invocation can only execute in a Node runtime (this repository's own Vitest suite, or a documented manual smoke-test script); in an actual browser session the same provider class safely reports `Blocked` rather than attempting an impossible in-browser process spawn.
- Being a genuine Node runtime is not by itself sufficient to permit a real spawn: `CodexReviewerRuntimeProvider` additionally requires the explicit environment variable `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN=1`, deliberately distinct from Spec 075's `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN` so that enabling one spawn gate never enables the other — see plan.md, Architecture Decision 4, and Spec 075's own NB-001 non-blocking finding, which this restatement addresses.
- Spec 077 or later introduces the dedicated product Validation stage and any real GitHub mutation; neither exists yet, and this spec's dashboard/state wording is written to remain true regardless of when they arrive.
