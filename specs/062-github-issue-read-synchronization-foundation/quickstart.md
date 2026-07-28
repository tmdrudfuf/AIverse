# Quickstart: GitHub Issue Read Synchronization Foundation

## What this feature adds

A provider-neutral, read-only `IssueSnapshotCollection` boundary for a registered project's GitHub Issues, built on Spec 061's repository-sync patterns and reusing its `RepositorySyncStatus` lifecycle. Daily Proof (GitHub-backed) shows a real, pull-request-free issue list once its project dashboard is opened; Portfolio and AI Lab (local-provider) show the same honest `Unavailable` state Spec 061 established. This Spec does not create tasks from issues, does not mutate GitHub in any way, and does not add authentication — it only reads.

## Manual verification (in the running app)

1. Start the app and open the AIverse Operating Terminal (office project portal).
2. Select **Daily Proof** and press Enter/Space to open its **project dashboard**. In the lower panel, confirm the summary row appears:
   ```
   [ISSUES] Succeeded · <n> open, <n> closed
   ```
   `[ISSUE LIST] #<number> <title> (<Open|Closed>); +N more` and `[ISSUE DETAIL] Labels: ... · Assignees: ...` appear immediately below it only when the lower panel has room after the other rows already on screen (advisory text, repository sync, source signals, etc.) — see plan.md's row-count budget. They are dropped (detail first, then list) rather than ever overlapping the panel, so their absence on a given project is expected, not a bug.
   Confirm no pull request ever appears in the list or counts, even if the repository has open pull requests.
3. Press Esc, select **Portfolio**, open its project dashboard. Confirm:
   ```
   [ISSUES] Unavailable: Local repository reads need server-side support.
   ```
   — and confirm this is textually distinct from `Succeeded · 0 open, 0 closed` (a real zero-issue repository would show the latter, not the former).
4. If GitHub is unreachable or rate-limited when Daily Proof's dashboard is opened, confirm a `[ISSUES] Failed: ...` row appears with a short, display-safe reason — never a raw error message or stack trace.
5. Confirm Spec 061's `[REPO-SYNC]` row and Spec 060's detail-screen lines are unchanged — this Spec only adds new rows, it does not alter existing ones.

## Programmatic verification (unit level)

```ts
import { IssueSyncService } from "src/features/city-view/scene/office/issue-sync/IssueSyncService";
import { GitHubIssueSyncProvider } from "src/features/city-view/scene/office/issue-sync/GitHubIssueSyncProvider";
import { LocalIssueSyncProvider } from "src/features/city-view/scene/office/issue-sync/LocalIssueSyncProvider";

const service = new IssueSyncService({
  github: new GitHubIssueSyncProvider(mockFetch),
  local: new LocalIssueSyncProvider(),
});

const dailyProofCollection = await service.readIssueSnapshots({
  provider: "github", owner: "ai-verse", name: "daily-proof", defaultBranch: "main", connectionState: "Configured",
});
// => { provider: "github", syncStatus: "Succeeded", issues: [...], openCount, closedCount, isTruncated: false, lastSuccessfulSyncAt: "<now>" }
// No entry in `issues` has a `pull_request`-shaped origin — pull requests are excluded before normalization.

const portfolioCollection = await service.readIssueSnapshots({ provider: "local", connectionState: "Unknown" });
// => { provider: "local", syncStatus: "Unavailable", issues: [], openCount: 0, closedCount: 0, isTruncated: false,
//      errorSummary: "Local repository reads need server-side support." }

// Stale/out-of-order protection and project-switch isolation:
// see OfficeProjectPortalController.issue-sync.test.ts for the full concurrency scenarios.
```

## Test suites covering this feature

```powershell
npx vitest run src/features/city-view/scene/office/issue-sync/IssueSyncTypes.test.ts
npx vitest run src/features/city-view/scene/office/issue-sync/GitHubIssueSyncProvider.test.ts
npx vitest run src/features/city-view/scene/office/issue-sync/LocalIssueSyncProvider.test.ts
npx vitest run src/features/city-view/scene/office/issue-sync/IssueSyncService.test.ts
npx vitest run src/features/city-view/scene/office/issue-sync/IssueSyncView.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.issue-sync.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.project-dashboard.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Expected behavior summary

| Project | Repository identity | Expected `[ISSUES]` state |
|---|---|---|
| Daily Proof | `provider: "github"`, real owner/name | `Succeeded · <n> open, <n> closed` once the mocked/real fetch resolves; `Failed: ...` if GitHub is unreachable/rate-limited |
| Portfolio / AI Lab | `provider: "local"` | `Unavailable: Local repository reads need server-side support.` — never `Succeeded` |
| (hypothetical) project with no `repositoryIdentity` | *(absent)* | `No repository identity` — not currently reachable via any seeded project; verified at the view-formatting-function level |
| A real GitHub repository with zero issues | `provider: "github"` | `Succeeded · 0 open, 0 closed` — textually and structurally distinct from the `Unavailable` row above |

## How to verify no remote mutation occurs

- Grep the diff for any of: `git pull`, `git fetch`, `git checkout`, `git reset`, `git clean`, `git commit`, `git push`, `gh repo sync`, `gh pr`, `gh issue edit` — none should appear (this runtime issues zero shell commands; all reads are unauthenticated `fetch` calls to `api.github.com`).
- Confirm `IssueSyncProvider`'s only method is `readIssueSnapshots` — no `createIssue`, `closeIssue`, `addLabel`, or similar method exists anywhere in `issue-sync/`.
- In `GitHubIssueSyncProvider.test.ts`, confirm the fetch stub is only ever called with a GET-shaped request to the `/issues` endpoint — never a `POST`/`PATCH`/`DELETE`.

## Out of scope reminders

- No issue creation, editing, closing/reopening, labeling, assignment, or comments — read-only.
- No issue-to-task conversion, task creation, or AI employee assignment — this Spec produces a read-only collection a later Spec could consume, but does not consume it itself.
- No authentication UI or token management — unauthenticated public reads only, matching Spec 061's `GitHubPublicRepositoryProvider` precedent.
- No background polling, webhooks, or persistent storage — synchronization is triggered by the existing dashboard-open/refresh flow only.
- No generic pagination framework — a single bounded first page (50 issues) with an explicit `isTruncated` flag is the entire pagination boundary.
