# Quickstart: GitHub Refresh Concurrency Guard

This feature adds a per-project in-flight guard to `CachedGitHubRepositoryProvider` so overlapping reads/refreshes for the same project never issue more than one real underlying call at a time.

## What changed for players

Pressing Enter/Action repeatedly on the Repository Detail screen before the first refresh finishes no longer issues multiple real GitHub requests — all rapid presses share the same in-flight read. Once it completes, the next press starts a genuinely new read.

## Manual verification

1. `npx next dev`, open the office computer/project portal, open "Daily Proof"'s Repository Detail screen.
2. Press Enter/Action twice in quick succession before the loading state clears.
3. Confirm the network tab shows only one set of `api.github.com` requests (repo/commits/pulls), not two.

## Automated tests

```powershell
npx vitest run src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts
```
