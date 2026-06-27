# Quickstart: Computer Project Portal

## Automated Validation

Run from repository root:

```powershell
npx tsc --noEmit
npm run build
git diff --check
```

Expected result:

- TypeScript completes with no errors.
- Production build completes.
- Whitespace validation reports no issues.

## Manual Validation

1. Enter Daily Proof office.
2. Walk to the computer zone.
3. Press Space.
4. Confirm Project Portal overlay opens.
5. Confirm the same Space press does not immediately close it.
6. Confirm Founder cannot move while portal is open.
7. Confirm Q/E does not zoom while portal is open.
8. Press Esc and confirm portal closes.
9. Reopen portal and press Space; confirm portal closes.
10. Stand in the exit zone and press Space; confirm return to city still works.
11. Confirm no GitHub/Firebase/API calls, NPCs, or simulation were added.