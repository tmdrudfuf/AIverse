# Data Model: Review Runtime Chain Integrity Consolidation

No new entities, no new persisted fields, no new reason codes. This spec adds one new pure function operating over the exact `ReviewDecisionInput` shape Spec 077 already defined. This document exists to carry the one artifact a reviewer needs that spec.md/plan.md don't already state as prose: the per-stage id-helper / rulesVersion table every check in `ReviewRuntimeChainIntegrityService.ts` is built from.

## `validateReviewRuntimeChainIntegrity`

```ts
function validateReviewRuntimeChainIntegrity(
  input: ReviewDecisionInput,
): ReviewPromotionReasonCode | undefined
```

Pure function. Returns `undefined` when the entire chain is valid; otherwise the first-failing stage's existing `REVIEW_PROMOTION_*` reason code, stages checked in chain order (Execution Plan → Reviewer Runtime Result).

## Per-stage id / rulesVersion / reason-code table

| Stage | Deterministic id helper | Rules version constant | Reason code (shared across all checks in this stage) | Gap closed by this spec |
|---|---|---|---|---|
| 1. Execution Plan | `createExecutionPlanId(projectId, activeSessionId)` | `EXECUTION_PLAN_RULES_VERSION` | `REVIEW_PROMOTION_PLAN_INVALID` | none — already checked pre-078 |
| 2. Execution Readiness / Result | `createExecutionReadinessId`/`createExecutionReadinessResultId(projectId, executionPlanId)` | `EXECUTION_READINESS_RULES_VERSION` | `REVIEW_PROMOTION_READINESS_NOT_READY` | readiness id/rulesVersion already pre-078; **this spec adds** `readinessResult.id`/`rulesVersion` own-identity recompute, plus `activeSessionId`/`projectTaskId`/`confirmedAssignmentId`/`preparedSessionId`/`employeeId`/`repositoryId` field comparison against the plan |
| 3. Human Execution Approval | `createHumanExecutionApprovalId(projectId, executionPlanId)` | `HUMAN_EXECUTION_APPROVAL_RULES_VERSION` | `REVIEW_PROMOTION_APPROVAL_STALE` | id/rulesVersion/`readinessId` linkage already pre-078; **this spec adds** the same six context fields as row 2 plus `validationCommands`/`allowedMutationScope` array equality against the plan |
| 4. Runtime Preflight / Result | `createRuntimePreflightId`/`createRuntimePreflightResultId(projectId, executionPlanId)` | `RUNTIME_PREFLIGHT_RULES_VERSION` | `REVIEW_PROMOTION_PREFLIGHT_NOT_READY` | preflight id/rulesVersion/`approvalId`/`preflightResult.preflightId` linkage already pre-078; **this spec adds** `preflightResult.id`/`rulesVersion` own-identity recompute, `executionPlanId` linkage on both records, `preflight.readinessId` linkage, `preflightResult.readinessId`/`approvalId` linkage, and the same six context fields as row 2 |
| 5. Runtime Start / Result | `createRuntimeStartId`/`createRuntimeStartResultId(projectId, executionPlanId)` | `RUNTIME_START_RULES_VERSION` | `REVIEW_PROMOTION_START_STALE` | `runtimeStart` id/rulesVersion already pre-078; **this spec adds** `runtimeStartResult.id`/`rulesVersion` own-identity recompute, `runtimeStartResult.executionPlanId`/`runtimePreflightId`/`approvalId` linkage, `runtimeStart.executionReadinessResultId` linkage (previously unchecked entirely — the largest single gap this spec closes), and `taskId`/`confirmedAssignmentId`/`preparedSessionId`/`activeSessionId`/`employeeId` field comparison against the plan |
| 6. Implementer Runtime | `createImplementerRuntimeId(projectId, runtimeStartId)` | `IMPLEMENTER_RUNTIME_RULES_VERSION` | `REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED` (existence: `REVIEW_PROMOTION_IMPLEMENTER_MISSING`) | id/rulesVersion already pre-078; **this spec adds** `executionPlanId`/`humanExecutionApprovalId`/`runtimePreflightId` linkage against runtimeStart and `taskId`/`confirmedAssignmentId`/`preparedSessionId`/`activeSessionId`/`employeeId` field comparison against the plan. See also row "Role binding" below — **combined branch round 3 P1-002** adds `evidence.providerId`/`agentId`/`role`/`workingDirectory` parity. |
| 7. Implementer Runtime Result | `createImplementerRuntimeResultId(projectId, runtimeStartId)` | `IMPLEMENTER_RUNTIME_RULES_VERSION` | `REVIEW_PROMOTION_IMPLEMENTER_NOT_COMPLETED` | id/rulesVersion already checked pre-078 |
| 8. Review Target | `createReviewTargetId(projectId, runtimeStartId, reviewTargetSha)` | `REVIEW_TARGET_RULES_VERSION` | `REVIEW_PROMOTION_TARGET_MISMATCH` | id recompute (transitively re-verifies `reviewTargetSha`), rulesVersion, and — **superseded by the combined branch's round 2 P1-001 fix** — `baseBranch`/`baseSha`/`mergeBaseSha`/`reviewTargetSha` each recomputed against the authoritative `ReviewTarget.ts` exports (`REVIEW_TARGET_BASE_BRANCH`, `computeReviewTargetBaseSha`, `computeReviewTargetSha`) from the current plan/implementerRuntime context, not merely checked for `mergeBaseSha === baseSha` self-consistency |
| 9. Reviewer Runtime | `createReviewerRuntimeId(projectId, reviewTargetId)` | `REVIEWER_RUNTIME_RULES_VERSION` | `REVIEW_PROMOTION_REVIEWER_STALE` (existence: `REVIEW_PROMOTION_REVIEWER_MISSING`) | id recompute, rulesVersion — **the reported Round-10 P1-001 gap**. See also row "Role binding" below — **combined branch round 3 P1-002** adds `evidence.providerId`/`agentId`/`role`/`workingDirectory`/`reviewTargetSha` parity, the latter directly binding the reviewed evidence to the exact `ReviewTarget.reviewTargetSha`. |
| 10. Reviewer Runtime Result | `createReviewerRuntimeResultId(projectId, reviewTargetId)` | `REVIEWER_RUNTIME_RULES_VERSION` | `REVIEW_PROMOTION_REVIEWER_NOT_COMPLETED` | id recompute, rulesVersion — **the reported Round-10 P1-001 gap** |
| — Role binding (Implementer/Reviewer agent + `approvedImplementerAgent`/`approvedReviewerAgent`) | n/a (constant comparison, not an id) | n/a | `REVIEW_PROMOTION_ROLE_MISMATCH` | pre-078 checks unchanged; **superseded by the combined branch's round 3 P1-002 fix** — each runtime's own `evidence` sub-object (the record a provider actually produced) is now also compared against the same approved chain context, closing the gap where an internally self-consistent but foreign/stale Implementer or Reviewer Runtime evidence record could still authorize promotion. See `specs/077-078-combined-review-note.md` for the finding and fix. |
| — Review Decision (derived) | n/a — no id, no rulesVersion | n/a | n/a | intentionally non-applicable (see spec.md Assumptions) |
| — Review Promotion / Result | `createReviewPromotionId`/`createReviewPromotionResultId` | `REVIEW_PROMOTION_RULES_VERSION` | n/a (output, not a validated input) | intentionally out of scope — see plan.md Decision 5 |

Full per-stage before/after narrative, including which checks already existed before this spec and the exact grep evidence each creation-site helper usage was confirmed against, is in `.agent-workflow/spec-078-chain-integrity-audit.md`.

## Validation Rules (unchanged from Spec 077, restated for completeness)

- Every stage's existing linkage checks (project match, upstream-id match, status/flag checks) are preserved verbatim — this spec adds id/rulesVersion checks alongside them, it does not remove or loosen any pre-existing check.
- A record's id is always recomputed using the exact same canonical helper call shape its own creation service uses (same argument order, same default `rulesVersion` parameter) — never a duplicated inline template string.
- A missing, unsupported, or mismatched `rulesVersion` blocks with the same reason code an id mismatch at that stage would produce — there is no separate "unsupported version" reason code family, since every existing `REVIEW_PROMOTION_*` code already means "this stage is not trustworthy," which a bad rules version equally is.
