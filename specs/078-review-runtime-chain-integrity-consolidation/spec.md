# Feature Specification: Review Runtime Chain Integrity Consolidation

**Feature Branch**: `codex/078-review-runtime-chain-integrity-consolidation`

**Created**: 2026-08-02

**Status**: Draft

**Input**: User description: "Spec 078 replaces `ReviewDecisionService`'s single monolithic `validateChain` with one coherent, shared Review Runtime Chain integrity validator that checks, for every record from Execution Plan through Reviewer Runtime Result: (1) linkage to the exact current upstream context, and (2) internal validity of that record's own deterministic identity (its `create*Id` output) and rules version, using only fields and helpers that already exist. It must close the identity/rules-version gaps a prior review round found in the Reviewer Runtime stage, and the same class of gap this spec's own audit found in five earlier stages, without changing any of Spec 077's observable behavior."

This is a **stabilization/consolidation spec, not a new user-facing feature**. Spec 077's dashboard, Promote action, classification states, and blocking reason codes are all preserved verbatim (see Assumptions). The only thing this spec changes is *where* chain-integrity checks live (one shared validator instead of one growing per-field list inside `ReviewDecisionService`) and *how completely* they check identity — closing nine gaps where a record's own `create*Id` output or `rulesVersion` field was never recomputed/verified, even though the canonical helper and constant it should be checked against already existed.

## User Scenarios & Testing

### User Story 1 - A Tampered or Malformed Chain Record Still Blocks Promotion (Priority: P1)

A human operator relies on Spec 077's Promote gate to mean what it says: an `Approved` classification and a successful Promote both require every record in the chain, including its own id and rules version, to be exactly what its creation service would have produced. Before this spec, nine of the chain's records (Execution Readiness, Human Execution Approval, Implementer Runtime, Implementer Runtime Result, Review Target, Reviewer Runtime, and Reviewer Runtime Result) had at least one linkage or identity/rules-version field a hand-crafted or corrupted record could diverge on without being caught.

**Why this priority**: This is the exact class of gap a prior independent review round reported for the Reviewer Runtime stage (a malformed `reviewerRuntimeId` or unsupported `rulesVersion` would not have blocked promotion). Closing it only for the one reported stage, while leaving the same class of gap open in five siblings, would leave the promotion gate's core guarantee — "every record is exactly what its own creation service produced" — true for some stages and false for others.

**Independent Test**: For each of the twelve chain stages, construct an otherwise-valid chain, mutate exactly one record's deterministic id to a non-canonical string (or its `rulesVersion` to an unsupported value), and verify the shared validator returns the stage's existing reason code and blocks promotion — never silently accepting the tampered/malformed record.

**Acceptance Scenarios**:

1. **Given** an otherwise-valid chain, **When** any one record's own id no longer equals what its creation service's canonical `create*Id` helper would produce from that record's own fields, **Then** the shared validator blocks with that stage's existing reason code.
2. **Given** an otherwise-valid chain, **When** any one record's `rulesVersion` field no longer equals the canonical constant its creation service writes, **Then** the shared validator blocks with that stage's existing reason code.
3. **Given** a fully valid, exact-context chain with every id and rules version canonical, **When** classification or Promote runs, **Then** it behaves exactly as it did before this spec (an `Approved` classification still classifies `Approved`; Promote still succeeds).

---

### User Story 2 - One Shared Validator Instead of a Growing Per-Field List (Priority: P2)

A future spec author extending this chain (a new stage, a new field) has one place to add or extend a check — a shared, chain-wide integrity validator — rather than needing to know that `ReviewDecisionService.validateChain` is a second, independently-maintained mirror of checks that could silently drift from the actual chain shape.

**Why this priority**: Spec 077's own review history (rounds 1, 3-4, 5, 6) found the same shape of gap five separate times, each time in a single field a one-off patch had missed. A single shared validator, backed by one audit of every stage rather than five sequential single-field patches, is the structural fix for that recurring pattern — but it is lower priority than User Story 1, since it is a maintainability property, not a new safety guarantee by itself.

**Independent Test**: Confirm `ReviewDecisionService`'s promotion path and classification path both call the one new `validateReviewRuntimeChainIntegrity` function, and that no second, independently-maintained copy of chain-record integrity checks remains in `ReviewDecisionService.ts`.

**Acceptance Scenarios**:

1. **Given** the implementation, **When** `ReviewDecisionService.classify`/`promote` need to revalidate the chain, **Then** both call the same one shared validator function — there is no second inline copy of chain-record checks.
2. **Given** `ReviewDecisionService`'s own remaining responsibilities (classification derivation, human actor validation, promotion eligibility, idempotency, immutable promotion creation), **When** this spec's consolidation is complete, **Then** none of those responsibilities have moved into the shared validator — it checks chain-record integrity only.

### Edge Cases

- A record whose linkage fields are all correct but whose own id was computed with a different `rulesVersion` argument than its stored `rulesVersion` field (an internally inconsistent record) is still rejected, since both the recomputed id and the stored `rulesVersion` field are checked independently.
- A chain built entirely for a different `projectId` (every id internally self-consistent, just for the wrong project) is rejected at the Execution Plan stage, since every downstream stage's own checks are anchored to `plan.projectId`, which is itself checked against `input.projectId` first.
- All of Spec 077's previously-documented edge cases (dashboard/Promote share one classification path; result-only Blocked/Failed/TimedOut display truthfully; a result-only Approved outcome cannot promote; actor validation runs before idempotent success; a historical promotion remains immutable and readable after a later unrelated invalidation) are preserved unchanged — none of them depended on the internal structure being consolidated here.

