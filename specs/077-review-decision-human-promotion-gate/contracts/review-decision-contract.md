# Review Decision Classification Contract

## Purpose

Defines how `ReviewDecisionService.classify` derives a `ReviewDecisionState` from existing stored state, without introducing a second source of truth for the Reviewer Runtime's outcome.

## Input Boundary

`classify(projectId, planId)` reads only:

- The current `ReviewerRuntime` record and `ReviewerRuntimeResult` for the exact active execution chain (via the existing `reviewerRuntimeCollections`/`reviewerRuntimeResultCollections` state, unmodified).
- The full upstream chain (Execution Plan, Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, Implementer Runtime, approved role binding), revalidated using the same functions `ReviewerRuntimeService.validateContext` already exposes/reuses — never a duplicated copy of that logic.

It never reads raw process output, never re-parses Codex's stdout, and never accepts a caller-supplied "assume approved" override.

## Output Boundary

`classify` returns exactly one `ReviewDecisionState` value and, when available, the exact `reviewerRuntimeId` it was derived from. It never returns a boolean "isApproved" shortcut that could be checked independently of the full state value — every caller (dashboard, Promote precondition) reads the same single classification.

## Truthfulness Rules

- A classification of `Approved` is returned only when the Reviewer Runtime's own `status === "Completed"` and `decision === "Approved"` **and** the full upstream chain revalidates identically to what the Reviewer Runtime was built from.
- Any upstream mismatch, no matter how small (a single stale field), yields `Stale` — never a downgraded-but-still-positive state.
- `classify` never caches a prior result across calls; every call re-derives from current state.

## Non-Actions

`classify` is read-only. It never creates, mutates, or deletes any record; it never invokes Claude or Codex; it never marks anything "started."
