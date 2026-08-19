# Quickstart: Candidate Detail Approve Defer Reject Controls

## Focused Validation Scenarios

1. Open Project Dashboard with candidate task and promotion review data.
2. Press candidate detail input and verify Candidate Detail opens for the selected candidate.
3. Press Approve and verify the detail view remains open and shows `Promotion: Approved`.
4. Reopen or reset to an available state, press Defer and verify `Promotion: Deferred`.
5. Reopen or reset to an available state, press Reject and verify `Promotion: Rejected`.
6. Return to Project Dashboard and verify Enter and Space still perform the existing dashboard candidate controls.
7. Try a stale detail context and verify no unrelated candidate decision is recorded.

## Commands

ADOS validation is intentionally not run from this implementation runtime. The expected external focused command is:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```
