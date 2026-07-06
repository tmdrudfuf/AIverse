# Quickstart: Project Advisory Signals

## Automated Validation

Run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

Expected result:

- Tests pass.
- TypeScript passes.
- Production build passes.
- Diff checks pass.

## Manual Spot Check

1. Start the app:

```powershell
npx next dev -p 3000
```

2. Open `http://localhost:3000`.
3. Enter Daily Proof Inc.
4. Open the office computer/project portal.
5. Open Company Dashboard.
6. Select a project to open Project Dashboard.

Verify:

- Project Dashboard shows compact advisory rows.
- If a local project-manager suggestion exists, advisory rows show health, top risk or neutral risk, and next attention.
- If no suggestion exists, advisory rows show a clear waiting/unavailable state.
- The dashboard remains read-only.
- No task assignment, status change, employee control, external sync, credential, or GitHub action controls appear.
- Existing Company Dashboard source signals and Project Dashboard source metadata remain visible and unchanged.
