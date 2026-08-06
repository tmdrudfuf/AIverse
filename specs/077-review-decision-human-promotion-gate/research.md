# Research: Review Decision Human Promotion Gate

## Existing conventions reused

- **Deterministic id pattern**: every prior pipeline record uses `<projectId>:<stage>:<upstreamId>:<rulesVersion>`. `ReviewPromotion.reviewPromotionId` follows the identical shape, keyed off `reviewerRuntimeId` (see `ReviewerRuntime.reviewerRuntimeId`, `specs/076-codex-reviewer-runtime-foundation/data-model.md`).
- **Literal-`false` safety flags**: `validationStarted`/`repositoryMutationStarted`/`githubMutationStarted` are unconditionally `false` on `ReviewerRuntime`/`ReviewerRuntimeResult` (Spec 076) and `ImplementerRuntime`/`ImplementerRuntimeResult` (Spec 075, for the flags applicable at that stage). `ReviewPromotion`/`ReviewPromotionResult` carry the same three flags, same literal-`false` typing.
- **Shared invalidation helper**: `OfficeProjectPortalController.clearRuntimePreflightForProject` already deletes every downstream collection (`runtimePreflightCollections` through `reviewerRuntimeResultCollections`) when an upstream stage invalidates. This feature extends that same function rather than introducing a second invalidation path.
- **Reason-code prefix convention**: `REVIEWER_RUNTIME_*` (076), `IMPLEMENTER_RUNTIME_*` (075). This feature uses `REVIEW_PROMOTION_*`.
- **Explicit human-action key precedent**: `START_IMPLEMENTER_KEY_CODE = "KeyI"`, `START_REVIEWER_KEY_CODE = "KeyR"` (`OfficeActionInputController.ts`), each with a code comment stating why it must never share a keypress with any other action. `PROMOTE_REVIEW_KEY_CODE = "KeyP"` follows the same shape; confirmed unused by grepping the file for every existing `Key[A-Z]` binding before selecting it.
- **`ForPromotion`-suffixed controller methods**: the existing candidate-task pipeline cascade (`startImplementerRuntimeForPromotion`, `startReviewerRuntimeForPromotion`, `startRuntimeForPromotion`, etc.) already uses "promotion" to mean "advance this candidate task's cascade one stage further." This feature's "Human Promotion Gate" is a natural continuation of that same vocabulary, not a new or conflicting use of the word — see plan.md's "Relationship to Specs 075 and 076."

## Why no new stored classification collection (Architecture Decision 1)

Considered storing `ReviewDecisionState` as its own persisted collection (mirroring every other stage). Rejected: this value has no information content beyond what `ReviewerRuntime`/`ReviewerRuntimeResult` plus a chain-revalidation check already provide. Persisting it would create a second place that could disagree with the Reviewer Runtime record it describes — a correctness risk with no corresponding benefit, and an unrequested abstraction under `docs/agent-workflow/token-efficient-review-policy.md`.

## Why no new environment-variable gate (Architecture Decision 3)

Specs 075/076 each gate a real subprocess spawn behind `typeof window !== "undefined"` plus an explicit `AIVERSE_ALLOW_*_SPAWN` variable. This feature spawns nothing, so there is nothing to gate. Confirmed by grepping this feature's planned module list against `node:child_process`/`spawnSync` usage in `implementer-runtime/` and `reviewer-runtime/` — no such import is needed here.

## Precedent-scope boundary (repository-wide generalization risk)

Spec 076's own review history (`specs/076-codex-reviewer-runtime-foundation/review.md`) documents two rejected findings (round 5 P2-001, round 7 P1-001) requesting deeper result-to-record ID linkage and full-chain mutation-flag revalidation than `ImplementerRuntimeService.validateContext` itself performs. This feature's chain revalidation intentionally matches its closest sibling's (`ReviewerRuntimeService.validateContext`) depth and does not attempt to close that already-documented, already-accepted repository-wide gap — per `docs/agent-workflow/token-efficient-review-policy.md`'s "AIverse-Specific Guidance."
