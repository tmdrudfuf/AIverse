import { describe, expect, it } from "vitest";

import { ProjectRegistryService } from "./ProjectRegistryService";
import type { ProjectRegistryEntry } from "./ProjectRegistryTypes";

describe("ProjectRegistryService", () => {
  it("seeds the registry with Daily Proof, Portfolio, and AI Lab in order by default", () => {
    const registry = new ProjectRegistryService();

    expect(registry.getAllProjects().map((entry) => entry.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
  });

  it("returns Daily Proof's real owner and repository metadata", () => {
    const registry = new ProjectRegistryService();

    const dailyProof = registry.getProject("daily-proof");

    expect(dailyProof?.owner.companyName).toBe("Daily Proof Inc.");
    expect(dailyProof?.localRepository).toEqual({ connected: true, label: "Connected (local)" });
    expect(dailyProof?.remoteRepository).toEqual({
      owner: "ai-verse",
      name: "daily-proof",
      url: "https://github.com/ai-verse/daily-proof",
      visibility: "public",
    });
  });

  it("returns Daily Proof's provider-neutral repository identity", () => {
    const registry = new ProjectRegistryService();

    const dailyProof = registry.getProject("daily-proof");

    expect(dailyProof?.repositoryIdentity).toEqual({
      provider: "github",
      owner: "ai-verse",
      name: "daily-proof",
      url: "https://github.com/ai-verse/daily-proof",
      defaultBranch: "main",
      connectionState: "Configured",
    });
  });

  it("returns a sparse, honest repository identity for projects with no known repository", () => {
    const registry = new ProjectRegistryService();

    expect(registry.getProject("portfolio")?.repositoryIdentity).toEqual({ provider: "local", connectionState: "Unknown" });
    expect(registry.getProject("ai-lab")?.repositoryIdentity).toEqual({ provider: "local", connectionState: "Unknown" });
  });

  it("returns undefined for an unknown project id", () => {
    const registry = new ProjectRegistryService();

    expect(registry.getProject("does-not-exist")).toBeUndefined();
  });

  it("registers a new project without special-casing any existing project id", () => {
    const registry = new ProjectRegistryService();

    registry.registerProject(createEntry({ id: "restaurant-ordering-system", displayName: "Restaurant Ordering System" }));

    const ids = registry.getAllProjects().map((entry) => entry.id);
    expect(ids).toEqual(["daily-proof", "portfolio", "ai-lab", "restaurant-ordering-system"]);
  });

  it("throws when registering a duplicate id and leaves the registry unchanged", () => {
    const registry = new ProjectRegistryService();

    expect(() => registry.registerProject(createEntry({ id: "daily-proof", displayName: "Duplicate Daily Proof" }))).toThrow(
      'Project "daily-proof" is already registered.',
    );
    expect(registry.getAllProjects()).toHaveLength(3);
    expect(registry.getProject("daily-proof")?.displayName).toBe("Daily Proof");
  });

  it("returns independent copies so mutating a returned entry does not affect the registry", () => {
    const registry = new ProjectRegistryService();

    const entry = registry.getProject("daily-proof");
    if (!entry) throw new Error("expected daily-proof entry");
    entry.displayName = "Mutated";
    entry.owner.companyName = "Mutated Inc.";
    entry.localRepository.connected = false;
    entry.repositoryIdentity.connectionState = "Available";
    entry.repositoryIdentity.owner = "mutated-owner";

    expect(registry.getProject("daily-proof")?.displayName).toBe("Daily Proof");
    expect(registry.getProject("daily-proof")?.owner.companyName).toBe("Daily Proof Inc.");
    expect(registry.getProject("daily-proof")?.localRepository.connected).toBe(true);
    expect(registry.getProject("daily-proof")?.repositoryIdentity.connectionState).toBe("Configured");
    expect(registry.getProject("daily-proof")?.repositoryIdentity.owner).toBe("ai-verse");
  });

  it("returns independent copies of local repository binding metadata", () => {
    const registry = new ProjectRegistryService(undefined, [{
      projectId: "daily-proof",
      repositoryPath: "C:/repo",
      worktreePath: "C:/worktree",
      branchName: "codex/102-local-project-repository-binding",
      specPath: "specs/102-local-project-repository-binding/spec.md",
    }]);

    const entry = registry.getProject("daily-proof");
    if (!entry?.localRepositoryBinding) throw new Error("expected bound daily-proof entry");
    entry.localRepositoryBinding.worktreePath = "C:/mutated";

    expect(registry.getProject("daily-proof")?.localRepositoryBinding?.worktreePath).toBe("C:/worktree");
  });

  it("seeds from a custom set of entries when provided", () => {
    const registry = new ProjectRegistryService([createEntry({ id: "solo-project", displayName: "Solo Project" })]);

    expect(registry.getAllProjects().map((entry) => entry.id)).toEqual(["solo-project"]);
  });
});

function createEntry(overrides: Partial<ProjectRegistryEntry> & { id: string; displayName: string }): ProjectRegistryEntry {
  return {
    id: overrides.id,
    displayName: overrides.displayName,
    shortDescription: overrides.shortDescription ?? "A future registered project with no remote repository yet.",
    lifecycleStatus: overrides.lifecycleStatus ?? "Planned",
    projectType: overrides.projectType ?? "Restaurant",
    localRepository: overrides.localRepository ?? { connected: false, label: "Not connected" },
    localRepositoryBinding: overrides.localRepositoryBinding,
    remoteRepository: overrides.remoteRepository,
    repositoryIdentity: overrides.repositoryIdentity ?? { provider: "local", connectionState: "Unknown" },
    owner: overrides.owner ?? { companyName: "AIverse Internal" },
    createdAt: overrides.createdAt ?? "2026-07-27T00:00:00.000Z",
    lastActivityAt: overrides.lastActivityAt ?? "2026-07-27T00:00:00.000Z",
  };
}
