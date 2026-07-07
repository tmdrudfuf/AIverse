# Implementation Plan: GitHub Public Read Provider Wiring

**Branch**: `038-github-public-read-provider-wiring` | **Date**: 2026-07-07 | **Spec**: `specs/038-github-public-read-provider-wiring/spec.md`

**Input**: Feature specification from `specs/038-github-public-read-provider-wiring/spec.md`

## Summary

Wire `GitHubPublicRepositoryProvider` (spec 037) into `OfficeProjectPortalController` as the active `GitHubRepositoryProvider`, using a small new resolver that maps `projectId -> {owner, name}` from the controller's existing, already-validated `AIverseProjectRepositoryMapping` state. No prerequisite feature is required: a trustworthy, explicit, non-guessed repository-reference source already exists (spec 031) and is already consumed by the dashboard layer (specs 033-034). This is a one-line constructor swap plus one small new resolver file.

## Technical Context

**Language/Version**: TypeScript, existing Next.js/Phaser application code

**Primary Dependencies**: `GitHubPublicRepositoryProvider` (spec 037), `AIverseProjectRepositoryMapping`/`validateAIverseProjectRepositoryMapping` (spec 031, `GitHubRepositoryTypes.ts`), `OfficeProjectPortalController`

**Storage**: None new; reads existing in-memory `ProjectPortalState.repositoryMappings`

**Testing**: Vitest; a Phaser scene stub (matching the pattern already used in `OfficeProjectPortalView.test.ts`) to exercise the real controller constructor

**Target Platform**: Same Next.js application

**Project Type**: One new small resolver file + one small controller edit + two new test files

**Performance Goals**: No change; still at most 3 network calls per repository read, only for validly mapped projects

**Constraints**: No `GitHubRepositoryProvider` interface change; no dual-provider router; no mapping-authoring UI; no persistence

**Scale/Scope**: One new production file (`GitHubRepositoryReferenceResolver.ts`), one one-line-equivalent edit to `OfficeProjectPortalController.ts`'s constructor and imports, two new test files

## Constitution Check

- **Spec First**: PASS. `spec.md` defines user stories, requirements, non-goals, success criteria.
- **Plan Before Code**: PASS. This plan documents the integration seam before any code changes.
- **Tasks Gate Implementation**: PASS. `tasks.md` will exist before implementation.
- **Preserve Application Stability**: PASS. Only the controller's provider construction changes; no dashboard, view, or data-model file changes.
- **Validation Is Required**: PASS. `npm test`, `npx tsc --noEmit`, `npm run build`, `git diff --check` are required.

No constitution violations are expected.

## Existing System Review (discovered integration seam)

- `AIverseProjectRepositoryMapping` (`GitHubRepositoryTypes.ts`) already carries `projectId`, `sourceId`, `repository: { owner, name, url, visibility, defaultBranchHint }`, `enabled`. This is explicit, human-authored data (from `REPOSITORY_MAPPINGS` in `OfficeProjectPortalRegistry.ts`), never derived from a project's name or title.
- `validateAIverseProjectRepositoryMapping(mapping)` already implements exactly the validity rules needed (missing → unavailable, disabled → unavailable, malformed owner/name → unavailable, private → unauthenticated) and is already used by the dashboard-derivation layer (specs 033-034). Reusing it in the new resolver avoids duplicating this logic.
- `OfficeProjectPortalController`'s constructor (`OfficeProjectPortalController.ts` line ~114) hard-constructs every service inline with no dependency-injection framework anywhere in the class: `this.repositoryService = new GitHubRepositoryService(new MockGitHubRepositoryProvider());`. `MockGitHubRepositoryProvider` is imported and used only at this one call site in this file.
- `GitHubPublicRepositoryProvider` (spec 037) already accepts an injected `GitHubRepositoryReferenceResolver` in its constructor and already exports the `GitHubRepositoryReference`/`GitHubRepositoryReferenceResolver` types this feature reuses — no new types are needed at the provider boundary.
- The only existing test file touching this flow, `OfficeProjectPortalController.project-dashboard.test.ts`, never constructs the real controller — it builds a harness via `Object.create(OfficeProjectPortalController.prototype)` and injects a stub `repositoryService` directly, bypassing the constructor entirely. This means the constructor change is safe against all existing tests, but there is currently no test coverage of the real constructor's provider wiring — this feature adds the first one.

