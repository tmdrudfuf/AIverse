# Review Runtime Chain Integrity Contract

## Purpose

Defines the one shared function `ReviewDecisionService.classify`/`promote` both call to revalidate the Review Runtime Chain, so that chain-record integrity is checked in exactly one place rather than duplicated or drifting between the two call sites.

## Input Boundary

`validateReviewRuntimeChainIntegrity(input: ReviewDecisionInput)` reads only the exact `ReviewDecisionInput` `ReviewDecisionService` already assembles via `resolveReviewDecisionInput` (unchanged by this spec) — the current project's Execution Plan, Execution Readiness/Result, Human Execution Approval, Runtime Preflight/Result, Runtime Start/Result, Implementer Runtime/Result, Review Target, and Reviewer Runtime/Result. It never reads raw process output, never re-parses a provider's stdout, and never accepts a caller-supplied override for any check.

## Output Boundary

Returns exactly one value: `undefined` (the entire chain is valid) or the first-failing stage's existing `ReviewPromotionReasonCode` (see data-model.md's per-stage table). It never returns a partial list of every failing check — the first stage-order failure is authoritative, matching Spec 077's pre-existing `??`-chained short-circuit behavior exactly.

## Per-Stage Checks

For every stage from Execution Plan through Reviewer Runtime Result, this function checks, in this order:

1. **Existence** — the record (and its paired Result record, where one exists) is present.
2. **Project scope** — the record's `projectId` matches the current chain's `projectId`.
3. **Upstream linkage** — every field on the record that names an upstream record's id, or that duplicates a value the upstream record also carries (`worktreePath`, `branch`, `specificationPath`, `repositoryId`, etc.), matches that upstream record's current value exactly.
4. **Own deterministic identity** — the record's own id, recomputed via the exact canonical `create*Id` helper its creation service uses, matches the record's stored id.
5. **Own rules version** — the record's `rulesVersion` field (where the type defines one) matches the canonical `*_RULES_VERSION` constant its creation service writes.
6. **Lifecycle / mutation-safety coherence** — every canonical `false`-until-started field (`executionStarted`, `agentStarted`, `implementerStarted`, `reviewerStarted`, `validationStarted`, `repositoryMutationStarted`, `githubMutationStarted`), `true`-once-approved field (`executionApproved`, `runtimePreflightPassed`), and, on Implementer/Reviewer Runtime, the provider `evidence` sub-object's own `started`/`completed`/`timedOut`/`cancelled` fields match the exact value that record's own creation service produces for its own claimed `status` — not merely a fixed literal, and not a value this function invents (see `data-model.md`'s "Lifecycle / mutation-safety matrix" and `.agent-workflow/spec-077-078-lifecycle-safety-audit.md`, gitignored, for the field-by-field derivation). This is internal coherence only; it never re-derives the Approved/ChangesRequested/Blocked/TimedOut/Failed distinction, which stays entirely inside `ReviewDecisionService.classify()` (see "What Stays in `ReviewDecisionService`" below).

Checks 4 and 5 are independently applied — a malformed id with a valid `rulesVersion`, and a valid id with an unsupported `rulesVersion`, are each caught on their own; neither can compensate for the other passing. Check 6 runs alongside checks 3-5 at each stage, reusing that stage's existing reason code — no new reason code was introduced to carry it.

## Non-Actions

`validateReviewRuntimeChainIntegrity` is read-only and synchronous. It never creates, mutates, or deletes any record; it never invokes Claude or Codex; it never marks anything "started"; it never computes a `ReviewPromotion`/`ReviewPromotionResult` id (those remain `ReviewDecisionService.promote`'s own responsibility, computed only for a chain this function has already validated).

## What Stays in `ReviewDecisionService`

Explicitly not part of this contract, and not moved into the shared validator:

- Deriving a `ReviewDecisionState` from a validated (or invalid) chain, including result-only Blocked/Failed/TimedOut/ChangesRequested/Approved-coerced-to-ChangesRequested classification.
- `getActorBlockReason` — exported alongside the validator (same module) but conceptually a live-request check, not a chain-record check; see plan.md Decision 3.
- Promotion eligibility ordering (actor validation before idempotency), idempotent-repeat detection, and immutable `ReviewPromotion`/`ReviewPromotionResult` creation.
