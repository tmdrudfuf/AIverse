import { describe, expect, it } from "vitest";

import { toProjectPortalProject, toRepositoryMapping } from "./ProjectRegistryAdapters";
import { createDefaultProjectRegistryEntries } from "./ProjectRegistrySeedData";
import { ProjectRegistryService } from "./ProjectRegistryService";
import type { ProjectRegistryEntry } from "./ProjectRegistryTypes";

describe("ProjectRegistryAdapters", () => {
  describe("toProjectPortalProject", () => {
    it("maps an Active entry to an enabled project with a real next action", () => {
      const [dailyProof] = createDefaultProjectRegistryEntries();

      const project = toProjectPortalProject(dailyProof, []);

      expect(project).toMatchObject({
        id: "daily-proof",
        name: "Daily Proof",
        status: "Active",
        type: "Company",
        enabled: true,
        description: "Daily Proof is the active company workspace for validating AIverse office workflows.",
        ownerCompany: "Daily Proof Inc.",
        localRepositoryLabel: "Connected (local)",
        nextAction: {
          label: "Review project workspace",
          enabled: true,
          placeholder: true,
        },
        repositoryIdentity: {
          provider: "github",
          owner: "ai-verse",
          name: "daily-proof",
          url: "https://github.com/ai-verse/daily-proof",
          defaultBranch: "main",
          connectionState: "Configured",
        },
      });
    });

    it("maps a non-Active entry with no remote repository to a disabled project with a coming-soon action", () => {
      const [, portfolio] = createDefaultProjectRegistryEntries();

      const project = toProjectPortalProject(portfolio, []);

      expect(project).toMatchObject({
        id: "portfolio",
        status: "Planned",
        enabled: false,
        ownerCompany: "AIverse Internal",
        localRepositoryLabel: "Not connected",
        nextAction: {
          label: "Coming soon",
          enabled: false,
          placeholder: true,
        },
        repositoryIdentity: {
          provider: "local",
          connectionState: "Unknown",
        },
      });
      expect(project.repositoryIdentity?.owner).toBeUndefined();
      expect(project.repositoryIdentity?.name).toBeUndefined();
      expect(project.repositoryIdentity?.defaultBranch).toBeUndefined();
    });

    it("maps repositoryIdentity as an independent copy, not a shared reference", () => {
      const [dailyProof] = createDefaultProjectRegistryEntries();

      const project = toProjectPortalProject(dailyProof, []);
      if (project.repositoryIdentity) project.repositoryIdentity.connectionState = "Available";

      expect(dailyProof.repositoryIdentity.connectionState).toBe("Configured");
    });

    it("maps localRepositoryBinding as an independent copy, not a shared reference", () => {
      const [dailyProof] = createDefaultProjectRegistryEntries();
      const boundEntry: ProjectRegistryEntry = {
        ...dailyProof,
        localRepositoryBinding: {
          projectId: "daily-proof",
          repositoryPath: "C:/repo",
          worktreePath: "C:/worktree",
          branchName: "codex/102-local-project-repository-binding",
        },
      };

      const project = toProjectPortalProject(boundEntry, []);
      if (project.localRepositoryBinding) project.localRepositoryBinding.worktreePath = "C:/mutated";

      expect(boundEntry.localRepositoryBinding?.worktreePath).toBe("C:/worktree");
    });

    it("passes through the provided linked services unchanged", () => {
      const [dailyProof] = createDefaultProjectRegistryEntries();
      const linkedServices = [{ id: "github", label: "GitHub", status: "Not connected" as const, enabled: false, placeholder: true as const }];

      const project = toProjectPortalProject(dailyProof, linkedServices);

      expect(project.linkedServices).toBe(linkedServices);
    });
  });

  describe("toRepositoryMapping", () => {
    it("reproduces today's daily-proof GitHub mapping exactly", () => {
      const [dailyProof] = createDefaultProjectRegistryEntries();

      expect(toRepositoryMapping(dailyProof)).toEqual({
        projectId: "daily-proof",
        sourceId: "github:ai-verse/daily-proof",
        repository: {
          owner: "ai-verse",
          name: "daily-proof",
          url: "https://github.com/ai-verse/daily-proof",
          visibility: "public",
        },
        enabled: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("returns undefined when the entry has no remote repository", () => {
      const [, portfolio, aiLab] = createDefaultProjectRegistryEntries();

      expect(toRepositoryMapping(portfolio)).toBeUndefined();
      expect(toRepositoryMapping(aiLab)).toBeUndefined();
    });
  });

  it("extends the registry with a new project type through the same adapters, with no special-casing required", () => {
    const registry = new ProjectRegistryService();
    const newEntry: ProjectRegistryEntry = {
      id: "restaurant-ordering-system",
      displayName: "Restaurant Ordering System",
      shortDescription: "A future registered project with no remote repository yet.",
      lifecycleStatus: "Planned",
      projectType: "Restaurant",
      localRepository: { connected: false, label: "Not connected" },
      repositoryIdentity: { provider: "local", connectionState: "Unknown" },
      owner: { companyName: "AIverse Internal" },
      createdAt: "2026-07-27T00:00:00.000Z",
      lastActivityAt: "2026-07-27T00:00:00.000Z",
    };

    registry.registerProject(newEntry);

    const projects = registry.getAllProjects().map((entry) => toProjectPortalProject(entry, []));
    expect(projects).toHaveLength(4);

    const registered = projects.find((project) => project.id === "restaurant-ordering-system");
    expect(registered).toMatchObject({
      name: "Restaurant Ordering System",
      type: "Restaurant",
      enabled: false,
      ownerCompany: "AIverse Internal",
      localRepositoryLabel: "Not connected",
    });
    expect(toRepositoryMapping(newEntry)).toBeUndefined();
  });

  it("keeps Daily Proof's remoteRepository and repositoryIdentity from silently diverging (shared seed constants)", () => {
    const [dailyProof] = createDefaultProjectRegistryEntries();

    expect(dailyProof.remoteRepository?.owner).toBe(dailyProof.repositoryIdentity.owner);
    expect(dailyProof.remoteRepository?.name).toBe(dailyProof.repositoryIdentity.name);
    expect(dailyProof.remoteRepository?.url).toBe(dailyProof.repositoryIdentity.url);
  });
});
