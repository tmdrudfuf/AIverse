# Token-Efficient Review Policy

**Status:** Official review execution policy for AIverse multi-agent development.
**Applies to:** All Implementer/Reviewer workflow executions using `tools/agent-workflow/`, regardless of which agent (Claude CLI, Codex CLI, or others) is assigned to a role.

## Purpose

Independent Implementer/Reviewer review is core to AIverse's development safety model, but unbounded review loops waste tokens without improving the merged result. This policy exists to:

- Reduce unnecessary token usage across implementation, validation, and review cycles.
- Keep independent review quality high — review rigor is not being traded away, only its execution is being made efficient.
- Prevent endless review loops that re-litigate the same finding under different wording.
- Prevent unnecessary repository-wide scope expansion from a single feature's review.
- Keep human approval boundaries for remote actions fully intact.

Token efficiency and review quality are not in tension when scope, rounds, and validation are bounded deliberately. This document defines those bounds.

## Role Policy

- **Default Implementer:** Codex CLI.
- **Default Reviewer:** Claude CLI. Claude CLI also serves as fallback Implementer when explicitly assigned for a feature.
- **Approved role swaps:** A feature may swap the default roles (for example, Implementer = Claude CLI, Reviewer = Codex CLI) when explicitly documented for that feature — in its `CLAUDE.md` pointer, spec artifacts, or `tools/agent-workflow` state file `stageAgents`. Role swaps are scoped to the feature that declares them, not permanent changes to repository-wide defaults.
- **Preserving explicit role assignments:** Once a feature's roles are explicitly documented, tooling and agents must honor that assignment for the life of the feature. Do not silently fall back to tool-level defaults mid-feature, and do not reassign roles because a later session forgot the documented swap. `--implementer` overrides and `stageAgents` resolution must remain consistent with whatever was explicitly declared for that feature.

## Review Policy

