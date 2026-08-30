import { describe, expect, it } from "vitest";

import type { CityBuildingDefinition } from "../../buildings/buildingTypes";
import type { ProjectRegistryEntry } from "../project-registry/ProjectRegistryTypes";
import { ProjectCompanyBindingService } from "./ProjectCompanyBindingService";

describe("ProjectCompanyBindingService", () => {
  it("resolves a company to its registered project identity", () => {
    const context = new ProjectCompanyBindingService().resolveBuildingBinding(
      building({ id: "alpha-tower", name: "ALPHA TOWER", projectId: "alpha" }),
      [project({ id: "alpha", displayName: "Alpha Tools", companyName: "Alpha Software Inc." })],
    );

    expect(context).toMatchObject({
      projectId: "alpha",
      displayName: "Alpha Tools",
      companyName: "Alpha Software Inc.",
      status: "bound",
      binding: {
        bindingId: "alpha-tower",
        buildingId: "alpha-tower",
        projectId: "alpha",
        companyName: "Alpha Software Inc.",
      },
      localRepositoryBinding: {
        projectId: "alpha",
        repositoryPath: "C:/projects/alpha",
        worktreePath: "C:/projects/alpha-worktree",
      },
    });
  });

  it("keeps project identity stable across repeated resolution", () => {
    const service = new ProjectCompanyBindingService();
    const inputBuilding = building({ id: "alpha-tower", projectId: "alpha" });
    const projects = [project({ id: "alpha" })];

    const first = service.resolveBuildingBinding(inputBuilding, projects);
    const second = service.resolveBuildingBinding(inputBuilding, projects);

    expect(first.binding).toEqual(second.binding);
    expect(first.projectId).toBe("alpha");
  });

  it("returns unavailable when a persisted binding points to a missing project", () => {
    const context = new ProjectCompanyBindingService().resolveBuildingBinding(
      building({ id: "missing-tower", name: "MISSING TOWER", projectId: "missing-project" }),
      [project({ id: "daily-proof", companyName: "Daily Proof Inc." })],
    );

    expect(context).toMatchObject({
      projectId: "missing-project",
      displayName: "MISSING TOWER",
      companyName: "MISSING TOWER",
      status: "unavailable",
      unavailableReason: "MissingProject",
    });
    expect(context.project?.id).toBeUndefined();
  });

  it("marks connected projects without any local path metadata unavailable without substituting another project", () => {
    const context = new ProjectCompanyBindingService().resolveBuildingBinding(
      building({ id: "stale-tower", name: "STALE TOWER", projectId: "stale-project" }),
      [
        project({ id: "daily-proof", companyName: "Daily Proof Inc." }),
        project({
          id: "stale-project",
          displayName: "Stale Project",
          companyName: "Stale Project Inc.",
          noLocalMetadata: true,
        }),
      ],
    );

    expect(context).toMatchObject({
      projectId: "stale-project",
      companyName: "Stale Project Inc.",
      status: "unavailable",
      unavailableReason: "MissingLocalPath",
    });
    expect(context.project?.id).toBe("stale-project");
  });

  it("creates bindings for registered project companies without a second registry", () => {
    const bindings = new ProjectCompanyBindingService().createBindings(
      [
        building({ id: "alpha-tower", projectId: "alpha" }),
        building({ id: "beta-tower", projectId: "beta" }),
      ],
      [
        project({ id: "alpha", companyName: "Alpha Inc." }),
        project({ id: "beta", companyName: "Beta Inc." }),
      ],
    );

    expect(bindings.map((binding) => [binding.buildingId, binding.projectId, binding.companyName])).toEqual([
      ["alpha-tower", "alpha", "Alpha Inc."],
      ["beta-tower", "beta", "Beta Inc."],
    ]);
  });

  it("creates a stable binding for a registered project even before a city building exists", () => {
    const bindings = new ProjectCompanyBindingService().createBindings(
      [building({ id: "alpha-tower", projectId: "alpha" })],
      [
        project({ id: "alpha", companyName: "Alpha Inc." }),
        project({ id: "registered-crm", companyName: "Registered CRM Inc." }),
      ],
    );

    expect(bindings.find((binding) => binding.projectId === "registered-crm")).toMatchObject({
      bindingId: "project:registered-crm",
      buildingId: "project:registered-crm",
      projectId: "registered-crm",
      companyName: "Registered CRM Inc.",
      status: "bound",
    });
  });
});

function building(input: { id: string; name?: string; projectId?: string }): CityBuildingDefinition {
  return {
    id: input.id,
    name: input.name ?? input.id.toUpperCase(),
    type: "company",
    worldPosition: { x: 0, y: 0 },
    size: { width: 1, height: 1 },
    interactionZone: { x: 0, y: 0, width: 1, height: 1 },
    entrancePoint: { x: 0, y: 0 },
    destination: { sceneKey: "office-daily-proof", enabled: true },
    ...(input.projectId ? { projectBinding: { projectId: input.projectId, bindingId: input.id } } : {}),
    active: true,
    visual: { wall: 0, roof: 0, accent: 0 },
  };
}

function project(input: {
  id: string;
  displayName?: string;
  companyName?: string;
  localPath?: string;
  localRepositoryBinding?: ProjectRegistryEntry["localRepositoryBinding"];
  noLocalMetadata?: boolean;
}): ProjectRegistryEntry {
  const repositoryPath = input.localPath ?? `C:/projects/${input.id}`;
  return {
    id: input.id,
    displayName: input.displayName ?? input.id,
    shortDescription: "Registered project",
    lifecycleStatus: "Active",
    projectType: "Company",
    localRepository: {
      connected: true,
      label: "Connected (local)",
    },
    repositoryIdentity: {
      provider: "local",
      localPath: input.noLocalMetadata ? undefined : repositoryPath,
      connectionState: "Configured",
    },
    localRepositoryBinding: input.noLocalMetadata
      ? undefined
      : input.localRepositoryBinding === undefined
      ? {
        projectId: input.id,
        repositoryPath,
        worktreePath: `${repositoryPath}-worktree`,
      }
      : input.localRepositoryBinding,
    owner: {
      companyName: input.companyName ?? `${input.id} Inc.`,
    },
    createdAt: "2026-08-29T00:00:00.000Z",
    lastActivityAt: "2026-08-29T00:00:00.000Z",
  };
}
