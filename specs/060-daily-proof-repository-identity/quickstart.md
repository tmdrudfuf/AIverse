# Quickstart: Daily Proof Repository Identity

## What this feature adds

A provider-neutral `repositoryIdentity` on every `ProjectRegistryEntry` (Spec 059's Project Registry), describing where a project's source code lives without assuming GitHub is the only possible provider. Daily Proof gets its real, already-known GitHub identity; Portfolio and AI Lab get an honest "nothing known yet" state. Two new lines appear on the portal's project detail screen. No live verification, no filesystem access, no network calls — this Spec only describes repository identity, it does not synchronize it.

## Manual verification (in the running app)

1. Start the app and open the AIverse Operating Terminal (office project portal).
2. Select **Daily Proof** and open its detail screen (Enter/Space). In addition to Spec 059's `Repository: Connected (local)` / `Company: Daily Proof Inc.` lines, confirm two new lines:
   ```
   Repo: ai-verse/daily-proof (GitHub)
   Default Branch: main  ·  Status: Configured
   ```
3. Press Esc, select **Portfolio**, open its detail screen. Confirm:
   ```
   Repo: Not yet known (Local)
   Status: Unknown
   ```
   (no `Default Branch:` clause — none is known).
4. Confirm the Company Dashboard's project list, and Daily Proof's GitHub-sourced project source signal (`Sources: Daily Proof: GitHub linked [...]`), are unchanged — this Spec does not touch that pipeline.

## Programmatic verification (unit level)

```ts
import { ProjectRegistryService } from "src/features/city-view/scene/office/project-registry/ProjectRegistryService";
import { toProjectPortalProject } from "src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters";

const registry = new ProjectRegistryService();

const dailyProof = registry.getProject("daily-proof")!;
dailyProof.repositoryIdentity;
// => { provider: "github", owner: "ai-verse", name: "daily-proof", url: "https://github.com/ai-verse/daily-proof", defaultBranch: "main", connectionState: "Configured" }

// remoteRepository (Spec 059) and repositoryIdentity share the same owner/name/url — no silent divergence
dailyProof.remoteRepository?.owner === dailyProof.repositoryIdentity.owner; // true
dailyProof.remoteRepository?.name === dailyProof.repositoryIdentity.name; // true
dailyProof.remoteRepository?.url === dailyProof.repositoryIdentity.url; // true

const portfolio = registry.getProject("portfolio")!;
portfolio.repositoryIdentity;
// => { provider: "local", connectionState: "Unknown" }  (no owner/name/branch/path/lastVerifiedAt)

// Mutating a returned entry never affects the registry
dailyProof.repositoryIdentity.connectionState = "Available";
registry.getProject("daily-proof")!.repositoryIdentity.connectionState;
// => "Configured" (unchanged)

// The view's ProjectPortalProject carries the same data
toProjectPortalProject(dailyProof, []).repositoryIdentity?.connectionState;
// => "Configured"
```

## Test suites covering this feature

```powershell
npx vitest run src/features/city-view/scene/office/project-registry/ProjectRegistryService.test.ts
npx vitest run src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts
npx vitest run src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts
npx vitest run src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts
```

## Out of scope reminders

- No live GitHub/GitLab/filesystem check is performed — `connectionState`/`lastVerifiedAt` are static, seeded values in this Spec, ready for a future synchronization Spec to populate for real.
- No local filesystem path is seeded anywhere — this repo has no configuration mechanism to source one from, and inventing a machine-specific path in source is explicitly avoided.
- `remoteRepository`/`AIverseProjectRepositoryMapping` and the GitHub-dashboard pipeline (Specs 031/033) are untouched — `repositoryIdentity` is a separate, provider-neutral field, deliberately sourced from the same seed constants as `remoteRepository` for Daily Proof so the two cannot silently diverge.
- No Company Dashboard data-model change — repository identity is per-project detail, rendered on the portal's detail screen where Spec 059 already established the pattern.
