# Quickstart: Visible Office Level-Up Reaction

## Focused Scenario

1. Trigger a company level-up while in the office, such as by completing the existing progression prerequisites and recruiting the fifth employee.
2. Confirm the office displays a compact level-up reaction naming the reached level and reward context.
3. Confirm the existing office progression visual-state HUD, NPCs, interaction prompt, exit behavior, and project portal remain usable.

## Focused Validation

Run outside this ADOS runtime:

```powershell
npm test -- OfficeLevelUpReactionLayer
```

## Full ADOS Validation

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```
