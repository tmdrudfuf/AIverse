# Quickstart: Project Registry Foundation

## What this feature adds

A `ProjectRegistryService` that becomes the single source of truth for "what projects the company knows about" — replacing two hardcoded arrays (`PROJECTS`, `REPOSITORY_MAPPINGS`) in `OfficeProjectPortalRegistry.ts`. Daily Proof is registered as the first real project, with a company owner and a local repository identity, both now visible on the portal's project detail screen. Portfolio and AI Lab (AIverse's own internal placeholders) are registered too, so the registry is genuinely the only place project data lives — not a parallel path only Daily Proof uses.

## Manual verification (in the running app)

1. Start the app and open the AIverse Operating Terminal (office project portal).
2. In the project list, select **Daily Proof** and press Enter/Space to open its detail screen.
3. Confirm the detail screen shows, in addition to the existing name/status/description/linked-services/next-action:
   ```
   Repository: Connected (local)
   Company: Daily Proof Inc.
   ```
4. Press Esc to go back, select **Portfolio**, and open its detail screen. Confirm it shows:
   ```
   Repository: Not connected
   Company: AIverse Internal
   ```
5. Confirm the project list itself, and the Company Dashboard panel (list view, "Projects" section), still show Daily Proof, Portfolio, and AI Lab exactly as before — same names, statuses, and (for Daily Proof) the same GitHub source signal — since both are now derived from the registry rather than the old hardcoded arrays.

## Programmatic verification (unit level)

```ts
import { ProjectRegistryService } from "src/features/city-view/scene/office/project-registry/ProjectRegistryService";
import { toProjectPortalProject, toRepositoryMapping } from "src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters";

const registry = new ProjectRegistryService();

// Seeded with all three known projects, in order
registry.getAllProjects().map((entry) => entry.id);
// => ["daily-proof", "portfolio", "ai-lab"]

// Daily Proof carries real owner + repository metadata
const dailyProof = registry.getProject("daily-proof")!;
toProjectPortalProject(dailyProof).ownerCompany;
// => "Daily Proof Inc."
toProjectPortalProject(dailyProof).localRepositoryLabel;
// => "Connected (local)"
toRepositoryMapping(dailyProof);
// => { projectId: "daily-proof", sourceId: "github:ai-verse/daily-proof", repository: { owner: "ai-verse", name: "daily-proof", url: "https://github.com/ai-verse/daily-proof", visibility: "public" }, enabled: true, createdAt: "2026-01-01T00:00:00.000Z" }

// Portfolio has no remote repository — the adapter omits it, not fabricates it
toRepositoryMapping(registry.getProject("portfolio")!);
// => undefined

// Extending the registry needs no code change outside project-registry/
registry.registerProject({
  id: "restaurant-ordering-system",
  displayName: "Restaurant Ordering System",
  shortDescription: "A future registered project with no remote repository yet.",
  lifecycleStatus: "Planned",
  projectType: "Restaurant",
  localRepository: { connected: false, label: "Not connected" },
  owner: { companyName: "AIverse Internal" },
  createdAt: "2026-07-27T00:00:00.000Z",
  lastActivityAt: "2026-07-27T00:00:00.000Z",
});
registry.getAllProjects().length;
// => 4

// Duplicate ids are rejected, not silently overwritten
registry.registerProject({ id: "daily-proof", /* ... */ } as never);
// => throws
```

## Test suites covering this feature

```powershell
npx vitest run src/features/city-view/scene/office/project-registry/ProjectRegistryService.test.ts
npx vitest run src/features/city-view/scene/office/project-registry/ProjectRegistryAdapters.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalRegistry.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalController.repository-provider.test.ts
npx vitest run src/features/city-view/scene/office/project-dashboard/GitHubProjectDashboardProvider.test.ts
npx vitest run src/features/city-view/scene/office/dashboard/InternalSimulationDashboardProvider.test.ts
npx vitest run src/features/city-view/scene/office/OfficeProjectPortalView.test.ts
```

## Out of scope reminders

- No GitHub sync, Firebase, authentication, issue sync, or build automation — Daily Proof's registration is metadata only.
- No "add project" UI/control is wired up in this Spec; `registerProject` exists as a domain capability for a future Spec to call.
- No Company Dashboard data-model change — the dashboard already shows registered projects' name/status/source-signal for free, since it reads from the now registry-derived `state.projects`/`state.repositoryMappings`.
- `ProjectWorkspace`/`ProjectWorkspaceSection` (the per-project Repository/Firebase/Analytics/Tasks/AI Agents workspace screen) is untouched.
