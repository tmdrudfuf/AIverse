# Quickstart: Office Tilemap Layout

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
2. Enter Daily Proof from the city.
3. Confirm the office tilemap renders with floor, wall, and decoration layers.
4. Confirm the founder spawns inside the office.
5. Move into walls and blocked areas; founder should stop.
6. Move through open floor; founder should move normally.
7. Confirm camera follows founder and zoom behavior remains available.
8. Stand in the exit zone and press Space.
9. Confirm the scene returns to the city at the existing return position and facing.

## Scope Checks

- Do not add desks as gameplay objects.
- Do not add NPCs, AI workers, computers, or office simulation.
- Keep the interaction layer reserved only.
