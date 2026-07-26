# Feature Specification: Runtime Role Selection

**Feature Branch**: `codex/runtime-role-selection`

**Created**: 2026-07-25

**Status**: Draft

**Input**: User description: "Add a safe CLI-level Runtime Role Selection feature: choose only the Implementer at execution time (`--implementer <agent-id>`) and have the workflow automatically resolve the other configured agent as Reviewer, without editing the state file, without weakening runner safety, and without changing roles mid-resume."

## Clarifications

### Session 2026-07-25

- Q: Why does the CLI accept only `--implementer` instead of a paired `--implementer`/`--reviewer` flag pair? A: For the current default two-agent roster, the Reviewer is always "the other configured agent," so a second flag would be redundant and would open a path to accidentally configuring the same agent for both roles. A distinct `--reviewer`/multi-flag design is deferred until a roster larger than two agents is the common case.
- Q: How is the Reviewer resolved when exactly two agents are eligible? A: Deterministically — whichever agent was not named by `--implementer` (or, absent an override, not resolved as Implementer by state/default) is auto-selected as Reviewer. No configuration or guessing is required.
- Q: What happens with more than two eligible agents (an opt-in `roleRoster`)? A: The workflow preserves the previously configured, distinct, valid Reviewer if one exists in the roster; otherwise it rejects with an ambiguity diagnostic before any process spawns rather than nondeterministically picking one.
- Q: Why doesn't a CLI `--implementer` override permanently rewrite the configured `stageAgents` in the state file? A: The flag is scoped to one execution by design, so a maintainer can try the opposite role direction without editing or corrupting the durable configuration, and so repeated runs with different overrides remain safe and reversible.
- Q: Why can't a resumed run change roles mid-flight? A: A run's Reviewer must stay independent and stable for the duration of that run; allowing roles to rotate mid-run could let an agent that already acted as Implementer become the Reviewer of its own work, or vice versa, silently defeating independent review. Resolved roles are pinned into `state.orchestration` the first time a non-terminal run resolves them and reused until that run reaches a terminal stage.
- Q: How do legacy `codex`/`claude` runner ids stay compatible? A: `--implementer` and the resolver accept the existing `codex`/`claude` agent ids used by `stageAgents`/`agentRunners` today; no renaming or migration of existing state files or configuration is required.
- Q: How do runtime role ids stay provider-neutral? A: Resolution operates on the configured `agentRunners` roster and agent ids/display names (not literal vendor branching); orchestration logic reads the resolved Implementer/Reviewer ids rather than branching on the strings `codex` or `claude`, so additional agents can be added by configuration alone.
- Q: Does an explicit `--agent` override still take precedence where both `--agent` and `--implementer` are supported (`run-review`)? A: Yes. `--agent` remains the authoritative Reviewer override for backward compatibility; `--implementer` supplies Implementer context and is still validated (existence, enabled, safety) even when `--agent` is also supplied, but it only auto-derives the Reviewer when `--agent` is absent.
- Q: Why does `--dry-run` still perform full role validation instead of skipping it? A: Dry-run exists to let a maintainer safely preview what a real run would do, including rejections; skipping validation would let an invalid `--implementer` value appear to "work" in preview and only fail during a real run, undermining the purpose of dry-run.
- Q: Why do push, PR creation, PR-ready marking, approval, merge, and branch deletion remain human-gated regardless of resolved roles? A: Runtime role selection changes which configured local CLI performs implementation/review stages; it does not change the repository's remote-mutation boundary. No resolved role, CLI override, or fallback swap is permitted to trigger remote actions — those remain exclusively human-triggered, consistent with every prior spec in this workflow.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Pick the Implementer for One Run (Priority: P1)

An AIverse maintainer wants to run the orchestration with Claude CLI as Implementer for this run only, without editing `stageAgents` in the state file, and have Codex CLI automatically selected as Reviewer.

**Why this priority**: This is the entire point of the feature: remove the need to hand-edit state just to try the other role direction.

**Independent Test**: Run `orchestrate --implementer claude` against a state with no `stageAgents` override and verify the printed "Resolved roles" block shows Implementer=Claude CLI, Reviewer=Codex CLI, Role source=cli-override, and that the configured state file's `stageAgents`/`roles` are unchanged on disk afterward.

**Acceptance Scenarios**:

1. **Given** a state with no role overrides, **When** the maintainer runs `orchestrate --implementer claude`, **Then** the workflow resolves Implementer=claude, Reviewer=codex, and prints `Role source: cli-override`.
2. **Given** the same state, **When** the maintainer runs `orchestrate --implementer codex`, **Then** the workflow resolves Implementer=codex, Reviewer=claude.
3. **Given** a completed CLI-override run, **When** the maintainer inspects the state file, **Then** `stageAgents` (or its absence) is unchanged from before the run.

