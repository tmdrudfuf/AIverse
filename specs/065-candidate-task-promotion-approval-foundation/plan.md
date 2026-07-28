# Implementation Plan: Candidate Task Promotion Approval Foundation

**Branch**: `codex/065-candidate-task-promotion-approval-foundation` | **Date**: 2026-07-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/065-candidate-task-promotion-approval-foundation/spec.md`

## Summary

Add a synchronous, provider-neutral Candidate Task promotion review module. It consumes existing Spec 063 `CandidateTaskCollection` values, existing Spec 064 `CandidateAssignmentRecommendationCollection` values, and local in-memory decision state. It evaluates eligibility, records explicit local human decisions, exposes promotion review collections on `ProjectPortalState`, and renders the lowest-priority `[PROMOTION REVIEW]` dashboard row. Approval remains only approval for a future promotion step; no ProjectTask, employee mutation, work session, AI invocation, GitHub mutation, persistence, background work, push, PR, or merge is introduced.

## Technical Context

**Language/Version**: TypeScript strict mode in the existing Next.js/Phaser app.

**Primary Dependencies**: No new dependencies. Reuses `candidate-tasks/`, `candidate-assignments/`, `OfficeProjectPortalController`, and `OfficeProjectPortalView`.

**Storage**: In-memory only on `ProjectPortalState`.

**Testing**: Vitest colocated tests.

**Target Platform**: Browser runtime.

**Project Type**: Client application feature in the office project portal.

**Performance Goals**: Synchronous linear evaluation over visible candidate tasks and recommendations.

**Constraints**: Deterministic, provider-neutral, no LLM, no remote mutation, no active assignment, no persistence, no ProjectTask creation, no work-session creation.

**Scale/Scope**: Existing seeded AIverse projects and issue/candidate/assignment dashboard flows.

## Constitution Check

No violations.

- Spec first: `spec.md` and quality checklist are present.
- Plan before code: this plan defines ownership and validation before implementation.
- Tasks gate implementation: `tasks.md` will be created before source changes.
- Preserve stability: changes are scoped to a new `candidate-promotions/` module and narrow controller/view integration.
- Validation required: focused and full validation are listed below.

## Project Structure

### Documentation

```text
specs/065-candidate-task-promotion-approval-foundation/
|-- spec.md
|-- plan.md
|-- quickstart.md
|-- checklists/
|   `-- requirements.md
`-- tasks.md
```

### Source Code

```text
src/features/city-view/scene/office/
|-- candidate-promotions/
|   |-- CandidatePromotionTypes.ts
|   |-- CandidatePromotionTypes.test.ts
|   |-- CandidatePromotionEligibility.ts
|   |-- CandidatePromotionEligibility.test.ts
|   |-- CandidatePromotionService.ts
|   |-- CandidatePromotionService.test.ts
|   |-- CandidatePromotionView.ts
|   `-- CandidatePromotionView.test.ts
|-- OfficeProjectPortalTypes.ts
|-- OfficeProjectPortalRegistry.ts
|-- OfficeProjectPortalController.ts
|-- OfficeProjectPortalController.issue-sync.test.ts
|-- OfficeProjectPortalView.ts
`-- OfficeProjectPortalView.test.ts
```

**Structure Decision**: A `candidate-promotions/` sibling module keeps promotion eligibility and decisions separate from issue synchronization, Candidate Task mapping, assignment recommendation matching, executable task logic, and work-session logic.

## Promotion Lifecycle

Statuses:

- `PendingReview`: current proposal awaits explicit human decision.
- `Approved`: approved for a future promotion step only.
- `Rejected`: human rejected the proposal for now.
- `Deferred`: human deferred the decision.
- `NeedsReview`: additional human attention is required before approval.
- `Ineligible`: current upstream state is not approvable.
- `Unavailable`: upstream Candidate Task or recommendation data is unavailable.

`Approved` never means active, working, started, executing, assigned, or scheduled.

## Eligibility Rules

Eligible only when:

- Candidate Task collection status is `Succeeded`.
- Candidate Task is present, open, and has project ID plus originating issue provenance.
- Assignment recommendation collection status is `Succeeded`.
- Matching assignment recommendation has the same project ID and Candidate Task ID.
- Assignment recommendation status is `Recommended`.
- Recommendation provenance matches the Candidate Task ID and issue number.

Conservative outcomes:

- Closed Candidate Task: `Ineligible`.
- Candidate Task source unavailable/failed/syncing/not started: `Unavailable`.
- Missing recommendation: `NeedsReview`.
- Stale recommendation from another project/task: `Ineligible`.
- `NeedsReview` assignment: `NeedsReview`, not approvable.
- `Unassigned` assignment: `Ineligible`, not approvable.
- `Unavailable` assignment: `Unavailable`, not approvable.

## Decision Transition Policy

Allowed:

- `PendingReview` -> `Approved`, `Rejected`, `Deferred`, `NeedsReview`
- `Deferred` -> `Approved`, `Rejected`, `PendingReview`
- `NeedsReview` -> `Approved` only when eligible, `Deferred`, `Rejected`, `PendingReview`
- `Rejected` -> `PendingReview`, `Deferred`
- `Approved` -> `PendingReview`, `Rejected`, `Deferred`

Rejected:

- Any transition to `Approved` when eligibility is not approvable.
- Any transition from `Ineligible` or `Unavailable` to `Approved`.
- Any transition to unsupported statuses.

Repeated identical decisions return the same logical decision identity and updated timestamp semantics remain deterministic for the current call.

## Controller Integration

The controller stores:

- `candidatePromotionDecisionRecords`: local human decisions keyed by deterministic decision ID.
- `candidatePromotionReviewCollections`: current per-project promotion review projections.
- `selectedCandidatePromotionIndex`: selected dashboard promotion review row.

Promotion reviews refresh after Candidate Task mapping and after assignment recommendation refresh. Decision application updates local decision state and recalculates current project review rows. It does not call providers, mutate employees, create ProjectTasks, create work sessions, or invoke AI services.

## Stale and Project-Switch Safeguards

- Review collections are keyed by project.
- Decision IDs include project and Candidate Task ID.
- Switching away from the dashboard clears only visible selection/project context, not stored decisions.
- Refresh with stable Candidate Task identity preserves human decisions.
- Unavailable upstream state updates eligibility while preserving historical local decision records.

## Layout Strategy

Dashboard lower-row priority remains:

1. critical project rows
2. issue list and issue detail
3. Candidate Task rows
4. assignment recommendation rows
5. promotion review rows

Promotion rows are appended last and bounded to one line, so they drop first under panel pressure.

## Validation Strategy

- `npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionEligibility.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionService.test.ts src/features/city-view/scene/office/candidate-promotions/CandidatePromotionTypes.test.ts`
- `npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts`
- `npm test`
- `npx tsc --noEmit`
- `npm run build`
- `git diff --check`
- `git diff --cached --check`

## Complexity Tracking

No constitution violations.
