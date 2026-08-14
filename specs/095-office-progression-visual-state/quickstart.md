# Quickstart: Office Progression Visual State

## Focused Scenario

1. Start from the feature worktree on `codex/095-office-progression-visual-state`.
2. Run focused tests outside this restricted ADOS runtime:

   ```powershell
   npm test -- OfficeProgressionVisualStateLayer
   ```

3. In the app, enter the Daily Proof office.
4. Confirm the office shows a compact progression state summary near the office title.
5. Confirm active-zone labels appear in deterministic office positions and do not block portal interaction.

## Full Validation

Run outside this restricted ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
