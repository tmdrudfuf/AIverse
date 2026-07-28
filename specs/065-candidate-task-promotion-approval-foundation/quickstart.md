# Quickstart: Candidate Task Promotion Approval Foundation

## Focused Tests

```powershell
npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionEligibility.test.ts
npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionTypes.test.ts src/features/city-view/scene/office/candidate-promotions/CandidatePromotionService.test.ts
npx vitest run src/features/city-view/scene/office/candidate-promotions/CandidatePromotionView.test.ts src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Full Validation

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Dashboard Behavior

Open the project dashboard after issue sync and Candidate Task assignment recommendations are available.

Expected rows appear in this priority order:

```text
[ISSUES]
[ISSUE LIST]
[ISSUE DETAIL]
[CANDIDATE TASKS]
[ASSIGNMENT RECOMMENDATIONS]
[PROMOTION REVIEW]
```

Promotion review is intentionally lowest priority and may be hidden first when the lower dashboard panel is crowded.

## Human Decisions

- Use Up/Down to select a visible promotion review item when promotion review rows exist.
- Use Enter to approve an eligible selected proposal for future promotion.
- Use Action to cycle safe local decisions for the selected proposal.
- Approval records a local decision only.
- Reject and defer remain local.
- Reset returns the proposal to pending review.

## Expected No-Match Behavior

- `Recommended`: eligible for approval when Candidate Task data is valid.
- `NeedsReview`: visible but not silently approvable.
- `Unassigned`: visible but not approvable.
- `Unavailable`: visible as unavailable and not approvable.

## Closed Candidate Task Behavior

Closed Candidate Tasks remain traceable but are ineligible for approval.

## Safety Verification

After approval, verify:

- no `ProjectTask` was created
- no employee status or assignment changed
- no work session was created
- no Codex or Claude runtime was invoked
- no GitHub request or mutation was triggered by promotion approval
- no remote mutation occurred
