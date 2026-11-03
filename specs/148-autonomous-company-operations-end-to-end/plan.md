# Implementation Plan: Autonomous Company Operations End-to-End Verification

**Branch**: `codex/148-autonomous-company-operations-end-to-end` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/148-autonomous-company-operations-end-to-end/spec.md`

## Summary

Prove that Specs 142-147 plus the Spec 142/138 development bridge and the real
ADOS integration compose into one safe controlled autonomous cycle. This is
primarily a verification feature (deterministic tests plus stable
repository-relative runtime evidence), but a human-authorized post-review fix
continuation (independent review findings on candidate `c07d80b`) required two
narrow, additive `src/` production changes that the original "no production
changes" framing no longer describes truthfully:

1. **Causal provenance for the durable ADOS run identity** (finding: do not
   pre-seed the known run id into Project A's repository binding - it must be
   received through the execution boundary being exercised). `durableAdosRunId`
   moved off `LocalProjectRepositoryBinding` entirely and now flows only from
   `ImplementerRuntimeProvider`'s own result evidence through
   `ExternalProjectAdosExecutionService` into `ExternalProjectAdosExecution` /
   `ExternalProjectAdosRunStatus`. Touches
   `ImplementerRuntimeTypes.ts`,
   `ExternalProjectAdosExecutionService.ts`,
   `ExternalProjectAdosExecutionTypes.ts`,
   `ExternalProjectAdosRunStatusService.ts`,
   `ExternalProjectAdosRunStatusTypes.ts`.
2. **Publication-readiness gate on task completion** (finding: the production
   `completed` transition must require publication-readiness evidence, and a
   blocked publication state must leave the task non-completed).
   `ProjectBacklogService.updateTask` now rejects a `completed` update on any
   task carrying an `executionRunId` unless the caller passes an explicit
   `publicationReadinessConfirmed: true` - evaluated from real durable ADOS
   state outside this browser-bundled layer, never defaulted or assumed.
   Manual tasks (no `executionRunId`) are unaffected, preserving requirement 20.
   Touches `ProjectBacklogService.ts`, `ProjectBacklogTypes.ts`,
   `ProjectBacklogSuggestionService.ts` (reason-union narrowing only),
   `OfficeProjectPortalController.ts`, and `CompanyOfficeScene.ts` (the manual
   status control resyncs to the task's real status on any rejected update
   instead of leaving it stuck on an unapplied value - requirement 18's
   failure-visibility bar, not a new UI feature).

Both changes are additive/optional-field plumbing with no new orchestration
engine, no new provider abstraction, and no change to Spec 144-147 policy
semantics - existing stage coordinators remain the single source of truth.
The pre-existing 18-line self-review / reviewer-availability guard in
`tools/agent-workflow/roleResolver.js` (Spec 148 C8, authoritative requirement
10) is unchanged by this continuation.

## Technical Context

**Language/Version**: TypeScript 5.8.3

**Primary Dependencies**: Next.js 16, React 19, Phaser 3.90, Vitest 4, Playwright

**Storage**: Existing browser office session localStorage snapshot; existing
`.agent-workflow/runs/<feature>/ados-run.json` durable ADOS state (gitignored,
mirrored into tracked, sanitized `ados-run.sanitized.json`)

**Testing**: Targeted Vitest coverage plus diff checks in this runtime; full
configured ADOS validation remains ADOS-owned per handoff

**Target Platform**: Browser-based Next.js application

**Project Type**: Web application with Phaser office/city scenes and a
TypeScript service layer

**Performance Goals**: The E2E harness drives one deterministic sequential cycle
with each stage transition occurring exactly once; no polling, no scheduler, no
recursive self-trigger.

**Constraints**: No second orchestration engine; no new production coordinator;
no change to Spec 144-147 policy semantics; no bypass of independent review or
exact HEAD; no absolute worktree paths in tracked evidence; no fabricated
percentage progress; deterministic suggestion fixture instead of uncontrolled AI
output.

**Scale/Scope**: Two canonical registered project contexts (Project A exercised,
Project B isolation) in the existing multi-project portfolio.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- Spec First: PASS. `spec.md` captures the integration goal, user value,
  acceptance criteria, boundaries, and edge cases.
- Plan Before Code: PASS (re-checked for the post-review fix continuation
  described in Summary; this revision documents the two production changes
  that continuation required before them, per Phase 21 of `tasks.md`).
- Tasks Gate Implementation: PASS. Implementation begins after `tasks.md` is
  generated.
- Preserve Application Stability: PASS. Both production changes are additive
  optional-field plumbing on existing types/services (see Summary); no new
  production module, orchestrator, or provider abstraction is introduced, and
  no existing behavior changes for tasks/executions that don't opt into the
  new fields.
- Validation Is Required: PASS. Targeted Vitest and diff checks run in this
  runtime; full configured validation is intentionally ADOS-owned per handoff.

## Project Structure

### Documentation (this feature)

```text
specs/148-autonomous-company-operations-end-to-end/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── autonomous-company-operations-e2e.md
├── checklists/
│   └── requirements.md
├── tasks.md
├── runtime-verification.md
├── runtime-evidence.json
└── ados-run.sanitized.json   (path-stripped mirror of the durable ADOS run record)
```

### Source Code (repository root)

```text
src/features/city-view/scene/office/project-backlog/
└── AutonomousCompanyOperationsE2E.test.ts   (new deterministic E2E chain coverage)

