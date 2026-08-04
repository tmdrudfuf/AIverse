# Implementation Plan: Review Runtime Chain Integrity Consolidation

**Branch**: `codex/078-review-runtime-chain-integrity-consolidation` | **Date**: 2026-08-02 | **Spec**: [spec.md](./spec.md)

## Summary

Extract `ReviewDecisionService`'s private `validateChain` into one standalone, shared `validateReviewRuntimeChainIntegrity` function (`ReviewRuntimeChainIntegrityService.ts`) that checks every chain record — Execution Plan through Reviewer Runtime Result — for both linkage to the exact current upstream context and internal validity of that record's own deterministic id and rules version. Close the nine identity/rules-version gaps a full per-stage audit found (one of which matches a prior review round's Reviewer Runtime finding; eight more of the same shape in five earlier stages the prior rounds' single-field patches never reached). `ReviewDecisionService` now consumes this one function instead of maintaining its own mirrored check list; its own responsibilities (classification, actor validation, promotion eligibility, idempotency, immutable promotion creation) are unchanged.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services and state only — the same `create*Id` helpers and `*_RULES_VERSION` constants each chain stage's own creation service already exports and uses. No new external dependency.

**Storage**: No new storage. This spec adds no new persisted collection; it only changes which function validates the existing ones.

**Testing**: Vitest table-driven tests calling the shared validator directly (one case per stage per gap-class: malformed id, unsupported rulesVersion, broken linkage), plus the full existing `ReviewDecisionService.test.ts`/`OfficeProjectPortalController.review-decision.test.ts` suites re-run unchanged to confirm no behavioral regression.

**Target Platform**: Same as Spec 077 — no subprocess, no Node-only code path.

**Performance Goals**: Same as Spec 077 — synchronous, single-pass, in-memory.

**Constraints**: No Claude/Codex invocation, no runtime start/restart, no repository/GitHub mutation, no new field or id formula invented anywhere.

**Scale/Scope**: One shared validator function, twelve per-stage internal helper functions inside it, zero new persisted state.

## Constitution Check

- Spec First: Passed. `spec.md` defines the consolidation's scope and closed gaps before implementation.
- Plan Before Code: Passed — the shared validator's audit (`.agent-workflow/spec-078-chain-integrity-audit.md`) and this plan were both produced before the extraction/gap-closing edit.
- Tasks Gate Implementation: Satisfied by `tasks.md`.
- Preserve Application Stability: Satisfied — `ReviewDecisionService`'s public `classify`/`promote` contracts are unchanged; every existing Spec 077 test continues to pass unmodified against the new internal structure.
- Validation Required: Satisfied per the Validation Strategy below.

## Project Structure

### Documentation

```text
specs/078-review-runtime-chain-integrity-consolidation/
├── spec.md
├── plan.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chain-integrity-contract.md
└── tasks.md
```

No `research.md`/`checklists/` — the full per-stage investigation already lives in `.agent-workflow/spec-078-chain-integrity-audit.md` (a working artifact, referenced directly rather than duplicated into a second document), and this spec introduces no new user-facing acceptance checklist beyond spec.md's own Success Criteria.

### Source Code

```text
src/features/city-view/scene/office/review-decision/
├── ReviewRuntimeChainIntegrityService.ts        (new)
├── ReviewRuntimeChainIntegrityService.test.ts   (new)
├── ReviewDecisionService.ts                     (modified — consumes the new validator)
├── ReviewDecisionService.test.ts                (modified — fixture id/rulesVersion fixes)
├── ReviewDecisionTypes.ts                       (unchanged)
└── ReviewDecisionView.ts / *.test.ts             (unchanged)

src/features/city-view/scene/office/
└── OfficeProjectPortalController.review-decision.test.ts  (modified — fixture id/rulesVersion fixes)
```

## Architecture Decisions

### Decision 1 — One shared validator, extracted rather than rewritten

`validateChain`'s existing per-stage structure (one private function per stage, chained with `??`) is already close to the right shape — the problem this spec fixes is completeness (nine missing id/rulesVersion checks), not structure. The fix is therefore an extraction (move the function out of `ReviewDecisionService.ts` into its own module, `validateReviewRuntimeChainIntegrity`) plus closing the nine gaps in place, not a rewrite. This is the smallest change that gives `ReviewDecisionService` one call site instead of an inline private function, satisfying User Story 2 without touching the per-stage check shape every prior review round already validated field-by-field.

### Decision 2 — Every id/rulesVersion check reuses the record's own creation-time helper, never a duplicated formula

Per the audit (`.agent-workflow/spec-078-chain-integrity-audit.md`), every one of the nine gaps already has a canonical `create*Id(projectId, upstreamId, rulesVersion = *_RULES_VERSION)` helper and `*_RULES_VERSION` constant exported from the record's own `*Types.ts`/creation service, already used at creation time. The shared validator imports and calls those same functions/constants directly — it never re-derives or inlines an id template string. This is the same "recompute using the same canonical helper used at creation" rule Spec 077's own review history already established for Execution Plan, Runtime Preflight, and Runtime Start; this spec applies it to the five stages that had not yet received it.

### Decision 3 — `getActorBlockReason` moves alongside the validator, not into it

