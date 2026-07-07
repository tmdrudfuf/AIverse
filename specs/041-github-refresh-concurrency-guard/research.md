# Research: GitHub Refresh Concurrency Guard

## Does the controller need any changes for this feature?

No. `OfficeProjectPortalController`'s `repositoryRequestVersion`/`shouldApplyRepositorySummary` pattern already ensures that if two refresh calls for the same project overlap, only the response matching the *latest* triggered request is ever written into `state.repositorySummaries` — an older response arriving after a newer one is silently discarded. This already solves "no older refresh response may overwrite a newer one" at the UI-state layer. What it does *not* do is prevent both calls from independently reaching the network — each call to `refreshRepositoryDetail` still calls `this.repositoryService.refreshRepositorySummary(projectId)` regardless of whether another one is already in flight. That's the actual gap, and it lives entirely below the controller, inside `CachedGitHubRepositoryProvider`.

## Where should the guard live: `getRepositorySummary`, `refreshRepositorySummary`, or the shared helper?

Both public methods already delegate to one shared private helper, `fetchAndUpdateCache` (introduced in spec 040 precisely so the two methods' cache-update behavior could never diverge). Adding the guard there — rather than duplicating similar logic in each public method — means both a normal cache-miss read and a manual refresh automatically coalesce with any other in-flight call for the same project, with one change instead of two, and with the same "shared logic, cannot drift apart" property that made spec 040's design work in the first place. Decision: implement the guard entirely inside `fetchAndUpdateCache`.

## Join, no-op, or queue for the second caller?

- **No-op** would leave the second caller without a real result (or force fabricating one), which is unacceptable — every caller needs an actual answer.
- **Queue** (defer the second caller until the first fully finishes, then issue a *new* call) adds complexity and latency for no benefit, since both callers want the identical data from the identical moment in time.
- **Join** (await the same in-flight promise) is the simplest option that gives every caller a real, correct result while guaranteeing exactly one underlying call. Decision: join.

## How to prevent joiners from sharing a mutable object?

The stored in-flight promise resolves to whatever `performFetchAndUpdateCache` returns, which is already a `cloneSummary`-produced object (independent from the internal cache entry). A joining caller does `existingPromise.then(cloneSummary)` — cloning *again* from the already-resolved value — so every caller (the original triggerer and every joiner) receives its own independent object. Mutating one caller's result can never affect another caller's result or any future cache read.

## How to test overlap deterministically without real timers?

Use a manually-controlled deferred promise: `let resolveUnderlying: (summary) => void; const pending = new Promise((resolve) => { resolveUnderlying = resolve; }); const getRepositorySummary = vi.fn(() => pending);`. Two calls to `fetchAndUpdateCache`/`getRepositorySummary`/`refreshRepositorySummary` can be started (both promises created) before `resolveUnderlying` is ever called, guaranteeing genuine overlap without any timing dependency, then resolved on demand to observe both callers settle correctly.

## Does this affect any existing spec 037-040 test?

No. Every existing test in `CachedGitHubRepositoryProvider.test.ts` awaits each call before starting the next, so none of them ever produce genuine overlap — the new coalescing behavior is simply never exercised by them, and their expected call counts/results are unaffected. The one exception is the existing "satisfies the interface" test that asserts the exact list of prototype method names, which must be updated to include the new private method this feature introduces (the same kind of update spec 040 itself required when it added `refreshRepositorySummary`/`fetchAndUpdateCache`).