**Conclusion: no prerequisite feature is needed.** Direct wiring is safe because the repository-reference source is already explicit, validated, and non-guessed.

## Architecture Approach

1. **New file** `src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.ts`:
   ```ts
   export function createRepositoryReferenceResolver(
     getMappings: () => ReadonlyArray<AIverseProjectRepositoryMapping>,
   ): GitHubRepositoryReferenceResolver
   ```
   Looks up the mapping for a `projectId`, returns `undefined` if missing, and otherwise reuses `validateAIverseProjectRepositoryMapping` to decide validity (enabled + display-safe + not private) before returning `{ owner, name }` from the mapping's own `repository` field. Never inspects the project's `name`/display label.
2. **Controller edit** (`OfficeProjectPortalController.ts`):
   - Replace the `MockGitHubRepositoryProvider` import with `GitHubPublicRepositoryProvider` and `createRepositoryReferenceResolver`.
   - Change the constructor line to:
     ```ts
     this.repositoryService = new GitHubRepositoryService(
       new GitHubPublicRepositoryProvider(createRepositoryReferenceResolver(() => this.state.repositoryMappings)),
     );
     ```
   - The resolver closure reads `this.state.repositoryMappings` live (not a snapshot captured at construction time), so it always reflects current state.
3. **No other production file changes.** `GitHubRepositoryProvider.ts`, `MockGitHubRepositoryProvider.ts`, `GitHubPublicRepositoryProvider.ts`, and every dashboard/view file are untouched.

## Data Boundaries

- The resolver only ever reads `AIverseProjectRepositoryMapping` data already present in `ProjectPortalState`; it does not read, derive from, or fall back to `ProjectPortalProject.name`/title.
- The resolver performs no I/O and mutates nothing; it is a pure lookup over existing state.
- Dashboard consumers are unaffected; they continue to read `state.repositorySummaries`/`state.projectDashboardSnapshot`, unaware of which `GitHubRepositoryProvider` implementation produced the summary.

## File Touchpoints

- `src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.ts` (new)
- `src/features/city-view/scene/office/github/GitHubRepositoryReferenceResolver.test.ts` (new)
- `src/features/city-view/scene/office/OfficeProjectPortalController.ts` (edit: constructor + imports only)
- `src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts` (new)

## Risk Assessment

- **Rate-limit risk in real usage**: with the real provider wired in, opening the mapped project's dashboard now issues up to 3 real unauthenticated GitHub requests. Unauthenticated GitHub limits are ~60 requests/hour per IP, so repeated dashboard opens during development/demo could exhaust this quickly, surfacing the (already display-safe) `rate_limited` state more often than before. Mitigation: this is the explicit, intended purpose of this feature; no additional mitigation (caching, feature flag) is added here to keep scope minimal, and the consequence is clearly reported to the reviewer.
- **Silent behavior change for the one mapped project**: `daily-proof`'s dashboard now depends on real network reachability of `ai-verse/daily-proof` instead of deterministic local fixtures. Mitigation: already-proven spec 037 safe-degradation behavior (404/offline/malformed → `unavailable`) means the dashboard cannot crash or show fabricated data even if that repository is unreachable or does not exist.
- **Regression risk to existing tests**: mitigated by confirming (via code inspection) that no existing test exercises the real controller constructor; a new test now covers it for the first time.
- **Scope creep risk**: mitigated by not introducing a router/dispatch layer, feature flag, or new mapping-authoring capability — exactly one new file and one constructor edit.

## Validation

Implementation must run:

```powershell
npm test
npx tsc --noEmit
npm run build
git diff --check
```

Manual verification:

1. Start the app (`npx next dev`), open the office computer/project portal, open Company Dashboard, select "Daily Proof," and open its Project Dashboard.
2. With real network access, this now issues real requests to `api.github.com/repos/ai-verse/daily-proof` (and its commits/pulls endpoints). If that repository is reachable and public, real data renders; if not, the existing "unavailable" state renders safely.
3. Confirm no credential/token prompt ever appears and the browser network tab shows only `GET` requests to `api.github.com`.

## Post-Design Constitution Check

The design remains spec-first, read-only, provider-neutral at the dashboard layer, and scoped to exactly the composition seam already used by every other service in this controller. No credential flow, persistence layer, sync behavior, router/dispatch layer, or mapping-authoring UI is introduced.
