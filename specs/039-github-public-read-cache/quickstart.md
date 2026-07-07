# Quickstart: GitHub Public Read Cache

This feature adds a small in-memory cache in front of the real GitHub public read provider (spec 037/038), so repeated dashboard opens for the same mapped project within 5 minutes reuse the last successful read instead of hitting GitHub again.

## What changed for players

Opening and reopening "Daily Proof"'s Project Dashboard within the same few minutes no longer issues a new GitHub request each time. Waiting past 5 minutes (or any read that previously failed) still reads fresh data.

## Manual verification

1. `npx next dev`, open the office computer/project portal, open Company Dashboard, select "Daily Proof," open its Project Dashboard. Note the network tab shows requests to `api.github.com`.
2. Close and reopen the same dashboard within a few seconds — the network tab should show no new `api.github.com` requests.
3. Wait 5+ minutes and reopen — new requests should appear again.

## Automated tests

```powershell
npx vitest run src/features/city-view/scene/office/github/CachedGitHubRepositoryProvider.test.ts
```
