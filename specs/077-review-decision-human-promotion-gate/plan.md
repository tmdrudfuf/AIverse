# Implementation Plan: Review Decision Human Promotion Gate

**Branch**: `codex/077-review-decision-human-promotion-gate` | **Date**: 2026-08-01 | **Spec**: [spec.md](./spec.md)

## Summary

Add a focused `review-decision` domain module that (a) derives a truthful, non-persisted classification of the current Reviewer Runtime outcome for the active execution chain, and (b) exposes exactly one new explicit human action — Promote — that, after a full final revalidation of the chain through a Completed, unstale, `Approved` Reviewer Runtime, records exactly one immutable Review Promotion. No provider is invoked, no subprocess is spawned, no repository or GitHub mutation occurs; this feature only interprets an existing decision and records a human's explicit acknowledgment of it.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services and state only. No new external dependency — unlike Specs 075/076, this feature spawns no subprocess and therefore needs no `node:child_process` guard.

**Storage**: In-memory per-project portal state and immutable local collections, matching every prior pipeline stage.

**Testing**: Vitest focused tests, full `npm test`, TypeScript, build, and diff checks.

**Target Platform**: Existing browser/game runtime for the controller/view/registry layer; this feature has no Node-only code path, since it performs no subprocess invocation.

**Performance Goals**: Classification derivation and Promotion creation are synchronous, single-pass, in-memory operations; no polling, no background work.

**Constraints**: No Claude or Codex invocation, no Implementer or Reviewer Runtime start/restart, no repository/GitHub mutation, no commit/push/PR of any kind from product code.

**Scale/Scope**: One Review Promotion per distinct Reviewer Runtime attempt per project.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value, acceptance scenarios, boundaries, and measurable outcomes.
- Plan Before Code: Passed. This plan is authored before any implementation, per the standard Spec Kit sequencing.
- Tasks Gate Implementation: Will be satisfied by `tasks.md`; implementation does not begin until this planning package is committed and reviewed by the repository's human approval process.
- Preserve Application Stability: Satisfied by extending existing office portal modules only; Execution Plan/Readiness/Approval/Preflight/Runtime Start/Implementer Runtime/Reviewer Runtime services are reused unmodified.
- Validation Required: Satisfied by the validation plan below, scoped per `docs/agent-workflow/token-efficient-review-policy.md` (targeted validation during implementation, full validation once before the final commit).

## Project Structure

### Documentation

