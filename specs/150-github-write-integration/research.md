# Research: GitHub Write Integration

## Decision 1: Reuse `git` + `gh` CLI, never invent a new token-management system

**Decision**: The server authenticates to GitHub by reusing whatever `git` and `gh` CLI already have configured on the operator's own machine — the project's own git remote (already configured when it was registered, Spec 137) for `git push`, and the operator's own `gh auth login` session for `gh pr create`. "GitHub write access authorized" (FR-004) is a live, derived fact — `gh auth status` succeeding with sufficient scope (`repo`) — not a new secret the operator types into AIverse.

**Rationale**: Mirrors Spec 149's own precedent exactly: reuse the already-authenticated `claude`/`codex` CLI rather than building new credential storage. Verified on this machine: `gh auth status` already reports a logged-in session with `repo` scope. Building a second, AIverse-specific GitHub token store would duplicate what `gh` already does well, and would be a new secret-handling surface this feature does not need.

**Alternatives considered**:
- *GitHub REST API with an operator-supplied Personal Access Token, stored server-side.* Rejected: real token storage/rotation concerns for no benefit over an already-authenticated local tool; also inconsistent with how every other real-execution integration in this codebase works (reuse the local CLI).
- *A full GitHub OAuth App flow.* Rejected outright per spec.md's own Assumptions — out of scope for a single-operator, own-machine tool.

## Decision 2: The server decides the exact commands; the client never supplies one

**Decision**: Unlike Spec 149's execute route (which had to validate an arbitrary client-supplied command against an allowlist, because the client legitimately needed to specify which role's CLI to run), this feature's client only ever supplies *which registered project* to publish for. The server itself constructs every `git`/`gh` invocation from fixed, hardcoded argument lists — never from client-supplied strings beyond the project's own already-registered working directory.

**Rationale**: This removes an entire class of risk Spec 149 had to defend against (an arbitrary or malicious client-supplied command/argument list) by construction, rather than by validation. The server's own fixed command set can be read and audited directly in this feature's source, and reuses the existing `isSafeCommandLine` denylist (`git push`, `gh pr merge/ready`, etc. already blocked) as a second, defense-in-depth layer should a future change to this file ever accidentally introduce a client-influenced argument.

## Decision 3: Reuse `RuntimeBridgeProcessRunner` as-is for `git`/`gh` subprocesses

**Decision**: The new publish route spawns `git` and `gh` via Spec 149's existing `runRuntimeBridgeProcess` (`src/app/api/runtime/_lib/RuntimeBridgeProcessRunner.ts`), unmodified — it is already a generic, non-role-specific async spawn/timeout/cancel/output-cap utility, not implementer/reviewer-specific despite living under `runtime/_lib`.

**Rationale**: "Reuse before you write." That module already solved process spawning, timeout handling, and output capping correctly and is already tested; duplicating it under a new `github-publish/_lib/` would be pure repetition. Its location under `src/app/api/runtime/_lib/` is a minor naming mismatch worth tolerating rather than relocating a working, tested, reviewed module for a cosmetic reason.

## Decision 4: Publish is a fixed sequence, not a client-chosen one

**Decision**: One publish attempt always performs, in order: (1) create a new branch off the project's current `HEAD`, named deterministically (e.g. `aiverse/publish-<timestamp>`); (2) if the working tree has uncommitted changes, stage and commit them with a generated message; (3) refuse with `nothing_to_publish` if, after step 2, the new branch has no commits ahead of the project's default branch; (4) push the branch to `origin`; (5) open a pull request against the project's default branch via `gh pr create` (draft, never auto-ready).

**Rationale**: Covers both cases Spec 149's real execution can leave a project in — the agent already committed its own work, or left it as uncommitted working-tree changes — without needing to track *which* case occurred across the two features. Keeps the two features decoupled: this one only ever looks at the project's current git state at publish time, never at Spec 149's own internal run-completion event.

**Alternatives considered**:
- *Publish directly from whatever branch is currently checked out, without creating a new one.* Rejected: if the operator was already on a long-lived branch (e.g. their own `main`), this would push to or alongside it unexpectedly; a fresh, clearly-named branch per publish attempt is the safer default and matches User Story 1's acceptance scenario.

## Decision 5: Commit message and PR body are generated, not operator-typed, for v1

**Decision**: The commit message and PR title/body are generated server-side from the changed file list (no free-text input from the operator in this feature's v1). User Story 2's "planned commit message" preview shows this generated text before the operator commits to publishing.

**Rationale**: Keeps FR-005's preview requirement satisfiable without adding a text-editing UI surface in this pass; the generated message is still accurate and reviewable. A later follow-up may let the operator edit it before confirming, mirroring how Spec 149's T028/T029 UI additions were themselves incremental.

## Decision 6: Concurrency guard and audit trail mirror Spec 149's pattern exactly

**Decision**: A new, small in-memory registry (same shape as `RuntimeBridgeRunRegistry`, keyed by the project's resolved working directory) enforces "at most one publish attempt per project at a time" (FR-008), and every terminal outcome (published, refused, failed) is written to `.agent-workflow/github-publishes/<attemptId>.json`.

**Rationale**: Identical reasoning to Spec 149's research.md Decision 5 — single-operator, single-process assumption; no database needed; reuses an already-established, already-reviewed directory convention under `.agent-workflow/` (gitignored) rather than inventing a new one.
