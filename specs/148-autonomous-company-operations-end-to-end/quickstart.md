# Quickstart: Autonomous Company Operations End-to-End Verification

## What this feature proves

One controlled autonomous cycle composes safely across Specs 142-147 and ADOS
for a canonical registered project, with all four automation controls
independently enabled and no safety gate weakened.

## Run the targeted verification

```bash
npx vitest run \
  src/features/city-view/scene/office/project-backlog/AutonomousCompanyOperationsE2E.test.ts \
  tools/agent-workflow/spec148RoleAssignmentEvidence.test.ts \
  src/features/city-view/scene/PortfolioOperationsService.test.ts
npx tsc --noEmit
git diff --check
git diff --cached --check
```

`PortfolioOperationsService.test.ts` is the existing, unchanged coverage cited
for authoritative requirement 13 (Spec 140 portfolio truthfulness).

## Read the evidence

`specs/148-autonomous-company-operations-end-to-end/runtime-evidence.json`
records one controlled cycle up to the ADOS execution boundary: Project A
canonical identity, Project B isolation identity, the four automation policy
states (all independently On), the suggestion id, accepted task id, backlog
state, Ready transition, development request / preparation / execution ids, the
durable execution record the office observes, the ADOS durable run id, the ADOS
role assignment (implementer Claude, reviewer Codex, mode adaptive), candidate
owner, reviewer identity, the `externalSafetyBoundary` block, SHA-alignment /
convergence-gate fields, duplicate-event idempotency evidence, active-run gating
evidence, and reload persistence evidence. Independent Codex review,
implementation validation, exact-HEAD convergence, and publication are the
authoritative ADOS pipeline that runs after this handoff. All paths are
repository-relative.

## Manual controls still work

- Manual suggestion generation: `generateBacklogSuggestionsPressed`
- Manual suggestion review: `acceptBacklogSuggestionPressed` /
  `rejectBacklogSuggestionPressed`
- Manual backlog -> Ready: `updateSelectedBacklogTaskFromInput({ status: "ready" })`
- Manual Start Development: `startBacklogDevelopmentPressed`
- Each automation stage can be disabled independently via its
  `updateSelectedProject*Policy({ enabled: false })`.

## Boundaries

No new production orchestration engine. No change to Spec 144-147 policy
semantics. Independent Codex review and exact HEAD remain mandatory publication
gates. Push, PR readiness, approval, merge, and remote deletion stay human-only.