## Requirements

### Functional Requirements

- **FR-001**: System MUST provide one shared function that validates the entire Review Runtime Chain (Execution Plan through Reviewer Runtime Result) for both linkage to the exact current upstream context and each record's own deterministic identity/rules-version validity, replacing `ReviewDecisionService`'s previous internally-duplicated `validateChain`.
- **FR-002**: System MUST recompute each record's expected id using the exact same canonical `create*Id` helper its own creation service already uses, and MUST block promotion when a record's stored id does not match.
- **FR-003**: System MUST check each applicable record's `rulesVersion` field against its own canonical `*_RULES_VERSION` constant, and MUST block promotion when it is missing, unsupported, or does not match.
- **FR-004**: System MUST close the identity/rules-version gap for Execution Readiness, Human Execution Approval, Implementer Runtime, Implementer Runtime Result, Review Target, Reviewer Runtime, and Reviewer Runtime Result — the seven stages this spec's audit found lacking at least one such check (Execution Plan and Runtime Preflight already had theirs).
- **FR-005**: System MUST NOT invent any field, id formula, or rules-version constant that does not already exist in the record's own type definition and creation service.
- **FR-006**: System MUST preserve every reason code Spec 077 already returns (`REVIEW_PROMOTION_*`), reusing the existing code for each stage rather than introducing a new one, since this spec closes gaps within existing stages rather than adding new stages or new failure categories.
- **FR-007**: System MUST leave `ReviewDecisionService`'s own responsibilities — classification derivation, human actor validation ordering, promotion eligibility, idempotent-repeat handling, and immutable `ReviewPromotion`/`ReviewPromotionResult` creation — entirely inside `ReviewDecisionService`; only chain-record integrity checking moves into the shared validator.
- **FR-008**: System MUST preserve all of Spec 077's previously-verified behaviors verbatim: the dashboard and Promote precondition share one classification path; a result-only Blocked/Failed/TimedOut Reviewer Runtime Result displays its truthful state; a result-only Approved outcome cannot promote; actor validation occurs before the idempotent-repeat short-circuit; status-specific blocking reason codes remain distinct; a historical Review Promotion remains immutable and is never masked by, nor masks, a newer current review; current-promotion matching is scoped to the exact current context; project isolation holds at every stage; and no automatic fix loop, dedicated Validation Runtime, or remote mutation is introduced.
- **FR-009**: System MUST NOT invoke Claude, MUST NOT invoke Codex, MUST NOT start or restart any runtime stage, and MUST NOT stage files, commit, push, create or update a PR, mark a PR ready, merge, or perform any other GitHub mutation, as part of this spec.

### Key Entities

No new entities. This spec introduces one new pure function (`validateReviewRuntimeChainIntegrity`) over the same `ReviewDecisionInput` shape Spec 077 already defined; every record type it reads (`ExecutionPlan`, `ExecutionReadiness`/`Result`, `HumanExecutionApproval`, `RuntimePreflight`/`Result`, `RuntimeStart`/`Result`, `ImplementerRuntime`/`Result`, `ReviewTarget`, `ReviewerRuntime`/`Result`) is unchanged from its Spec 075/076/077 definition.

## Success Criteria

### Measurable Outcomes

- **SC-001**: For each of the twelve chain stages, a table-driven test mutates that stage's own deterministic id to a non-canonical value and confirms the shared validator blocks with the stage's existing reason code.
- **SC-002**: For each stage with a `rulesVersion` field, a table-driven test mutates it to an unsupported value and confirms the shared validator blocks with the stage's existing reason code.
- **SC-003**: A fully valid, exact-context chain still classifies `Approved` and still promotes successfully, with no change to Spec 077's previously-passing test assertions' expected outcomes.
- **SC-004**: `ReviewDecisionService.ts` contains no second, independently-maintained list of chain-record integrity checks — every such check lives in the one shared validator.
- **SC-005**: A repeated valid human Promote request against an already-promoted `reviewerRuntimeId` remains idempotent (same record returned, no duplicate created).
- **SC-006**: A chain built for a different `projectId` is rejected, and current-vs-historical Review Promotion selection remains scoped to the exact current context, exactly as Spec 077 already verified.

## Assumptions

- Spec 077's `ReviewDecisionService.classify`/`promote` contracts, `ReviewDecisionState` values, and `ReviewPromotionReasonCode` union are the starting point and are not redesigned; this spec closes integrity gaps within that existing contract, it does not change what the contract promises.
- This spec is built directly on Spec 077's own (not-yet-independently-Approved) HEAD, in a separate worktree/branch, so that Spec 077's own open review cycle is not disturbed by unrelated consolidation work landing mid-cycle.
- No new deterministic id formula or `*_RULES_VERSION` constant is introduced anywhere in this spec — every check is expressible purely in terms of `create*Id` helpers and `*_RULES_VERSION` constants that already exist and are already used at each record's own creation site (confirmed in `.agent-workflow/spec-078-chain-integrity-audit.md`).
- `ReviewDecisionClassification` (Review Decision, stage 9 of the audit) and `ReviewPromotion`/`ReviewPromotionResult` (stage 10) are intentionally out of the shared validator's scope: the former is derived-only with no id/rulesVersion of its own to check, and the latter is the *output* of `promote()` — always freshly computed from the validated chain, never an untrusted input record to revalidate.
- This spec performs no subprocess invocation, no I/O, and no asynchronous operation, following the existing synchronous, in-memory pattern every prior stage in this chain uses.
