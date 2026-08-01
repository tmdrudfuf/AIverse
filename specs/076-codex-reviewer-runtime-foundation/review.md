# Review: 076-codex-reviewer-runtime-foundation

**Reviewed commit (final round, round 7)**: `bd787ce4204f1012344ce79f3044386efdf85d7b`
**Decision**: Changes Requested

Seven independent Codex CLI review rounds were run against this feature (Implementer = Claude CLI, Reviewer = Codex CLI, per `AGENTS.md`/`CLAUDE.md` role assignment). Rounds 1-6's findings were each investigated against the actual code and either fixed (with regression tests) or rejected with documented rationale; round 6's fixes were committed and re-reviewed as round 7. Round 7 requests a further generalization of a pattern already rejected in round 5 (see below) and, per the stopping criterion agreed for this loop, iteration ends here rather than continuing indefinitely against a reviewer that keeps finding increasingly repo-wide (not feature-local) concerns.

## Round-by-round history

| Round | Reviewed commit | Outcome | Notes |
|---|---|---|---|
| 1 | `aef498a` (initial) | Timed Out | Structured review JSON malformed (2 blocks found); not a code finding. |
| 2 | `aef498a` | Changes Requested | See findings below, fixed in `c90e0a7`. |
| 3 | `c90e0a7` | Changes Requested | See findings below, fixed in `dcdd4ba`. |
| 4 | `dcdd4ba` | Changes Requested | See findings below, fixed in `46c309a`. |
| 5 | `46c309a` | Changes Requested | P1-001 fixed in `96c87f4`; P2-001 rejected (documented below). |
| 6 | `96c87f4` | Changes Requested | Fixed in `bd787ce`. |
| 7 | `bd787ce` | Changes Requested | Rejected (documented below); iteration stops here. |

## Blocking Findings

### Round 2 (commit `aef498a`) — fixed in `c90e0a7`
- **P1-001** — `CodexReviewerRuntimeProvider.ts:115-154`: the provider truncated stdout to the 2000-character evidence summary before handing it to `parseReviewOutput`, so a blocking `Finding` line past the truncation boundary could be silently dropped while an earlier `Decision: Approved` marker was still trusted. **Fixed**: parse the untruncated stdout for decision/finding extraction; only the persisted evidence record itself stays truncated.

### Round 3 (commit `c90e0a7`) — fixed in `dcdd4ba`
- **P1-001** — `ReviewerPrompt.ts`: mandatory prohibition/decision-format clauses could be truncated off the end of the bound prompt because they were assembled after unbounded variable-length context fields. **Fixed**: reordered so mandatory clauses are assembled first, ahead of all variable-length fields; `prompt-contract.md` updated to describe the guarantee accurately; added `ReviewerPrompt.test.ts` proving every mandatory clause survives even with maximally long variable fields.
- **P1-002** — `ReviewDecisionParser.ts`: standalone (non-`Decision:`-prefixed) heading markers matched at any heading depth, diverging from `agentWorkflow.js#detectDecision`'s established precedent, which excludes h2+ headings from standalone matching. **Fixed**: split into `normalizeDecisionHeading`/`normalizeStandaloneDecision` mirroring the precedent exactly (narrower fix than Codex's literal recommendation, which would have removed intentional/tested standalone-marker support entirely — see plan.md/research.md Finding 4 for why standalone support exists).
- **P2-001** — `CodexReviewerRuntimeProvider.ts`: `isSafeReviewerCommand` did not check `workingDirectory` for path-traversal segments, unlike the equivalent Implementer-runtime check. **Fixed**: exported and reused `hasPathTraversal` from `ClaudeImplementerRuntimeProvider.ts`.
- **NB-001** (non-blocking) — missing dedicated test coverage for `ReviewerPrompt.ts` and `ReviewerRuntimeTypes.ts`. **Fixed**: added both test files.

### Round 4 (commit `dcdd4ba`) — fixed in `46c309a`
- **P1-001** — `OfficeProjectPortalController.ts`/`ReviewerRuntimeService.ts`: the Implementer Runtime Result lookup matched only by `executionPlanId`/status, not by `implementerRuntimeId`, so a stale Completed result from an earlier superseded attempt could be accepted. **Fixed**: added exact `implementerRuntimeId` linkage checks in both the controller lookup and `ReviewerRuntimeService.validateContext`; fixed a test-fixture drift (`createImplementerOutcomeForPlan` stub was missing `implementerRuntimeId`, unlike the real `ImplementerRuntimeService.createResult`).

