# Review: 078-review-runtime-chain-integrity-consolidation

## Review Process (this spec, by design, differs from Spec 077's)

Spec 077 ran nine iterative review rounds, fixing each round's finding and re-reviewing the resulting commit. Spec 078 is explicitly scoped to run **exactly one** independent review round against the final commit HEAD (Implementer = Claude CLI, Reviewer = Codex CLI), per the standing instruction governing this spec: if that one round returns a new blocking finding, work stops and the finding is reported to the human rather than being auto-fixed and re-reviewed in a loop.

Because of that one-round scope, this file intentionally does not carry a per-round outcome table the way Spec 077's `review.md` does — doing so would require a second commit after the review to record the result, which would change the reviewed HEAD and break the exact-HEAD gate this spec's own final report must satisfy (Approved-review SHA = Validated SHA = current HEAD SHA). The actual review decision, structured-output artifact, and any findings are recorded in the final report delivered to the human, not in a follow-up commit to this file.

## Review Criteria

The single review round checks this spec's actual scope (per spec.md/plan.md):

1. `validateReviewRuntimeChainIntegrity` closes every gap recorded in `.agent-workflow/spec-078-chain-integrity-audit.md`: the own-identity/rulesVersion checks for `ExecutionReadinessResult`, `RuntimePreflightResult`, and `RuntimeStartResult` (each recomputing the record's id via that record's own canonical `create*Id` helper and checking `rulesVersion` against that record's own canonical constant), plus the field-by-field upstream-context comparisons across Execution Readiness, Human Execution Approval, Runtime Preflight, Runtime Start, and Implementer Runtime — including the previously entirely-unchecked `runtimeStart.executionReadinessResultId` cross-link. Every field checked was read directly from that record's own creation service's `validateContext`, not invented from a type signature.
2. `ReviewDecisionService.ts` consumes the shared validator as a single call, with no second, independently-maintained mirror of chain-record checks remaining inline.
3. `ReviewDecisionService`'s own responsibilities (classification, actor validation, promotion eligibility, idempotency, immutable promotion creation) are unchanged and did not migrate into the shared validator.
4. Every one of Spec 077's previously-verified behaviors (spec.md FR-008) still holds, evidenced by the pre-existing `ReviewDecisionService.test.ts`/`OfficeProjectPortalController.review-decision.test.ts` suites passing unchanged.
5. The new `ReviewRuntimeChainIntegrityService.test.ts` table-driven suite genuinely exercises each stage's new checks (not short-circuited by an earlier, unrelated branch) — verified during implementation by tracing each mutated field against the validator's actual branch order (tasks.md T007).
6. Full validation gate is clean: `npm test`/`npx vitest run`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, `git diff --cached --check`.

## Relationship to Spec 077's Documentation

Spec 077's own documentation (`spec.md`, `plan.md`, `review.md`, `tasks.md`, `contracts/review-decision-contract.md`) was assessed for whether any claim is now *inaccurate* rather than merely *superseded*. Conclusion: every `validateChain` reference in Spec 077's docs is an accurate historical snapshot of what was actually implemented and independently reviewed at the time — Spec 078 later extracting and extending that function is expected evolution, not evidence the original text was wrong when written. **No correction was made to Spec 077's documentation**, and Spec 077's nine-round review history is left exactly as recorded, per the standing instruction never to rewrite a prior spec's review history.

One narrower observation, recorded here rather than as an edit to Spec 077's files: `plan.md`'s "Chain Revalidation" section closes with "this feature's revalidation is not required to exceed what those siblings already validate" (citing `docs/agent-workflow/token-efficient-review-policy.md`). Spec 078's own nine-gap audit is direct evidence that sibling-parity ceiling was insufficient on its own terms — five of Spec 077's nine rounds each found one more field that ceiling had let through, and this spec's audit found four more of the identical shape no round had reached. This is not a factual error in Spec 077's `plan.md` (the sentence accurately described the policy being applied at the time), so it is noted here as context for Spec 078's own motivation rather than edited into Spec 077's history.
