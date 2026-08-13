import { describe, expect, it } from "vitest";
import type { CompanyProgressionTrigger } from "../office/progression/CompanyProgressionTypes";
import { CompanyProgressionWorldEffectService } from "./CompanyProgressionWorldEffectService";

describe("CompanyProgressionWorldEffectService", () => {
  it("creates a copied world effect from a company progression trigger", () => {
    const trigger = createTrigger(2);
    const [effect] = new CompanyProgressionWorldEffectService().createEffects({ triggers: [trigger] });

    expect(effect).toEqual({
      effectId: "company-level-2-reached:world-effect",
      effectType: "company_progression_level_reached",
      source: "company_progression",
      triggerId: "company-level-2-reached",
      fromLevel: 1,
      toLevel: 2,
      companyStage: "smallOffice",
      layoutId: "small-office-level-2",
      floorCount: 1,
      maxEmployees: 10,
      unlockedOfficeZones: ["entrance", "workspace", "reception"],
      milestoneIds: ["complete-first-client-project", "hire-five-employees"],
    });

    trigger.unlockedOfficeZones[0] = "storage";
    trigger.milestones[0].milestoneId = "mutated";

    expect(effect.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(effect.milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees"]);
  });

  it("preserves trigger order when creating multiple effects", () => {
    const effects = new CompanyProgressionWorldEffectService().createEffects({
      triggers: [createTrigger(2), createTrigger(3), createTrigger(4)],
    });

    expect(effects.map((effect) => effect.toLevel)).toEqual([2, 3, 4]);
    expect(effects.map((effect) => effect.effectId)).toEqual([
      "company-level-2-reached:world-effect",
      "company-level-3-reached:world-effect",
      "company-level-4-reached:world-effect",
    ]);
  });
});

function createTrigger(toLevel: number): CompanyProgressionTrigger {
  return {
    triggerId: `company-level-${toLevel}-reached`,
    triggerType: "company_level_reached",
    source: "company_progression",
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 4 ? "headquarters" : toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 4 ? "headquarters-level-4" : toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: toLevel >= 4 ? 3 : 1,
    maxEmployees: toLevel >= 4 ? 32 : toLevel >= 3 ? 18 : 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestones: [
      {
        milestoneId: "complete-first-client-project",
        label: "Complete first client project",
        description: "Complete first client project to unlock the next office stage.",
        isMet: true,
        targetValue: 1,
        currentValue: 1,
      },
      {
        milestoneId: "hire-five-employees",
        label: "Hire five employees",
        description: "Hire five employees to unlock the next office stage.",
        isMet: true,
        targetValue: 5,
        currentValue: 5,
      },
    ],
  };
}