```text
specs/077-review-decision-human-promotion-gate/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── review-decision-contract.md
│   └── human-promotion-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (planned)

```text
src/features/city-view/scene/office/
├── review-decision/
│   ├── ReviewDecisionTypes.ts
│   ├── ReviewDecisionService.ts
│   ├── ReviewDecisionView.ts
│   └── *.test.ts
├── reviewer-runtime/         (reused, unmodified)
├── implementer-runtime/      (reused, unmodified)
├── runtime-start/            (reused, unmodified)
├── runtime-preflight/        (reused, unmodified)
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
├── OfficeProjectPortalView.ts
└── OfficeActionInputController.ts
```

## Architecture Decisions

### Decision 1 — The review-decision classification is derived, never stored

`ReviewDecisionState` is fully computable from the current Reviewer Runtime record/result plus a chain-revalidation check — there is no new fact this classification carries that is not already present in existing stored state. Storing it as its own persisted collection would create a second source of truth that could drift from the Reviewer Runtime record it is derived from. `ReviewDecisionService.classify` is therefore a pure function computed fresh on every read (dashboard render, Promote precondition check), matching the token-efficient policy's preference for the smallest correct model over premature persistence.

### Decision 2 — Review Promotion is the only new persisted fact

Unlike the classification, a Review Promotion genuinely is new information: an explicit human decision that did not exist before the Promote action. It is the only new stored collection this feature introduces (`ReviewPromotionCollection` / `ReviewPromotionResultCollection`), following the exact immutable, project-scoped, `Record<projectId, ...>` storage shape every prior pipeline stage uses.

### Decision 3 — No new environment-variable spawn gate

Specs 075 and 076 each required a double-gate (`typeof window !== "undefined"` plus an explicit `AIVERSE_ALLOW_*_SPAWN` environment variable) because each spawns a real subprocess. This feature spawns nothing — there is no provider, no `node:child_process` import, and therefore no spawn gate to add. Adding one here would be an unrequested abstraction with no real capability behind it.

### Decision 4 — Promote is a single-shot synchronous action, not a two-phase confirm

The spec's "prevent promotion from anything that changes between initial availability check, chain revalidation, and final promotion operation" requirement (see spec.md, "Staleness") is satisfied by never trusting a previously rendered classification: `ReviewDecisionService.promote` re-derives the full classification from current state as its first step, in the same synchronous call that then creates the record. Because this is single-threaded, synchronous, in-memory JavaScript with no `await` between the check and the write, there is no genuine window for a second mutation to interleave — the "staleness" property is about never reading a stale *closure-captured* value from an earlier render, not about async concurrency control. No lock, queue, or two-phase-commit mechanism is introduced.

### Decision 5 — Idempotency via a deterministic Review Promotion id

Following `ReviewerRuntime`'s own `<projectId>:reviewer-runtime:<reviewTargetId>:<rulesVersion>` deterministic-id pattern, `ReviewPromotion.reviewPromotionId` is deterministic: `<projectId>:review-promotion:<reviewerRuntimeId>:<rulesVersion>`. A second Promote action for the same Reviewer Runtime recomputes the same id, finds the existing record, and returns it unchanged — the same "already completed" short-circuit `ImplementerRuntimeService`/`ReviewerRuntimeService` already use, applied one stage later. No separate duplicate-check flag or active-attempt set is needed, since this operation is synchronous and has no in-flight state to track.

## Chain Revalidation

Before deriving a classification or accepting a Promote action, `ReviewDecisionService` re-derives and revalidates the same chain `ReviewerRuntimeService.validateContext` already validates (Execution Plan through Reviewer Runtime), via its own private `validateChain` function with `REVIEW_PROMOTION_*`-prefixed reason codes. **Correction made during implementation:** the repository's established convention is that each pipeline stage duplicates its own validation logic rather than importing a sibling stage's private functions — confirmed by `ImplementerRuntimeService.ts` and `ReviewerRuntimeService.ts` each already maintaining their own independent, non-exported `validateContext`, and `getActorBlockReason` being independently duplicated across five existing services. `ReviewDecisionService.validateChain` follows this same precedent: it mirrors `ReviewerRuntimeService.validateContext`'s field-by-field checks rather than importing or exporting them, preserving the Constitution Check's "Reviewer Runtime services reused unmodified" (zero edits to `reviewer-runtime/*.ts`). It adds exactly one further check beyond what Spec 076 validates: the Reviewer Runtime's own `status === "Completed"` and `decision === "Approved"`. Per `docs/agent-workflow/token-efficient-review-policy.md`, this feature's revalidation depth intentionally matches its closest sibling (`ReviewerRuntimeService.validateContext`) and does not attempt a deeper repository-wide linkage audit beyond what that approved, already-reviewed sibling performs.

## Explicit Human Action

`OfficeProjectPortalInput` gains `promoteReviewPressed: boolean`, distinct from `startImplementerPressed`/`startReviewerPressed`/`enterPressed`/`actionPressed`, bound to `PROMOTE_REVIEW_KEY_CODE = "KeyP"` in `OfficeActionInputController` (the only unused single-letter mnemonic key among the existing pipeline-action keys). The dashboard input handler only attempts a Review Promotion when this field is true. The actor label is the same provider-neutral `"Local Human"` constant every prior stage uses; it is rejected by the same `codex|claude|agent|bot|automation|workflow` pattern if it were ever anything else.

## State and Storage

`ReviewPromotion`/`ReviewPromotionResult` collections are project-scoped (`Record<projectId, ReviewPromotionCollection>` / `Record<projectId, ReviewPromotionResultCollection>`), immutable, and stored in `ProjectPortalState` exactly like every prior stage. Per FR-011, `clearRuntimePreflightForProject` (the existing shared invalidation helper) does **not** delete these two collections — a recorded Review Promotion is an immutable historical record that must survive upstream invalidation, unlike every prior stage's records, which are still cleared together as before. Staleness is instead shown via the dashboard row comparing the promotion's `reviewerRuntimeId` against the current classification (see tasks.md T009).

## Dashboard Strategy

Add a `[REVIEW DECISION]` row immediately after `[REVIEWER RUNTIME]`, one priority step past Reviewer Runtime's own dashboard priority (making it at least as disposable as the existing Reviewer Runtime row, never more prominent). Row text pairs the derived classification with, once a Review Promotion exists, an explicit "Promoted — Human Decision Recorded, no push/PR/merge/validation/mutation" clause. An `Approved`-but-not-yet-Promoted state shows "Approved — Promotion Available (press P)," never implying promotion already happened.

A realistic full-layout regression test (`[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, `[REVIEWER RUNTIME]`, and `[REVIEW DECISION]` all present, using the existing containment helper) proves no row overlaps the drawn panel.

## Validation Strategy

Per `docs/agent-workflow/token-efficient-review-policy.md`:

- **During implementation**: targeted Vitest runs scoped to `review-decision/*.test.ts` and the touched controller/view files, plus targeted `tsc` on touched files.
- **After each review-fix**: validate only the affected behavior (the scoped test file(s) for that fix).
- **Before the final commit**: one full-repository pass — `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.

## Relationship to Specs 075 and 076

Spec 075 (Claude Implementer Runtime) and Spec 076 (Codex Reviewer Runtime) each add one bounded, safety-gated real-process stage. Spec 077 adds no process stage at all — it is a pure interpretation-and-human-decision layer sitting immediately after Spec 076, reusing Spec 076's validation chain as its own upstream precondition exactly as Spec 076 reused Spec 075's. It does not modify, extend, or generalize either prior stage's internals.

## Human Approval Boundary

Everything in this feature — classification derivation, chain revalidation, Review Promotion recording — is local implementation and local state only. Per `docs/agent-workflow/token-efficient-review-policy.md` and `AGENTS.md`, push, PR creation, marking a PR ready, merge, and any other remote GitHub mutation remain strictly human-gated and are not part of this feature's scope or its task list's executable steps.

## Complexity Tracking

No constitution violations. No new external dependency is introduced (this feature is the first pipeline-stage addition since Spec 070 that adds zero new runtime dependencies, since it spawns no process).
