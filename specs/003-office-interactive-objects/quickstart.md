# Quickstart: Office Interactive Objects

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

1. Start the app.
2. Enter Daily Proof office.
3. Walk to the computer interaction zone.
4. Confirm prompt appears with `Computer` and `Press Space to use`.
5. Press Space near the computer.
6. Confirm a placeholder interaction result is logged or stored.
7. Move away and confirm the object prompt disappears.
8. Stand in the exit zone and confirm the exit prompt appears.
9. Press Space in the exit zone and confirm return to city.
10. Confirm Q/E zoom, camera follow, movement, and tile collision still work.

## Scope Checks

- No desks are implemented.
- No NPCs are implemented.
- No computer UI panel is implemented.
- No GitHub, Firebase, project dashboard, or simulation integration is implemented.
