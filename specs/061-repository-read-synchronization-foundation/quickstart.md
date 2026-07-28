# Quickstart: Repository Read Synchronization Foundation

## What this feature adds

A provider-neutral, read-only `RepositorySyncSnapshot` boundary on top of Spec 060's `ProjectRegistryRepositoryIdentity`. It represents *verified* repository read state — an explicit `NotStarted | Syncing | Succeeded | Failed | Unavailable` lifecycle — clearly separate from Spec 060's static, configured identity. Daily Proof (GitHub-backed) shows a real, verified read once its project dashboard is opened; Portfolio and AI Lab (local-provider) show an honest `Unavailable` state, because this client-side runtime cannot read a local filesystem. No live infrastructure was added; no mutation of any kind is possible through this boundary.

## Manual verification (in the running app)

1. Start the app and open the AIverse Operating Terminal (office project portal).
2. Select **Daily Proof** and press Enter/Space to open its **project dashboard** (not the detail screen — see Assumptions in spec.md for why). In the lower panel, confirm a `[REPO-SYNC]` row appears, transitioning from:
   ```
   [REPO-SYNC] Syncing...
   ```
   to (once the GitHub read resolves):
   ```
   [REPO-SYNC] Succeeded · main · a1b2c3d
   ```
3. Press Esc, select **Portfolio**, open its project dashboard. Confirm:
   ```
   [REPO-SYNC] Unavailable: Local repository reads need server-side support.
   ```
4. Confirm Spec 060's detail-screen lines (`Repo: ...`, `Default Branch: ... Status: Configured`) are unchanged — this Spec adds a second, distinct concept on the dashboard rather than altering the detail screen's configured-identity display.
5. Confirm the existing GitHub-dashboard-signal rows (`[SOURCE]`, `[SYNC]`, issue/PR counts) are unchanged — this Spec's `[REPO-SYNC]` row is additive, not a replacement.

## Programmatic verification (unit level)

```ts
import { RepositorySyncService } from "src/features/city-view/scene/office/repository-sync/RepositorySyncService";
import { GitHubRepositorySyncProvider } from "src/features/city-view/scene/office/repository-sync/GitHubRepositorySyncProvider";
import { LocalRepositorySyncProvider } from "src/features/city-view/scene/office/repository-sync/LocalRepositorySyncProvider";
import { GitHubRepositoryService } from "src/features/city-view/scene/office/github/GitHubRepositoryService";

const service = new RepositorySyncService({
  github: new GitHubRepositorySyncProvider(new GitHubRepositoryService(mockProvider)),
  local: new LocalRepositorySyncProvider(),
});

const dailyProofSnapshot = await service.readRepositorySnapshot(
  { provider: "github", owner: "ai-verse", name: "daily-proof", defaultBranch: "main", connectionState: "Configured" },
  { projectId: "daily-proof" },
);
// => { provider: "github", availability: "available", owner: "ai-verse", name: "daily-proof",
//      defaultBranch: "main", latestCommit: { ... }, syncStatus: "Succeeded", lastSuccessfulSyncAt: "<now>" }

const portfolioSnapshot = await service.readRepositorySnapshot(
  { provider: "local", connectionState: "Unknown" },
  { projectId: "portfolio" },
);
// => { provider: "local", availability: "unavailable", syncStatus: "Unavailable",
//      errorSummary: "Local repository reads need server-side support." }

// Stale/out-of-order protection: an older Failed result can never overwrite a newer Succeeded one.
// See OfficeProjectPortalController.repository-sync.test.ts for the full concurrency scenario.
```

## Test suites covering this feature

```powershell
npx vitest run src/features/city-view/scene/office/repository-sync/RepositorySyncTypes.test.ts
npx vitest run src/features/city-view/scene/office/repository-sync/GitHubRepositorySyncProvider.test.ts
npx vitest run src/features/city-view/scene/office/repository-sync/LocalRepositorySyncProvider.test.ts
npx vitest run src/features/city-view/scene/office/repository-sync/RepositorySyncService.test.ts
npx vitest run src/features/city-view/scene/office/repository-sync/RepositorySyncView.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.repository-sync.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Out of scope reminders

- No `git`/`gh` shell command is ever invoked — this runtime is 100% client-side (no `fs`, no `child_process`, no API route anywhere in `src/`), so the read-only/no-mutation boundary is satisfied both by design and vacuously.
- No local filesystem read is performed — the local provider always reports `Unavailable`, honestly, rather than fabricating live local-git data.
- Spec 060's `ProjectRegistryRepositoryIdentity`/`connectionState` model is untouched, and verified snapshots are never written back onto it — configured identity and verified read state remain two distinct, independently-owned concepts.
- The GitHub-dashboard-signal pipeline (Specs 031/033: `externalSources`, `mergeGitHubProjectDashboardSource`) is untouched — this Spec's `[REPO-SYNC]` row is a new, separate lower-panel row, not a change to that pipeline's `[SYNC]`/`[SOURCE]` rows.
- No GitHub issue sync, PR sync, branch switching, `git fetch`/`pull`, repository write, or background/scheduled polling — the provider-neutral contract is designed so a later Spec can add these without modifying this Spec's existing types.