- **Default cap:** Three independent review rounds per feature.
- **Additional rounds:** Permitted beyond the default cap only when a round surfaces a genuine, previously unidentified defect and a real fix is committed in response. In that case, the next round is a re-review of that specific fix, not an open-ended continuation. Rounds spent re-reviewing rejected or restated findings do not extend the cap.
- **After the final round:** If the decision is still "Changes Requested" when the round cap is reached (or when remaining findings are not genuine feature-local defects), iteration stops. Every remaining finding must be triaged as one of:
  - Fixed immediately, if the fix is small and unambiguous.
  - Rejected, with documented rationale (see [Previously Rejected Findings](#previously-rejected-findings)).
  - Recorded as an accepted residual risk.
- **Final report required:** Once the loop stops — whether at "Approved" or "Changes Requested" — a Final Report (see [Final Report](#final-report)) is required. Endless re-review cycles are never a substitute for closing out with a report and a human decision point.

## Review Scope

Reviewers should focus on:

- Files actually changed by the feature.
- Contracts referenced by the feature's spec (interfaces, types, validation chains the spec depends on).
- Regressions introduced by the feature (behavior that worked before and no longer does).
- The feature's own safety boundaries (mutation gates, human-approval gates, provider-invocation guards).

Repository-wide architectural improvements — patterns not already implemented by the feature's sibling services, conventions the codebase does not yet follow anywhere — must **not** become blocking findings unless the feature itself introduces a regression relative to its siblings. A finding that would require refactoring multiple already-merged features to satisfy is out of scope for a single feature's review.

## Previously Rejected Findings

Each feature's `review.md` (per `.specify/templates/review-template.md`) is that feature's rejected-findings ledger. Every rejected finding must record:

- The finding as raised.
- The precedent checked (which existing, already-reviewed sibling implementation was compared).
- Why the finding does not represent a feature-specific defect.

Reviewers must not repeatedly raise a substantively identical finding under different wording across rounds unless new concrete evidence is presented — a newly discovered regression, a code path the prior rejection did not consider, or a change in the precedent it was compared against. A finding that restates a prior rejection more broadly, without new evidence, is treated as already-rejected and does not reset the round cap.

## Validation Strategy

- **During implementation:** Run targeted tests, targeted validation, and targeted type checking scoped to the files and modules being changed.
- **After review fixes:** Validate only the affected behavior — the scoped test file(s) for the fix, plus type-checking of touched files.
- **Before final completion:** Run full-repository validation once — full test suite, full build, full type check, and `git diff --check` / `git diff --cached --check`.

Full-suite validation is the expensive, authoritative gate. Running it after every small edit multiplies cost without a proportional increase in confidence, since most edits only affect a narrow slice of behavior. Reserve it for true completion boundaries: immediately before a commit that closes out implementation or a review-fix cycle, and once more before the Final Report.

## Advisor Policy

Use an advisor consultation for unresolved, high-severity disagreements only — cases where a technical claim, correctness judgment, or safety/security boundary decision cannot be settled by direct code inspection and the cost of being wrong is high.

Do not invoke an advisor:

- For documentation-only tasks or summaries.
- As a way to extend or relitigate a review loop that already has a documented decision.
- Repeatedly on the same question once a rationale has been recorded — re-ask only if new evidence changes the picture.

## Tool Usage

- **Ponytail:** Keep as the default implementation discipline (minimum correct diff, no speculative abstraction). It directly reduces token usage and should not be disabled without reason.
- **Graphify:** Invoke only when explicitly requested or when producing a knowledge graph is the actual deliverable — not as a default processing step.
- **Headroom (MCP context tools):** Use when context size genuinely warrants compression or retrieval and it measurably helps. Do not compress or retrieve proactively when context is already small.
- **MCP tools and additional AI agents:** Spawn or invoke only for the specific role the workflow requires (for example, a Reviewer CLI performing an independent review) — not experimentally, and not redundantly alongside a tool that already covers the need.
- **General rule:** a tool being installed or available is not sufficient justification for using it. The bar is whether it materially improves the current task.

## Context Management

- Prefer reading diffs over re-reading whole files when the file has already been read earlier in the session.
- Avoid re-reading files that have not changed since they were last read.
- Summarize tool output concisely rather than repeating it verbatim in later messages.
- Report test results as pass/fail counts rather than pasting full suite output more than once.
- Avoid reloading the same context (memory files, spec documents, prior review results) multiple times within a single session.

These practices reduce token usage by avoiding redundant transmission of content the session has already processed, without reducing the information actually available for decision-making.

## Commit Policy

Prefer meaningful, logically bounded commits over micro-commits. A commit should represent one coherent unit of work — for example, a fix plus its regression test, or a documentation update plus the change it documents — rather than being split by file or by edit. Logical commit boundaries also make review history (and any future `review.md` ledger) easier to read against `git log`, since each commit maps to one finding, one feature step, or one validation pass.

## Human Approval Boundary

Local implementation work — writing code, running tests, committing to a local branch, running independent reviews via `tools/agent-workflow`, authoring spec and report artifacts — is allowed without per-step human approval.

Remote actions remain human-gated and require explicit approval before execution, including:

- `git push`
- Pull request creation
- Marking a pull request ready for review
- Merge
- Any other remote GitHub mutation (branch deletion, label/status changes on remote objects, etc.)

This boundary is not altered by this policy; it is restated here because token-efficiency changes to the review loop must never be read as also loosening the human approval boundary.

## Final Report

Every feature's workflow execution ends with a Final Report, whether the review loop reached "Approved" or stopped at "Changes Requested" under this policy's round cap. The report should include:

1. **Status line** — final review decision, and an explicit statement of whether remote actions have occurred or are pending human approval.
2. **Implementation summary** — what was built, in a few lines.
3. **Review history summary** — number of rounds, which findings were fixed, which were rejected (with a one-line reference to the rejection rationale in `review.md`).
4. **Outstanding items** — any accepted residual risks or rejected findings still awaiting human disposition.
5. **Final state** — branch, worktree, and final commit SHA, with confirmation the working tree is clean.
6. **Next step** — what remote action (if any) is awaiting human approval.

## AIverse-Specific Guidance

- Approved sibling implementations (already-merged features using the same service patterns) are reference implementations. When a review finding proposes a pattern change, compare it against the closest approved sibling before deciding whether it is a feature defect or a repository-wide convention question.
- Reviewers should not repeatedly request repository-wide generalizations that are already absent from approved sibling implementations. If no existing service does X, requiring only the newest feature to do X is an inconsistency to flag for a future dedicated effort, not a blocking defect in the current feature.
- Review effort should stay proportional to the feature's actual size and risk — a small pipeline-stage addition does not warrant the same review depth as a change to a shared core contract.
- Token efficiency is part of engineering quality, not a tradeoff against it. A review process that burns tokens re-deriving the same conclusion adds cost without adding safety.
- Stopping after a bounded number of review rounds, with rejected findings documented transparently, is preferable to pursuing review rounds with diminishing returns. A well-documented stop is a better outcome than an unbounded loop chasing an unreachable "Approved" on a moving target.
