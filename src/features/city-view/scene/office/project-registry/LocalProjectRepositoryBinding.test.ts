import { describe, expect, it } from "vitest";

import { applyLocalProjectRepositoryBindings } from "./LocalProjectRepositoryBinding";
import { createDefaultProjectRegistryEntries } from "./ProjectRegistrySeedData";

const DAILY_PROOF_BINDING = {
  projectId: "daily-proof",
  repositoryPath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse",
  worktreePath: "C:/Users/tmdru/Desktop/Ky-Project/AIverse-local-project-repository-binding",
  branchName: "codex/102-local-project-repository-binding",
  specPath: "specs/102-local-project-repository-binding/spec.md",
  source: "ados-handoff",
  boundAt: "2026-08-15T00:00:00.000Z",
};

describe("applyLocalProjectRepositoryBindings", () => {
  it("binds configured local repository metadata without changing remote identity", () => {
    const [dailyProof] = createDefaultProjectRegistryEntries();

    const application = applyLocalProjectRepositoryBindings([dailyProof], [DAILY_PROOF_BINDING]);

    expect(application.results).toEqual([{ projectId: "daily-proof", status: "Bound", binding: DAILY_PROOF_BINDING }]);
    expect(application.entries[0]).toMatchObject({
      id: "daily-proof",
      localRepository: { connected: true, label: "Bound (local)" },
      localRepositoryBinding: DAILY_PROOF_BINDING,
      repositoryIdentity: {
        provider: "github",
        owner: "ai-verse",
        name: "daily-proof",
        url: "https://github.com/ai-verse/daily-proof",
        defaultBranch: "main",
        localPath: DAILY_PROOF_BINDING.worktreePath,
        connectionState: "Configured",
      },
    });
  });

  it("falls back between repositoryPath and worktreePath when one path is omitted", () => {
    const [, portfolio] = createDefaultProjectRegistryEntries();

    const application = applyLocalProjectRepositoryBindings([portfolio], [{
      projectId: "portfolio",
      worktreePath: "C:/worktrees/portfolio",
    }]);

    expect(application.results[0]).toEqual({
      projectId: "portfolio",
      status: "Bound",
      binding: {
        projectId: "portfolio",
        repositoryPath: "C:/worktrees/portfolio",
        worktreePath: "C:/worktrees/portfolio",
      },
    });
  });

  it("rejects unknown projects and missing local paths without changing entries", () => {
    const entries = createDefaultProjectRegistryEntries();

    const application = applyLocalProjectRepositoryBindings(entries, [
      { projectId: "unknown", worktreePath: "C:/repo" },
      { projectId: "daily-proof", repositoryPath: " ", worktreePath: "" },
    ]);

    expect(application.results).toEqual([
      { projectId: "unknown", status: "Rejected", reason: "UnknownProject" },
      { projectId: "daily-proof", status: "Rejected", reason: "MissingLocalPath" },
    ]);
    expect(application.entries).toEqual(entries);
  });

  it("returns copied entries and copied binding metadata", () => {
    const entries = createDefaultProjectRegistryEntries();

    const application = applyLocalProjectRepositoryBindings(entries, [DAILY_PROOF_BINDING]);
    application.entries[0].localRepositoryBinding!.worktreePath = "C:/mutated";

    expect(entries[0].localRepositoryBinding).toBeUndefined();
    expect(application.results[0]).toEqual({ projectId: "daily-proof", status: "Bound", binding: DAILY_PROOF_BINDING });
  });
});
