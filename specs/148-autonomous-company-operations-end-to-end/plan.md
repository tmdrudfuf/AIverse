# Implementation Plan: Autonomous Company Operations End-to-End Verification

**Branch**: `codex/148-autonomous-company-operations-end-to-end` | **Date**: 2026-09-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/148-autonomous-company-operations-end-to-end/spec.md`

## Summary

Prove that Specs 142-147 plus the Spec 142/138 development bridge and the real
ADOS integration compose into one safe controlled autonomous cycle. This is a
verification feature: it adds deterministic tests and stable repository-relative
runtime evidence, and it makes no `src/` production source changes. Its one
production change is an 18-line self-review / reviewer-availability guard in
`tools/agent-workflow/roleResolver.js` (Spec 148 C8), required by authoritative
requirement 10 so a resumed/durable run with one agent in both seats, or an
unavailable Codex reviewer, blocks before spawn instead of self-reviewing.
Existing stage coordinators remain the single source of truth; the verification
layer only observes state transitions.

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
- Plan Before Code: PASS. This plan defines the verification surface and
  validation before any test source is added.
- Tasks Gate Implementation: PASS. Implementation begins after `tasks.md` is
  generated.
- Preserve Application Stability: PASS. No production source files change; only
  new spec docs and new deterministic test files are added.
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
(`Started` vs `Completed`) as a derivation unit check, then closes the
daily-proof cycle to a truthful terminal `completed` via the existing operator
transition. The `computeConvergenceStatus` biconditional
(`CONVERGED` iff an Approved review is aligned on
`candidate == validated == reviewed == exact HEAD`, both directions) is
enforced unconditionally against the real durable ADOS records by
`spec148RoleAssignmentEvidence.test.ts`, not simulated in-cycle with a
hand-built object; its negative branch pins the specific non-converged status
and asserts `publicationResult` stays a standing "Blocked until ..." gate.

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

No constitution violations. No new production module. Two new test files plus
feature docs.
