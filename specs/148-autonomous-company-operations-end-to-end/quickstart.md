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
records one controlled cycle: Project A canonical identity (`daily-proof`),
Project B isolation identity (`ai-lab`), the four automation policy states (all
independently On), the suggestion id, accepted task id, backlog state, Ready
transition, development request / preparation / execution ids, the durable
execution record the office observes, the ADOS durable run id, the ADOS role
assignment (implementer Claude, reviewer Codex, mode adaptive) mirrored from the
sanitized `ados-run.sanitized.json`, candidate owner, reviewer identity, the
`dailyProofCycleCompletion` block (the cycle's truthful terminal
`completed` state), the `spec148CandidatePublicationGate` block (the same
cycle's review / validation / exact HEAD / publication stage, with push,
approval and merge kept as the human-only boundary), and the `shaAlignment`
block. `shaAlignment`
names the durable ADOS sources where the candidate / validated / reviewed SHAs
are available and the module that enforces `validated == reviewed == exact HEAD`,
rather than freezing a SHA literal or a review decision that goes stale the
moment this artifact is committed. It also carries duplicate-event idempotency
evidence, active-run gating evidence, and reload persistence evidence.
`publicationResult` is a standing gate: publication is blocked until ADOS records
an Approved independent Codex review with `validated == reviewed == exact HEAD`
(human-only). All paths are repository-relative.

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