---

### User Story 2 - Resume Continuity (Priority: P1)

An AIverse maintainer's orchestration run is interrupted after roles were resolved via `--implementer`. Re-invoking `orchestrate` on the same state file must continue with the same roles, and a conflicting `--implementer` on resume must be rejected before any spawn.

**Why this priority**: Silent mid-run role changes would let the Implementer and Reviewer roles rotate unpredictably, breaking the golden rule that a run's reviewer must stay independent and stable for its own duration.

**Independent Test**: Start a run with `--implementer claude`, simulate an interruption after the implement stage persists state, resume with no `--implementer` and verify roles stay Claude/Codex; resume again with `--implementer codex` and verify the run is rejected before any process spawns.

**Acceptance Scenarios**:

1. **Given** a resolved in-progress run with Implementer=claude/Reviewer=codex, **When** the maintainer resumes without `--implementer`, **Then** the run continues with Implementer=claude/Reviewer=codex.
2. **Given** the same in-progress run, **When** the maintainer resumes with `--implementer claude` (matching), **Then** the run continues normally.
3. **Given** the same in-progress run, **When** the maintainer resumes with `--implementer codex` (conflicting), **Then** the command rejects before spawning any process and the persisted run roles are unchanged.

---

### User Story 3 - Safe Validation Before Spawn (Priority: P1)

An AIverse maintainer supplies an unknown, disabled, or unsafely-configured `--implementer` value, or a value that cannot be resolved to a distinct Reviewer, and the workflow must reject before spawning any process, and must never assign the same agent to both roles automatically.

**Why this priority**: `--implementer` must not become a new way to bypass Spec 045 runner safety checks or accidentally collapse independent review into self-review.

**Independent Test**: Run `orchestrate --implementer unknown-agent`, `--implementer <disabled-agent>`, and a configuration with an unsafe Reviewer runner; verify each is rejected before any process adapter call, with a diagnostic naming the requested Implementer and the available eligible agents.

**Acceptance Scenarios**:

1. **Given** `--implementer unknown-agent` where `unknown-agent` is not configured, **When** orchestration resolves roles, **Then** it rejects before spawn and lists the configured eligible agents.
2. **Given** `--implementer <id>` where `<id>` is configured with `enabled: false`, **When** orchestration resolves roles, **Then** it rejects before spawn.
3. **Given** `--implementer <id>` where the resolved Reviewer's configured runner is remote-mutating, **When** orchestration resolves roles, **Then** it rejects before spawn with the existing Spec 045 runner-safety error.
4. **Given** a role roster where no distinct Reviewer can be resolved, **When** orchestration resolves roles, **Then** it rejects before spawn instead of assigning the same agent to both roles.

### Edge Cases

