# Implementation Plan: Codex Reviewer Runtime Foundation

**Branch**: `codex/076-codex-reviewer-runtime-foundation` | **Date**: 2026-07-31 | **Spec**: [spec.md](./spec.md)

## Summary

Add a focused `reviewer-runtime` domain module that, after a full revalidation of Execution Plan through a Completed Implementer Runtime plus an explicit approved-role-binding check, resolves a deterministic Review Target, safety-validates and invokes the configured Codex CLI command through a provider-neutral boundary, and produces exactly one bounded, immutable terminal result carrying a status and a strictly separate decision. The action requires a distinct explicit human input, never the Implementer Runtime's mere completion.

## Technical Context

**Language/Version**: TypeScript in the existing Next.js/Phaser application.

**Primary Dependencies**: Existing office portal services, state, and Vitest test setup. `node:child_process` (`spawnSync`), imported only behind the same runtime guard Spec 075 established (see Architecture Decision 4).

**Storage**: In-memory per-project portal state and immutable local collections, matching every prior pipeline stage.

**Testing**: Vitest focused tests, full `npm test`, TypeScript, build, and diff checks.

**Target Platform**: Existing browser/game runtime for the controller/view/registry layer; Node (Vitest, or a documented manual smoke script) for the real Codex CLI subprocess invocation.

**Performance Goals**: The Reviewer Runtime attempt is a single bounded, timeout-capped blocking operation; no polling, no background retries.

**Constraints**: No Claude invocation, no dedicated Validation-stage execution, no repository/GitHub mutation, no commit/push/PR of any kind from product code.

**Scale/Scope**: One active Reviewer Runtime attempt per review target per project at a time.

## Constitution Check

- Spec First: Passed. `spec.md` defines user value, acceptance scenarios, boundaries, and measurable outcomes.
- Plan Before Code: Passed with a caveat — this plan was authored retrospectively, documenting the empirically-grounded architecture decisions against the already-implemented module, following the same Spec Kit sequencing precedent Spec 075 used.
- Tasks Gate Implementation: Passed with a caveat — `tasks.md` exists and every task is checked except T031 (commit and independent review), which is deliberately left unchecked until an independent Codex review actually reaches Approved on the exact committed HEAD.
- Preserve Application Stability: Passed by extending existing office portal modules only; Execution Plan/Readiness/Approval/Preflight/Runtime Start/Implementer Runtime services are reused unmodified.
- Validation Required: Passed by focused and full validation plan, including the empirical discoveries recorded below.

## Project Structure

### Documentation

```text
specs/076-codex-reviewer-runtime-foundation/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── provider-contract.md
│   ├── prompt-contract.md
│   └── output-decision-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
├── reviewer-runtime/
│   ├── ReviewerRuntimeTypes.ts
│   ├── ReviewerRuntimeProvider.ts
│   ├── CodexReviewerRuntimeProvider.ts
│   ├── ReviewerRuntimeService.ts
│   ├── ReviewerPrompt.ts
│   ├── ReviewDecisionParser.ts
│   ├── ReviewTarget.ts
│   ├── ReviewerRuntimeView.ts
│   └── *.test.ts
├── implementer-runtime/       (reused, unmodified)
├── runtime-start/             (reused, unmodified)
├── runtime-preflight/         (reused, unmodified — isSafeCommandLine imported from here)
├── OfficeProjectPortalController.ts
├── OfficeProjectPortalRegistry.ts
├── OfficeProjectPortalTypes.ts
└── OfficeProjectPortalView.ts
```

## Architecture Decisions

### Decision 1 — Deterministic, zero-I/O Review Target resolution, always `Uncommitted`

`ReviewTarget.ts`'s `resolveReviewTarget` follows the same "represented" pattern every pre-Spec-075 stage uses: no real git inspection, a deterministic synthetic SHA, and fields copied forward from the revalidated plan/Runtime Start/Implementer Runtime. This repository's simulated pipeline has no product-side "create a commit" stage, so a represented resolution cannot honestly claim a clean, committed tree — it always reports `workingTreeState: "Uncommitted"`, matching the spec's explicit fallback ("mark clearly Uncommitted, never satisfy the exact-HEAD gate") rather than fabricating a committed target the way earlier stages fabricate `workingTree.clean: true`.

**Consequence, stated plainly**: no controller-driven Start-Reviewer attempt can ever pass `ReviewerRuntimeService.validateReviewTarget`'s `workingTreeState !== "Clean"` check in this repository today. Every controller-level end-to-end test necessarily blocks at `REVIEWER_RUNTIME_TARGET_UNCOMMITTED`, strictly before the command-config check, the command-safety check, or `provider.invoke` are ever reached. The real Codex spawn path (Decision 4/5 below) is reachable only by constructing a `ReviewTarget` fixture directly with `workingTreeState: "Clean"` and calling `ReviewerRuntimeService.startReviewer` directly — the only honest way to exercise it until a real git-backed stage exists. Only that future stage (out of scope for this feature, mirroring how only the concrete Claude/Codex providers ever do real I/O) could honestly produce `"Clean"`.

