import { describe, expect, it } from "vitest";

import { OfficeSpawnManager } from "./OfficeSpawnManager";

describe("OfficeSpawnManager", () => {
  it("resolves office identity from the bound registered project", () => {
    const resolution = new OfficeSpawnManager().resolveSpawn({
      buildingId: "daily-proof-inc",
      companyName: "DAILY PROOF INC.",
      projectId: "daily-proof",
      projectBindingId: "daily-proof-inc",
      officeSceneKey: "office-daily-proof",
      returnSceneKey: "city-world",
      returnPosition: { x: 1, y: 2 },
    });

    expect(resolution.office).toMatchObject({
      sceneKey: "office-daily-proof",
      buildingId: "daily-proof-inc",
      companyName: "Daily Proof Inc.",
    });
    expect(resolution.spawnRequest).toMatchObject({
      projectId: "daily-proof",
      projectBindingId: "daily-proof-inc",
      companyName: "Daily Proof Inc.",
    });
    expect(resolution.office.visualEnvironment?.details.find((detail) => detail.kind === "brand-sign")).toMatchObject({
      label: "Daily Proof Inc.",
    });
  });

  it("does not substitute Daily Proof when the requested bound project is missing", () => {
    const resolution = new OfficeSpawnManager().resolveSpawn({
      buildingId: "missing-building",
      companyName: "MISSING PROJECT",
      projectId: "missing-project",
      projectBindingId: "missing-building",
      officeSceneKey: "office-daily-proof",
      returnSceneKey: "city-world",
      returnPosition: { x: 1, y: 2 },
    });

    expect(resolution.office.companyName).toBe("MISSING PROJECT");
    expect(resolution.spawnRequest).toMatchObject({
      projectId: "missing-project",
      companyName: "MISSING PROJECT",
    });
  });
});
