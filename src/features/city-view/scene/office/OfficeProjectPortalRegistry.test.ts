import { describe, expect, it } from "vitest";

import {
  EXTERNAL_PROJECT_DRAFT_ID,
  applyExternalProjectDraftRepositoryIdentityChoiceToState,
  addExternalProjectDraftToState,
  createProjectPortalState,
} from "./OfficeProjectPortalRegistry";

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

  it("adds one external project draft and derives a portal row without repository mapping", () => {
    const state = createProjectPortalState();

    addExternalProjectDraftToState(state);
    addExternalProjectDraftToState(state);

    expect(state.projectRegistryEntries.filter((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(state.projects.filter((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toHaveLength(1);
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      name: "External Project Draft",
      status: "Planned",
      type: "External",
      enabled: false,
      description: "Draft external project awaiting repository details.",
      ownerCompany: "AIverse External",
      localRepositoryLabel: "Not connected",
      repositoryIdentity: {
        provider: "local",
        connectionState: "Unknown",
      },
    });
    expect(state.repositoryMappings.some((mapping) => mapping.projectId === EXTERNAL_PROJECT_DRAFT_ID)).toBe(false);
    expect(state.selectedProjectId).toBe(EXTERNAL_PROJECT_DRAFT_ID);
  });

  it("applies and clears external draft repository identity choices through derived portal state", () => {
    const state = createProjectPortalState();

    addExternalProjectDraftToState(state);

    expect(applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree")).toBe(true);
    expect(state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      localRepository: {
        connected: true,
        label: "Bound (local)",
      },
      localRepositoryBinding: {
        projectId: EXTERNAL_PROJECT_DRAFT_ID,
        worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-external-project-repository-identity-edit-overlay",
        branchName: "codex/126-external-project-repository-identity-edit-overlay",
      },
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
    expect(state.repositoryMappings.some((mapping) => mapping.projectId === EXTERNAL_PROJECT_DRAFT_ID)).toBe(false);

    expect(applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-unknown")).toBe(true);
    const resetEntry = state.projectRegistryEntries.find((entry) => entry.id === EXTERNAL_PROJECT_DRAFT_ID);
    expect(resetEntry).toMatchObject({
      localRepository: {
        connected: false,
        label: "Not connected",
      },
      repositoryIdentity: {
        provider: "local",
        connectionState: "Unknown",
      },
    });
    expect(resetEntry?.localRepositoryBinding).toBeUndefined();
    expect(resetEntry?.remoteRepository).toBeUndefined();
    expect(state.repositoryMappings.some((mapping) => mapping.projectId === EXTERNAL_PROJECT_DRAFT_ID)).toBe(false);
  });

  it("applies external draft repository identity without changing the current project-list selection", () => {
    const state = createProjectPortalState();

    addExternalProjectDraftToState(state);
    state.selectedProjectIndex = 0;
    state.selectedProjectId = "daily-proof";

    expect(applyExternalProjectDraftRepositoryIdentityChoiceToState(state, "local-aiverse-worktree")).toBe(true);

    expect(state.selectedProjectIndex).toBe(0);
    expect(state.selectedProjectId).toBe("daily-proof");
    expect(state.projects.find((project) => project.id === EXTERNAL_PROJECT_DRAFT_ID)).toMatchObject({
      localRepositoryLabel: "Bound (local)",
      repositoryIdentity: {
        provider: "local",
        owner: "AIverse",
        name: "AIverse",
        connectionState: "Configured",
      },
    });
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