- No CLI override and no state override: existing default Implementer=Codex/Reviewer=Claude behavior is unchanged.
- No CLI override, state-configured `stageAgents` swap: existing role-swapped behavior is unchanged.
- `--implementer` combined with a role roster of exactly two agents: the other agent is always chosen deterministically.
- `--implementer` combined with a role roster of three or more agents: the previously configured Reviewer is preserved if it is distinct and part of the roster; otherwise the run is rejected with an ambiguity diagnostic.
- `--implementer` supplied with no value, or immediately followed by another flag: rejected as a missing value before spawn.
- `--implementer` repeated with the same value: normalized to one value.
- `--implementer` repeated with conflicting values: rejected before spawn.
- `run-review --implementer <id>` with `--agent` also supplied: `--agent` remains the authoritative Reviewer override (existing behavior); `--implementer` only supplies Implementer context unless `--agent` is absent, in which case the Reviewer is auto-derived.
- A completed (terminal) run's resolved roles must never leak into an unrelated new run started later on a fresh state file.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The CLI MUST accept `--implementer <agent-id>` on `orchestrate`, and MUST NOT require a paired `--reviewer` flag for the current two-agent configuration.
- **FR-002**: When `--implementer` is supplied and exactly one other eligible agent is configured, the workflow MUST automatically resolve that other agent as Reviewer.
- **FR-003**: Role resolution priority MUST be, in order: CLI `--implementer` override, then state-configured roles (`stageAgents`), then existing defaults (Implementer=Codex CLI, Reviewer=Claude CLI).
- **FR-004**: A CLI-level `--implementer` override MUST apply only to the current execution and MUST NOT rewrite the configured state role mapping.
- **FR-005**: The workflow MUST reject, before spawning any process, a requested Implementer that does not exist, is disabled, has no valid runner configuration, or has an unsafe (remote-mutating) runner configuration.
- **FR-006**: The workflow MUST reject, before spawning any process, a role resolution that would assign the same agent to both Implementer and Reviewer as a result of a CLI override.
- **FR-007**: For a role roster of more than two eligible agents, the workflow MUST either preserve a distinct, valid, configured Reviewer or reject with an ambiguity diagnostic; it MUST NOT select a Reviewer nondeterministically.
- **FR-008**: The workflow MUST persist the effective roles actually used for a run in additive state fields (`latestResolvedRoles`, `latestRoleResolutionSource`, and per-run fields under `orchestration`) without modifying `stageAgents`/`agentRunners` configuration.
- **FR-009**: Once a non-dry-run orchestration run has resolved roles, a resumed execution on the same state file MUST continue with those same roles regardless of default changes, state edits, or a missing CLI override, and MUST reject a conflicting `--implementer` before spawning any process.
- **FR-010**: A completed (terminal) run's resolved roles MUST NOT be reused to control a subsequently started new run on a fresh state file.
- **FR-011**: `orchestrate --dry-run --implementer <id>` MUST perform full role validation and print the resolved roles and role source without spawning any process, writing any state, writing any run artifact, or running any validation command.
- **FR-012**: All role-based orchestration stages (implementation, validation handoff, review, Reviewer questions, Implementer answers, final decision review, fix, re-review, finding lifecycle classification, final verification, human-merge-decision output) MUST use the resolved effective roles; orchestration logic MUST NOT branch directly on the literal strings `codex` or `claude`.
- **FR-013**: Prompt generation and independent-review artifacts MUST identify the actual configured Implementer/Reviewer identities and MUST NOT contain hard-coded incorrect agent-name assumptions.
- **FR-014**: `--implementer` support MAY be extended to `run`, `run-review`, and `detect-agent` where it fits the existing per-command architecture; it MUST NOT be added to commands that do not resolve workflow roles.
- **FR-015**: Existing behavior when `--implementer` is not supplied MUST be unchanged, including default roles, state-configured role swaps, the Reviewer question loop, bounded fix cycles, structured review parsing, finding lifecycle tracking, BOM-tolerant state loading, existing runner safety checks, and existing timeout/resume semantics.
- **FR-016**: A missing `--implementer` value MUST be rejected before spawn; repeated `--implementer` flags with conflicting values MUST be rejected before spawn; repeated `--implementer` flags with an identical value MUST be accepted as that one value.
- **FR-017**: This feature MUST NOT modify production `src/` files and MUST limit changes to `tools/agent-workflow/`, `specs/053-runtime-role-selection/`, `AGENTS.md`, `CLAUDE.md`, `.specify/feature.json`, and related workflow documentation.

### Key Entities *(include if feature involves data)*

- **Effective Roles**: A normalized `{ implementer: { agentId, displayName }, reviewer: { agentId, displayName }, source }` result describing the roles actually used for one execution, where `source` is `cli-override`, `state`, or `default`.
- **Role Roster**: The list of agent IDs eligible for automatic Reviewer derivation; defaults to `["codex", "claude"]` and may be extended via optional state configuration for multi-agent setups.
- **Pinned Run Roles**: The `resolvedImplementerId`/`resolvedReviewerId`/`roleResolutionSource` fields persisted under `state.orchestration` the first time a run resolves roles, reused for the remaining lifetime of that non-terminal run.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `orchestrate --implementer claude --dry-run` and `orchestrate --implementer codex --dry-run` each print the correct opposite Reviewer and spawn zero processes.
- **SC-002**: Focused tests prove role-resolution priority (CLI override > state > default) with deterministic results regardless of configuration object insertion order.
- **SC-003**: Focused tests prove unknown, disabled, unsafe, ambiguous, and same-agent role resolutions are all rejected before any process spawn.
- **SC-004**: Focused tests prove a resumed run preserves previously resolved roles and rejects a conflicting `--implementer` before spawn.
- **SC-005**: Mock-runner smoke tests demonstrate both role directions and a full question/fix cycle routed entirely through resolved roles, with no manual message relay.
- **SC-006**: Existing Spec 045/048/049/050/051/052 focused tests remain green without modification to their assertions.

## Assumptions

- The current product default remains a two-agent configuration (Codex CLI, Claude CLI); multi-agent rosters are an opt-in extension point, not the common case.
- "Resume" means re-invoking `orchestrate` on the same state file while its orchestration run is non-terminal (interrupted or restarted mid-run), matching the architecture's existing single-state-file run model.
- A state file with no persisted `orchestration.startedAt` represents a new run and is free to resolve roles fresh from CLI/state/default.
- `run-review` and `detect-agent` have no persistent multi-stage "run" concept, so resume-style role pinning is scoped to `orchestrate` only.
