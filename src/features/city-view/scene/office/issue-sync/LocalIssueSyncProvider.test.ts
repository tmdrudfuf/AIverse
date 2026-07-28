import { describe, expect, it } from "vitest";

import type { ProjectRegistryRepositoryIdentity } from "../project-registry/ProjectRegistryTypes";
import { LocalIssueSyncProvider } from "./LocalIssueSyncProvider";

describe("LocalIssueSyncProvider", () => {
  it("always resolves an Unavailable, empty collection with a non-empty, display-safe reason", async () => {
    const provider = new LocalIssueSyncProvider();
    const identity: ProjectRegistryRepositoryIdentity = { provider: "local", connectionState: "Unknown" };

    const collection = await provider.readIssueSnapshots(identity);

    expect(collection.syncStatus).toBe("Unavailable");
    expect(collection.issues).toEqual([]);
    expect(collection.openCount).toBe(0);
    expect(collection.closedCount).toBe(0);
    expect(collection.errorSummary).toBeTruthy();
  });

  it("never claims Succeeded, regardless of a fully-populated identity", async () => {
    const provider = new LocalIssueSyncProvider();
    const identity: ProjectRegistryRepositoryIdentity = {
      provider: "local",
      owner: "someone",
      name: "some-repo",
      defaultBranch: "main",
      connectionState: "Configured",
    };

    const collection = await provider.readIssueSnapshots(identity);

    expect(collection.syncStatus).not.toBe("Succeeded");
  });
});
