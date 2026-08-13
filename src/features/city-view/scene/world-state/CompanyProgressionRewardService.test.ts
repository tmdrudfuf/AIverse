import { describe, expect, it } from "vitest";
import { CompanyProgressionRewardService } from "./CompanyProgressionRewardService";
import type { CompanyProgressionWorldEffect } from "./WorldStateTypes";

describe("CompanyProgressionRewardService", () => {
  it("creates a copied reward from a company progression world effect", () => {
    const effect = createWorldEffect(2);
    const [reward] = new CompanyProgressionRewardService().createRewards({ effects: [effect] });

    expect(reward).toEqual({
      rewardId: "company-level-2-reached:world-effect:reward",
      rewardType: "company_progression_reward_granted",
      source: "company_progression",
      effectId: "company-level-2-reached:world-effect",
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

    effect.unlockedOfficeZones[0] = "storage";
    effect.milestoneIds[0] = "mutated";

    expect(reward.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(reward.milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees"]);
  });

  it("preserves effect order when creating multiple rewards", () => {
    const rewards = new CompanyProgressionRewardService().createRewards({
      effects: [createWorldEffect(2), createWorldEffect(3), createWorldEffect(4)],
    });

    expect(rewards.map((reward) => reward.toLevel)).toEqual([2, 3, 4]);
    expect(rewards.map((reward) => reward.rewardId)).toEqual([
      "company-level-2-reached:world-effect:reward",
      "company-level-3-reached:world-effect:reward",
      "company-level-4-reached:world-effect:reward",
    ]);
  });
});

function createWorldEffect(toLevel: number): CompanyProgressionWorldEffect {
  return {
    effectId: `company-level-${toLevel}-reached:world-effect`,
    effectType: "company_progression_level_reached",
    source: "company_progression",
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 4 ? "headquarters" : toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 4 ? "headquarters-level-4" : toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: toLevel >= 4 ? 3 : 1,
    maxEmployees: toLevel >= 4 ? 32 : toLevel >= 3 ? 18 : 10,
    unlockedOfficeZones: ["entrance", "workspace", "reception"],
    milestoneIds: ["complete-first-client-project", "hire-five-employees"],
  };
}
