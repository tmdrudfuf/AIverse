# Quickstart: GitHub Public Read Refresh Control

This feature adds an explicit manual refresh action to the office computer's Repository Detail screen for a mapped project, bypassing the spec 039 cache only when intentionally triggered.

## What changed for players

Opening "Daily Proof"'s Repository Detail screen (via its workspace's Repository section) now shows "Esc back  Enter refresh" once data has loaded. Pressing Enter/Action re-reads GitHub immediately, even if the 5-minute cache hasn't expired. Nothing else changes automatically.

## Manual verification

1. `npx next dev`, open the office computer/project portal, open "Daily Proof"'s workspace, open Repository.
2. Wait for the summary to load; note the instruction hint now includes "Enter refresh."
3. Press Enter — the screen shows a brief loading state, then re-displays the (possibly unchanged) data. The network tab shows a new `api.github.com` request even though the cache TTL had not expired.
4. Confirm a project with no repository mapping shows no refresh hint and pressing Enter there does nothing.

## Automated tests

```powershell
npx vitest run src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts
npx vitest run src/features/city-view/scene/office/github/GitHubRepositoryService.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts
```
