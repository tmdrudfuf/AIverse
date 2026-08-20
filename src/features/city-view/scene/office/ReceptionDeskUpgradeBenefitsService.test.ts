import { describe, expect, it } from "vitest";

import { ReceptionDeskUpgradeBenefitsService } from "./ReceptionDeskUpgradeBenefitsService";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";

describe("ReceptionDeskUpgradeBenefitsService", () => {
  it("does not create benefits before reception is unlocked", () => {
    const service = new ReceptionDeskUpgradeBenefitsService();

    expect(service.createBenefits(createProgression({ companyLevel: 1, unlockedOfficeZones: ["entrance", "workspace"] }))).toBeUndefined();
    expect(service.createBenefits(createProgression({ companyLevel: 2, unlockedOfficeZones: ["entrance", "workspace"] }))).toBeUndefined();
  });

  it("creates passive reception benefits from level 2 progression", () => {
    const service = new ReceptionDeskUpgradeBenefitsService();

    const benefits = service.createBenefits(createProgression({
      companyLevel: 2,
      unlockedOfficeZones: ["entrance", "workspace", "reception"],
      maxEmployees: 10,
    }));

    expect(benefits).toEqual({
      source: "reception_desk_upgrade",
      level: 2,
      heading: "Reception Upgrade Benefits",
      summary: "Level 2 reception is active for this workspace.",
      benefits: [
        "Reception area unlocked",
        "Employee capacity increased to 10",
        "Workspace coordination now has a front-desk entry point",
      ],
    });
  });
});

function createProgression(overrides: Partial<CompanyProgressionSnapshot> = {}): CompanyProgressionSnapshot {
  return {
    companyLevel: 1,
    companyStage: "garageStartup",
    unlockedOfficeZones: ["entrance", "workspace"],
    maxEmployees: 5,
    requiredMilestones: [],
    layoutId: "garage-startup-level-1",
    floorCount: 1,
    ...overrides,
  };
}