### Decision 2 — The approved role binding is explicit request data, never derived from the existing `Implementer`/`Reviewer` labels

Following the same reasoning Spec 075 established for its own role binding (plan.md, Architecture Decision 3 in that spec): every existing Execution Plan/Approval/Preflight/Runtime Start/Implementer Runtime record sets `implementerAgent`/`reviewerAgent`/`implementer`/`reviewer` to the literal, invariant strings `"Implementer"`/`"Reviewer"`. `RuntimePreflightProvider.normalizeAgentCommand` is the only place those generic labels are ever resolved to a concrete agent name, and it hardcodes the repository's default mapping (`"implementer"` → `"codex"`, `"reviewer"` → `"claude"`) — exactly the mapping this feature must not rely on for its own Codex=Reviewer check.

`ReviewerRuntimeService.validateRoleBinding` therefore verifies the approved binding as explicit data carried on `ReviewerRuntimeCommand` (`approvedImplementerAgent`, `approvedReviewerAgent`, sourced from the controller constants `REVIEWER_RUNTIME_APPROVED_IMPLEMENTER_AGENT = "claude"` / `REVIEWER_RUNTIME_APPROVED_REVIEWER_AGENT = "codex"`), while separately re-checking that the generic labels remain internally consistent across every upstream record (plan/approval/Runtime Start/Implementer Runtime all agree). `normalizeAgentCommand` is not imported by this feature.

### Decision 3 — Truthful status kept strictly separate from a normalized decision

`ReviewerRuntimeStatus` (`"Completed" | "TimedOut" | "Blocked" | "Failed"`) describes only whether the bounded Codex invocation itself ran to completion — it deliberately excludes a fabricated `"Running"` member, for the same reason Spec 075's `ImplementerRuntimeStatus` does (the provider boundary is a single bounded invocation with no mechanism to truthfully report an in-progress remote process). `ReviewerRuntimeDecision` (`"Approved" | "ChangesRequested" | "Unknown"`) is a completely separate field describing what Codex's output actually said, parsed by `ReviewDecisionParser`.

Keeping these two fields independent means `status: "Completed"` and `decision: "ChangesRequested"` are both true at once whenever Codex ran to completion and asked for changes — collapsing them into one field would either hide a real completion behind a decision-shaped status, or imply a decision was reached when the process never finished. `ReviewerRuntimeService.statusReasonCode` maps the two together only for the result's `reasonCodes` array (for example `Completed` + `Unknown` decision → `REVIEWER_RUNTIME_DECISION_UNKNOWN`, distinct from a plain successful `REVIEWER_RUNTIME_STARTED`), never by merging the fields themselves.

### Decision 4 — A second, explicit env-var gate, deliberately distinct from Spec 075's own

`CodexReviewerRuntimeProvider` mirrors `ClaudeImplementerRuntimeProvider`'s double-gate boundary exactly: `typeof window !== "undefined"` first (the browser guard, unattempted spawn), then a second, independent, explicit opt-in — `AIVERSE_ALLOW_REVIEWER_RUNTIME_SPAWN` must be set to exactly `"1"` — before dynamically importing `node:child_process`.

This environment variable is deliberately **distinct** from Spec 075's `AIVERSE_ALLOW_IMPLEMENTER_RUNTIME_SPAWN`: the Implementer spawn gate alone must never enable a real Codex spawn, and vice versa. This is the direct fix for Spec 075's own documented **NB-001** non-blocking finding (the Implementer Provider Boundary docs did not explicitly restate the env-var gate alongside the browser guard) — the gate here is restated in three independent places: the provider contract (`contracts/provider-contract.md`), this plan, and the quickstart, not only in the code comment.

An explicitly-injected test `spawnSyncImpl` (constructor parameter) bypasses both checks entirely, since supplying a test double is itself already an explicit, controlled substitution with no real-process risk. Because Decision 1 means no controller-driven test can even reach this gate, the tests that legitimately exercise it construct a `Clean` `ReviewTarget` fixture and call `ReviewerRuntimeService.startReviewer` directly.

### Decision 5 — Exact approved command config, layered on the two existing reused safety checks

The configured Codex command must be *exactly* the approved command configuration (`DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG`: `command: "codex"`, `arguments: ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"]`, `inputMode: "stdin"`), verified by `isApprovedCommandConfig` in `ReviewerRuntimeService` — not merely "safe" by the shared regex checks below, mirroring `ImplementerRuntimeService`'s own `isApprovedCommandConfig` check.

`CodexReviewerRuntimeProvider.isSafeReviewerCommand` reuses the two existing, independently-maintained safety checks — `runtime-preflight`'s `isSafeCommandLine` and the Implementer Runtime's `isSafeImplementerCommandLine` — rather than a third, narrower copy, and layers one additional check (unsafe redirection, `<`/`>`) neither of them covers. `ReviewerRuntimeService.startReviewer` calls the identical `isSafeReviewerCommand` function immediately before `provider.invoke`, so a command the service considers safe is always identical to a command the provider itself would independently re-check — no gap exists where an unsafe or non-approved config could still reach a real spawn.

