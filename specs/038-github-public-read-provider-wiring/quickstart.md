# Quickstart: GitHub Public Read Provider Wiring

This feature makes `OfficeProjectPortalController` use the real `GitHubPublicRepositoryProvider` (spec 037) instead of `MockGitHubRepositoryProvider` for any project with a valid, enabled, public repository mapping.

## What changed for players

Opening the Project Dashboard for "Daily Proof" (the only currently-mapped project, `ai-verse/daily-proof`) now reads real, unauthenticated public GitHub data instead of local fixture data. Any project without a valid mapping behaves exactly as before (safe "not configured" state, no network call).

## Manual verification

1. `npx next dev`
2. Open the office computer/project portal, open the Company Dashboard, select "Daily Proof," open its Project Dashboard.
3. With real network access, this issues real `GET` requests to `api.github.com/repos/ai-verse/daily-proof` (and its commits/pulls endpoints). If reachable, real repository data renders; if not, the existing "unavailable" display-safe state renders instead — the app never crashes or fabricates data either way.
4. Confirm the browser network tab shows only `GET` requests to `api.github.com`, no credentials or tokens.

## Automated tests

```powershell
npx vitest run src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts
```
