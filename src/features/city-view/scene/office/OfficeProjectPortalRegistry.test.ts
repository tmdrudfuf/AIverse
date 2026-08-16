import { describe, expect, it } from "vitest";

import { createProjectPortalState } from "./OfficeProjectPortalRegistry";

describe("createProjectPortalState", () => {
  it("derives all three projects from the project registry, in order", () => {
    const state = createProjectPortalState();

    expect(state.projects.map((project) => project.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(state.projectRegistryEntries.map((entry) => entry.id)).toEqual(["daily-proof", "portfolio", "ai-lab"]);
    expect(state.selectedProjectId).toBe("daily-proof");
  });

  it("carries Daily Proof's owner and repository info onto its portal project", () => {
    const state = createProjectPortalState();
    const dailyProof = state.projects.find((project) => project.id === "daily-proof");

    expect(dailyProof).toMatchObject({
      status: "Active",
      enabled: true,
      ownerCompany: "Daily Proof Inc.",
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        url: "https://github.com/ai-verse/daily-proof",
        defaultBranch: "main",
        connectionState: "Configured",
        localPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context",
      },
    });
    expect(dailyProof?.localRepositoryBinding).toEqual({
      projectId: "daily-proof",
      repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context",
      branchName: "codex/103-daily-proof-configured-runtime-repository-context",
      specPath: "specs/103-daily-proof-configured-runtime-repository-context/spec.md",
      source: "ados-handoff",
      boundAt: "2026-08-15T00:00:00.000Z",
    });
  });

  it("marks Portfolio and AI Lab as internal placeholders with no remote repository", () => {
    const state = createProjectPortalState();
    const portfolio = state.projects.find((project) => project.id === "portfolio");
    const aiLab = state.projects.find((project) => project.id === "ai-lab");

    expect(portfolio).toMatchObject({
      enabled: false,
      ownerCompany: "AIverse Internal",
      localRepositoryLabel: "Not connected",
      repositoryIdentity: { provider: "local", connectionState: "Unknown" },
    });
    expect(aiLab).toMatchObject({
      enabled: false,
      ownerCompany: "AIverse Internal",
      localRepositoryLabel: "Not connected",
      repositoryIdentity: { provider: "local", connectionState: "Unknown" },
    });
  });

  it("produces exactly one repository mapping, for daily-proof, matching today's known GitHub identity", () => {
    const state = createProjectPortalState();

    expect(state.repositoryMappings).toEqual([
      {
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
      },
    ]);
  });

  it("applies optional local repository bindings to registry entries and portal projects", () => {
    const binding = {
      projectId: "daily-proof",
      repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
      worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-local-project-repository-binding",
      branchName: "codex/102-local-project-repository-binding",
      specPath: "specs/102-local-project-repository-binding/spec.md",
      source: "ados-handoff",
      boundAt: "2026-08-15T00:00:00.000Z",
    };

    const state = createProjectPortalState({ localRepositoryBindings: [binding] });
    const registryEntry = state.projectRegistryEntries.find((entry) => entry.id === "daily-proof");
    const portalProject = state.projects.find((project) => project.id === "daily-proof");

    expect(registryEntry?.localRepositoryBinding).toEqual(binding);
    expect(registryEntry?.repositoryIdentity.localPath).toBe(binding.worktreePath);
    expect(portalProject?.localRepositoryLabel).toBe("Bound (local)");
    expect(portalProject?.localRepositoryBinding).toEqual(binding);
    expect(portalProject?.repositoryIdentity?.localPath).toBe(binding.worktreePath);
  });

  it("returns independent state on every call", () => {
    const first = createProjectPortalState();
    const second = createProjectPortalState();

    first.projects[0].name = "Mutated";
    first.repositoryMappings[0].repository.owner = "mutated";
    if (first.projects[0].repositoryIdentity) first.projects[0].repositoryIdentity.connectionState = "Available";

    expect(second.projects[0].name).toBe("Daily Proof");
    expect(second.repositoryMappings[0].repository.owner).toBe("ai-verse");
    expect(second.projects[0].repositoryIdentity?.connectionState).toBe("Configured");
    expect(second.projects[0].localRepositoryBinding?.worktreePath).toBe(
      "C:/Users/tmdru/Desktop/Ky-Project/AIverse-daily-proof-configured-runtime-repository-context",
    );
  });
});
