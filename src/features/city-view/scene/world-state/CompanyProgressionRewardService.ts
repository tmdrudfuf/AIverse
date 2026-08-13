import type { CompanyProgressionReward, CompanyProgressionWorldEffect } from "./WorldStateTypes";
import { copyCompanyProgressionReward } from "./WorldStateTypes";

export type CompanyProgressionRewardInput = {
  effects: ReadonlyArray<CompanyProgressionWorldEffect>;
};

export class CompanyProgressionRewardService {
  createRewards(input: CompanyProgressionRewardInput): CompanyProgressionReward[] {
    return input.effects.map(createCompanyProgressionReward).map(copyCompanyProgressionReward);
  }
}

function createCompanyProgressionReward(effect: CompanyProgressionWorldEffect): CompanyProgressionReward {
  return {
    rewardId: `${effect.effectId}:reward`,
    rewardType: "company_progression_reward_granted",
    source: "company_progression",
    effectId: effect.effectId,
    triggerId: effect.triggerId,
    fromLevel: effect.fromLevel,
    toLevel: effect.toLevel,
    companyStage: effect.companyStage,
    layoutId: effect.layoutId,
    floorCount: effect.floorCount,
    maxEmployees: effect.maxEmployees,
    unlockedOfficeZones: [...effect.unlockedOfficeZones],
    milestoneIds: [...effect.milestoneIds],
  };
}
