# Quickstart: Daily Proof Portal Browser Smoke Validation

## Focused Check

Use the focused Vitest target when validation is allowed by the runtime policy:

```powershell
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.browser-smoke.test.ts
```

## Full Validation

Run the repository validation sequence only from a validation-approved runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
git diff --cached --check
```

## Expected Outcome

- Daily Proof opens from the Project Portal default selection.
- The Daily Proof dashboard is selected.
- The Daily Proof runtime-start chain creates exactly one runtime-start record.
- Implementer, reviewer, validation, publication, merge, deployment, and GitHub mutation flows remain unstarted.

## Runtime Policy Note

This ADOS implementation runtime must not run the focused check or the full validation sequence. The commands above are for a later validation runtime.