### Round 5 (commit `46c309a`)
- **P1-001** (blocking) — `OfficeProjectPortalController.ts:2051-2056`: the Reviewer-start precondition gate (`hadCompletedImplementerRuntime`) checked only the Implementer Runtime *result* collection, not the backing *runtime record* the deterministic `implementerRuntimeId` lookup inside `ImplementerRuntimeService.startImplementer` relies on to short-circuit an already-Completed run without re-invoking the Claude provider. A drifted state (Completed result, missing/mismatched runtime record) could reach the Claude provider path from a Reviewer-only (`KeyR`) action. **Fixed in `96c87f4`**: gate now requires a matching Completed `ImplementerRuntime` *record* before calling the revalidation cascade, and re-asserts the record's `implementerRuntimeId` is unchanged afterward; added a regression test simulating exactly this drifted state (Completed result, no matching record) proving neither `startImplementer` nor `startReviewer` is called.
- **P2-001** (blocking, **rejected**) — `ReviewerRuntimeService.ts:269-311`: requested exact `readinessId`/`preflightId`/`runtimeStartId` result-to-record linkage checks. **Rejected**: verified against `ImplementerRuntimeService.validateContext` (`ImplementerRuntimeService.ts:240-291`, merged and reviewed as part of Spec 075) — that service validates the identical chain via deterministic ID recomputation against the plan (`preflight.preflightId !== createRuntimePreflightId(...)`, etc.) and status/project/plan-ID equality, and at no point checks `resultObject.recordId === record.recordId` linkage for readiness, preflight, or runtime-start records. `ReviewerRuntimeService.validateContext` mirrors this exact pattern. Adding the requested linkage checks only to Spec 076's service would make it inconsistent with its own sibling rather than fixing a Spec 076-specific defect; closing this would be a repo-wide refactor spanning every pipeline-stage service, out of scope for this feature.

### Round 6 (commit `96c87f4`) — fixed in `bd787ce`
- **P1-001** — `ReviewerRuntimeService.ts:295-311,392-408`: unlike round 5's P2-001, this finding identified a genuine, non-precedent-matching gap: `ReviewerRuntimeService.validateContext` omitted the *entire* Runtime Start linkage block that `ImplementerRuntimeService.validateContext` does check (`executionPlanId`, `humanExecutionApprovalId`, `runtimePreflightId`, `taskId`, `confirmedAssignmentId`, `preparedSessionId`, `activeSessionId`, `employeeId`, `repositoryId` — `ImplementerRuntimeService.ts:305-317`), and neither the Implementer Runtime nor Review Target checks verified `repositoryId` against the Execution Plan anywhere. **Fixed**: added the matching linkage block (mirroring the sibling exactly) plus explicit `repositoryId` checks on `implementerRuntime` and `reviewTarget`; added three regression tests (`ReviewerRuntimeService.test.ts`) covering each of the three new checks.

### Round 7 (commit `bd787ce`, final round reviewed — **rejected**)
- **P1-001** — `ReviewerRuntimeService.ts:269-324`: requests revalidating "readiness/result IDs and counts, approval context fields, preflight/result IDs and context fields, Runtime Start result ID linkage, and all upstream started/mutation flags" before provider invocation. **Rejected, same grounds as round 5's P2-001**: re-verified against `ImplementerRuntimeService.validateContext` — it does not check `readinessResult.passedCheckCount/blockedCheckCount/failedCheckCount`, does not check `readinessResult.readinessId === readiness.readinessId` / `preflightResult.preflightId === preflight.preflightId` / `runtimeStartResult.runtimeStartId === runtimeStart.runtimeStartId` linkage, and only checks the *immediately preceding* stage's mutation flags (`runtimeStart.repositoryMutationStarted`/`githubMutationStarted`), exactly mirroring what `ReviewerRuntimeService` already does for its immediately preceding stage (`implementerRuntime.reviewerStarted`/`validationStarted`/`githubMutationStarted`). This is the same repo-wide convention as round 5's P2-001, restated more broadly. Closing it is a cross-cutting refactor spanning every pipeline-stage service (Specs 070-075 and this one), not a Spec 076-specific defect.

## Suggestions

- None outstanding beyond the rejected findings above.

## Residual Risks

- **Result-to-record ID linkage** (readiness/preflight/runtime-start `resultId === recordId`) is validated only indirectly, via deterministic ID recomputation against the plan chain and status/project/plan-ID equality — not via a direct `result.recordId === record.recordId` field check. This is a repository-wide pattern shared by every pipeline-stage service since at least Spec 070, not something introduced by this feature. Closing it fully would require a repo-wide refactor across all prior specs' services, out of scope here.
- **Upstream check counts and cross-stage mutation-flag revalidation** (round 7): the Reviewer service, like its Implementer sibling, only revalidates the immediately preceding stage's started/mutation flags, not every stage transitively. Same repo-wide scope note applies.
- Codex's review process (`--sandbox danger-full-access`, exhaustive per-file inspection) continues to surface findings across rounds; rounds 6 and 7 in particular show the trend shifting from feature-local defects (rounds 2-6's P1s) toward repo-wide convention requests (round 5's P2-001, round 7's P1-001). Future specs touching these shared `validateContext` patterns should consider whether a dedicated repo-wide linkage-hardening spec is warranted, rather than re-litigating it per-feature.