## Implementer Result Revalidation

Before role binding or review-target resolution, `ReviewerRuntimeService.validateContext` re-derives and revalidates the Implementer Runtime this review target would be built from: it must exist, match the project, and be exactly `Completed` (not `Blocked`/`Failed`/`TimedOut`, not merely present) — `IMPLEMENTER_RUNTIME_NOT_COMPLETED` blocks any non-Completed or missing Implementer Runtime under `REVIEWER_RUNTIME_IMPLEMENTER_MISSING`/`REVIEWER_RUNTIME_IMPLEMENTER_NOT_COMPLETED`. A Completed Implementer Runtime that has already recorded `reviewerStarted`/`validationStarted`/`githubMutationStarted` true blocks with `REVIEWER_RUNTIME_START_STALE` — a stale Implementer completion can never be reviewed twice by silently reusing an earlier attempt. This mirrors the same "no stale reuse" property Runtime Start enforces against Runtime Preflight, applied one stage later.

## Command Safety

See Architecture Decision 5. `isSafeCommandLine` and `isSafeImplementerCommandLine` are imported and reused as-is; `isSafeReviewerCommand` layers only the one additional pattern (unsafe redirection) neither already covers.

## Codex CLI Configuration

The repository's canonical Codex CLI convention (`tools/agent-workflow/agentRunner.js`, `DEFAULT_AGENT_RUNNERS.codex`/`.implementer`, `CODEX_FULL_ACCESS_ARGS`) is `command: "codex"`, `args: ["--sandbox", "danger-full-access", "--ask-for-approval", "never", "exec"]`, `inputMode: "stdin"`. `DEFAULT_REVIEWER_RUNTIME_COMMAND_CONFIG` matches that convention exactly, asserted by `isApprovedCommandConfig`. This configuration is a controller-level constant, not re-derived per request.

## Validation Order

```text
Execution Plan command-time revalidation
-> Execution Readiness command-time re-evaluation
-> Human Execution Approval revalidation
-> Runtime Preflight current re-execution
-> Runtime Start current re-execution
-> Implementer Runtime revalidation (must be Completed, unstale)
-> Implementer/Reviewer approved role-binding verification
-> Review Target resolution + Clean/Uncommitted gate
-> duplicate-active-attempt check
-> Codex command configuration + command-safety validation
-> prompt construction
-> Codex provider invocation
-> bounded result mapping, status kept separate from decision
```

No provider invocation occurs if any upstream step blocks. `ReviewerRuntimeService` is not invoked at all unless a Completed, unstale Implementer Runtime already exists for the exact context.

## Explicit Human Action

`OfficeProjectPortalInput` gains `startReviewerPressed: boolean`, distinct from `startImplementerPressed`/`enterPressed`/`actionPressed`, so the same keypress can never satisfy both starts. The dashboard input handler only attempts a Reviewer Runtime start when this field is true. The actor label is the same provider-neutral `"Local Human"` constant every prior stage uses; it is rejected by the same `codex|claude|agent|bot|automation|workflow` pattern if it were ever anything else.

## State and Storage

`ReviewerRuntime`/`ReviewerRuntimeResult` collections are project-scoped (`Record<projectId, ReviewerRuntimeCollection>` / `Record<projectId, ReviewerRuntimeResultCollection>`), immutable, and stored in `ProjectPortalState` exactly like every prior stage. The existing shared invalidation helper is extended to also delete both new collections, so a stale plan cannot leave a stale Reviewer Runtime record visible.

## Dashboard Strategy

Add `[REVIEWER RUNTIME]` immediately after `[IMPLEMENTER RUNTIME]`, `dropPriority: 16` (one past Implementer Runtime's `15`, the current highest pipeline-stage priority), `usePriorityFit: true`, `maxLines: 1` — making it the single most disposable pipeline row if the panel overflows. Row text pairs a decision (`Approved`/`Changes Requested`/`Decision Unknown`) with the blocking-finding count and an explicit "Human Decision Required"/"no mutation" clause, never a merge or validation claim.

A realistic full-layout regression test (`[RUNTIME START]`, `[IMPLEMENTER RUNTIME]`, and `[REVIEWER RUNTIME]` all present, using the existing containment helper) proves no row overlaps the drawn panel.

## Validation Strategy

Run focused Reviewer Runtime types/provider/prompt/parser/service/view/controller tests during implementation. Before independent review run `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check`, and `git diff --cached --check`. All `tasks.md` checkboxes, including the final validation-gate task, are checked before the review-round commit — not after — so an exact-HEAD-approved commit is never followed by a documentation-only recommit.

## Complexity Tracking

No constitution violations. The one added dependency (`node:child_process`, guarded) is the same one Spec 075 already justified empirically; Spec 076 reuses that same guard shape rather than re-deriving it.