tools/agent-workflow/
└── spec148RoleAssignmentEvidence.test.ts    (new role / exact-HEAD / no-self-review coverage)
```

**Structure Decision**: Add verification-only test files beside the existing
authoritative services and the existing agent-workflow role logic. Reuse:

- `OfficeProjectPortalController` for all four policy toggles and stage
  evaluations (`updateSelectedProjectAutonomousSuggestionPolicy` /
  `evaluateSelectedProjectAutonomousSuggestionGeneration`,
  `updateSelectedProjectSuggestionAcceptancePolicy` /
  `evaluateSelectedProjectBacklogSuggestionsForAutoAccept`,
  `updateSelectedProjectBacklogReadinessPromotionPolicy` /
  `evaluateSelectedProjectBacklogReadinessPromotion`,
  `updateSelectedProjectAutonomyPolicy` / `reevaluateSelectedProjectAutonomy`).
- The existing deterministic `projectBacklogSuggestionProvider` injection point
  for the Spec 143 abstraction.
- The real `ExternalProjectAdosExecutionService`, with only its injectable
  `ImplementerRuntimeProvider` (the OS process spawn) replaced by a
  deterministic fake for the ADOS process boundary in automated tests. Real
  preparation validation, trusted-policy / safe-command checks, structured
  requirements assembly, and durable execution/result/run-status record
  creation still run.
- `tools/agent-workflow/roleResolver.js` (`resolveEffectiveRoles`,
  `validateAgentForRole`) for distinct-reviewer / no-self-review enforcement.
- `tools/agent-workflow/reviewConvergence.js` (`computeConvergenceStatus`) for
  exact-HEAD / stale-approval enforcement.

Do not introduce another project registry, suggestion store, scheduler,
provider abstraction, execution bridge, or convergence engine.

## Phase 0 - Research

See [research.md](research.md). Key findings:

- Every stage is already wired into `OfficeProjectPortalController`; Spec 148
  needs no new wiring, only ordered driving and assertions.
- `.agent-workflow/` is gitignored (`git check-ignore` confirms); the durable
  role assignment is mirrored into a tracked, sanitized `ados-run.sanitized.json`
  and cross-checked against the durable file when present.
- Existing agent-workflow modules already enforce distinct reviewer, exact
  target match, and no self-review; Spec 148 asserts these for this run rather
  than re-implementing them.
- Office lifecycle and portfolio attention states already exist; §12/§13 are
  assert-only.

## Phase 1 - Design

See [data-model.md](data-model.md) and
[contracts/autonomous-company-operations-e2e.md](contracts/autonomous-company-operations-e2e.md).

The E2E harness is a single Vitest file that:

1. Seeds two canonical registered projects (A exercised, B isolation).
2. Independently enables the four automation policies for Project A and asserts
   independence (Test A).
3. Drives the ordered chain once (Test H) and asserts each transition:
   suggestion generation (B), acceptance to backlog not Ready (C), Ready exactly
   once (D), Spec 144 as sole execution authority (E), bridge exact context (F).
4. Asserts no direct ADOS invocation from Specs 145-147 (Test G, structural).
5. Replays each lifecycle event and asserts idempotency (Tests I, J, K, L).
6. Asserts active-run gating (Test M) and second-project isolation (Test N).
7. Reloads the session and asserts preserved policy and lifecycle state
   (Test O).
8. Asserts manual workflows still function (Test Z) and no fabricated
   percentage progress is introduced (Test Y).

The role file asserts durable role assignment (Tests P, Q), distinctness
(Test R), candidate owner Claude (Test S), stale approval rejection (Test T),
validated/reviewed/exact-HEAD alignment (Test U), reviewer-unavailable blocks
(Test V), and no self-review fallback (Test W). Test X (completion reflects
actual ADOS completion) is a dedicated E2E test that drives the real
`ExternalProjectAdosExecutionService` twice, differing only in
`execution.evidence.completed`: it asserts the office-observable Spec 144
active-execution count (probe `autonomyActiveExecutionCount`, via
`ProjectAutonomousExecutionPolicyService.countActiveExecutions`) tracks that
signal (`1` vs `0`), with `deriveExternalProjectAdosRunStatus` stage
(`Started` vs `Completed`) as a derivation unit check, resolves the independent
reviewer from the run's own durable implementer id, and closes the cycle to a
truthful terminal `completed` via the existing operator transition. The same
cycle's review / validation / exact HEAD / publication stage cannot be
represented on the in-office chain (the office `ExternalProjectAdosExecution`
schema types its review/validation/publish sub-stage flags as the literal
`false`); the `computeConvergenceStatus` biconditional (`CONVERGED` iff an
Approved review is aligned on
`candidate == validated == reviewed == exact HEAD`, both directions) is run in
every case, unconditionally, against this run's own durable ADOS records by
`spec148RoleAssignmentEvidence.test.ts` (never a hand-built object), carrying
the real durable review decision; its negative branch pins the specific
non-converged status and asserts `publicationResult` stays a standing
"Blocked until ..." gate. Per authoritative
requirement 23 the ADOS process spawn is the only injected boundary; push,
approval and merge stay the human-only publication boundary.

## Validation

Targeted in this runtime:

- `npx vitest run src/features/city-view/scene/office/project-backlog/AutonomousCompanyOperationsE2E.test.ts tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts src/features/city-view/scene/PortfolioOperationsService.test.ts`
- `npx tsc --noEmit`
- `git diff --check`
- `git diff --cached --check`

`PortfolioOperationsService.test.ts` is the existing, unchanged coverage cited
for authoritative requirement 13 (Spec 140 portfolio truthfulness).

ADOS-owned authoritative pipeline: `npm test`, `npx tsc --noEmit`,
`npm run build`, `npm run test:e2e:home-canvas`, `git diff --check`,
`git diff --cached --check`.

## Complexity Tracking

No constitution violations and no new production module. The post-review fix
continuation (see Summary) added two additive optional fields/gates across ten
existing `src/` modules (`OfficeProjectPortalController.ts`,
`ExternalProjectAdosExecutionService.ts`,
`ExternalProjectAdosExecutionTypes.ts`,
`ExternalProjectAdosRunStatusService.ts`,
`ExternalProjectAdosRunStatusTypes.ts`, `ImplementerRuntimeTypes.ts`,
`ProjectBacklogService.ts`, `ProjectBacklogSuggestionService.ts`,
`ProjectBacklogTypes.ts`, `CompanyOfficeScene.ts` - the last one resyncs the
manual status control on any rejected update instead of leaving it stuck on an
unapplied value, per requirement 18's failure-visibility bar) plus the
pre-existing 18-line `roleResolver.js` guard and the test-only
`spec148DurableAlignment.js` helper. Two new test files plus feature docs
remain the bulk of the change.
