# Quickstart: Browser-Persisted External Project Registration State

## Focused Validation

Run outside this ADOS runtime:

```powershell
npx vitest run src/features/city-view/scene/office/browser-session/BrowserOfficeSessionService.test.ts src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
```

Expected result:

- A saved external project registry entry restores into `projectRegistryEntries` and `projects`.
- A saved remote repository restores into `repositoryMappings`.
- Malformed saved registry data is ignored without throwing.

## Full ADOS Validation

Run outside this ADOS runtime:

```powershell
npm test
npx tsc --noEmit
npm run build
npm run test:e2e:home-canvas
git diff --check
git diff --cached --check
```
