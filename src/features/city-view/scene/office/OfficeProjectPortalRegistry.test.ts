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
      localRepositoryLabel: "Connected (local)",
    });
  });

  it("marks Portfolio and AI Lab as internal placeholders with no remote repository", () => {
    const state = createProjectPortalState();
    const portfolio = state.projects.find((project) => project.id === "portfolio");
    const aiLab = state.projects.find((project) => project.id === "ai-lab");

    expect(portfolio).toMatchObject({ enabled: false, ownerCompany: "AIverse Internal", localRepositoryLabel: "Not connected" });
    expect(aiLab).toMatchObject({ enabled: false, ownerCompany: "AIverse Internal", localRepositoryLabel: "Not connected" });
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

  it("returns independent state on every call", () => {
    const first = createProjectPortalState();
    const second = createProjectPortalState();

    first.projects[0].name = "Mutated";
    first.repositoryMappings[0].repository.owner = "mutated";

    expect(second.projects[0].name).toBe("Daily Proof");
    expect(second.repositoryMappings[0].repository.owner).toBe("ai-verse");
  });
});