`getActorBlockReason` (human-vs-automation actor label check) is exported from the same new module as `validateReviewRuntimeChainIntegrity`, since `ReviewDecisionService.promote`'s own actor-validation precondition already called this exact function before this spec and continues to. It is not folded into the chain-integrity validator itself: an actor label is a property of the live Promote *request*, not a property of any stored chain record, so it stays a sibling export rather than a chain-integrity check.

### Decision 4 — `mergeBaseSha`/`baseSha` equality is the closest honest check available, not a new helper

`ReviewTarget.mergeBaseSha`/`.baseSha` have no independent canonical helper of their own (see audit, stage 7) — they come from `resolveReviewTarget`'s local hash derivation, not a chain-exported constant. Per FR-005 (no invented fields), the shared validator checks the type's own real invariant — `mergeBaseSha === baseSha` in every real construction path — rather than inventing a new recomputation formula that does not exist anywhere else in the codebase.

### Decision 5 — Review Promotion/Review Promotion Result stay out of the shared validator

Per the audit (stage 10), `ReviewPromotionId`/`ReviewPromotionResultId` are always freshly computed by `ReviewDecisionService.promote()` itself from the already-validated chain — they are the *output* of promotion, never an untrusted input record the shared validator would need to revalidate. Moving their id computation into the shared validator would blur the boundary FR-007 sets: chain-record integrity (this spec) versus promotion-creation logic (`ReviewDecisionService`'s own, unchanged, responsibility).

## Chain Integrity Validation

`validateReviewRuntimeChainIntegrity(input: ReviewDecisionInput): ReviewPromotionReasonCode | undefined` chains twelve per-stage checks (`validatePlan ?? validateReadiness ?? validateApproval ?? validatePreflight ?? validateRuntimeStart ?? validateImplementerRuntime ?? validateReviewTarget ?? validateReviewerRuntime`), each returning its stage's existing `REVIEW_PROMOTION_*` reason code. Every stage now checks, in addition to its pre-existing linkage checks: the record's own id recomputed via its canonical `create*Id` helper, and its `rulesVersion` field against its canonical `*_RULES_VERSION` constant. See `.agent-workflow/spec-078-chain-integrity-audit.md` for the full per-stage before/after inventory and `data-model.md` for the consolidated table.

## State and Storage

Unchanged from Spec 077. No new collection, no new persisted field, no change to `ProjectPortalState`.

## Validation Strategy

Per `docs/agent-workflow/token-efficient-review-policy.md`:

- **During implementation**: targeted Vitest runs scoped to `review-decision/*.test.ts` and the two modified integration/controller test files.
- **Before the final commit**: one full-repository pass — `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.

## Completion Pass (post Round-1 review)

The single independent review round this plan's Validation Strategy calls for (tasks.md Phase 7/T013) returned Changes Requested: the original nine-gap audit this Summary and Decision 2 describe had not covered `ExecutionReadinessResult`/`RuntimePreflightResult`/`RuntimeStartResult`'s own id/rulesVersion (P1-001), and no stage had a field-by-field upstream-context comparison at all (P1-002) — including a `runtimeStart.executionReadinessResultId` cross-link with no check of any kind. Per the standing single-round instruction, that finding was reported rather than auto-fixed in a loop, and a separately authorized scoped completion pass closed it (tasks.md Phase 9), reusing the same Decision 1/Decision 2 approach (extend the existing per-stage functions in place, reuse each record's own canonical helper, no new reason code). The full accounting of every check this replaces the original "nine gaps" framing with is in `.agent-workflow/spec-078-chain-integrity-audit.md` and `data-model.md`'s per-stage table.

## Relationship to Spec 077

Spec 077 (Review Decision Human Promotion Gate) is the direct parent this spec is branched from at its own HEAD (not yet independently Approved at branch time — see Assumptions in spec.md). Spec 077's own `plan.md` ("Relationship to Specs 075 and 076," and the "Chain Revalidation" section's closing sentence) states that this feature's revalidation depth "is not required to exceed what those siblings already validate." Spec 077's own nine-round review history is the direct evidence that ceiling was insufficient on its own terms: five of those nine rounds (1, 3-4, 5, 6) each found one more field `validateChain` should have checked but did not, and this spec's own audit found four further gaps of the identical id/rulesVersion shape that no round's single-field patch had reached. Spec 078 does not rewrite that historical record — each of those nine rounds' findings were genuine, and each was fixed as reported — but supersedes the "match the sibling, no further" ceiling itself, replacing it with one audited, complete-per-stage validator. Spec 077's `spec.md`/`plan.md`/`review.md`/`tasks.md`/`contracts/` are left as accurate historical snapshots of Spec 077's implementation and review as it stood; see `review.md`'s "Relationship to Spec 077's documentation" section for the one narrow correction this spec's existence justifies.

## Human Approval Boundary

Everything in this spec — the extraction, the nine gap closures, and their tests — is local implementation and local state only. Per `docs/agent-workflow/token-efficient-review-policy.md` and `AGENTS.md`, push, PR creation, marking a PR ready, merge, and any other remote GitHub mutation remain strictly human-gated and are not part of this spec's task list.

## Complexity Tracking

No constitution violations. No new external dependency. No new persisted collection. Net structural change is an extraction (one function moved to its own module) plus nine additive checks inside existing per-stage branches — no new reason code, no new chain stage, no new record type.
