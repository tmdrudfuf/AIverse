import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { LocalRepositorySyncProvider } from "./LocalRepositorySyncProvider";

describe("LocalRepositorySyncProvider", () => {
  it("always resolves an Unavailable snapshot with a non-empty, display-safe reason", async () => {
    const provider = new LocalRepositorySyncProvider();
    const identity: ProjectRegistryRepositoryIdentity = { provider: "local", connectionState: "Unknown" };

    const snapshot = await provider.readRepositorySnapshot(identity, { projectId: "portfolio" });

    expect(snapshot.syncStatus).toBe("Unavailable");
    expect(snapshot.availability).toBe("unavailable");
    expect(snapshot.errorSummary).toBeTruthy();
    expect(snapshot.errorSummary).not.toContain("Error:");
    expect(snapshot.errorSummary).not.toContain("at ");
  });

  it("never claims Succeeded, regardless of a fully-populated identity", async () => {
    const provider = new LocalRepositorySyncProvider();
    const identity: ProjectRegistryRepositoryIdentity = {
      provider: "local",
      owner: "someone",
      name: "some-repo",
      defaultBranch: "main",
      connectionState: "Configured",
    };

    const snapshot = await provider.readRepositorySnapshot(identity, { projectId: "some-project" });

    expect(snapshot.syncStatus).not.toBe("Succeeded");
  });
});
