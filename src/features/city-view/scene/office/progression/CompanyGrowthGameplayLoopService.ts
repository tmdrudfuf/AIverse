import { CompanyProgressionEventFeedService } from "../../world-state/CompanyProgressionEventFeedService";
import { CompanyProgressionRewardService } from "../../world-state/CompanyProgressionRewardService";
import { CompanyProgressionWorldEffectService } from "../../world-state/CompanyProgressionWorldEffectService";
import {
  copyCompanyProgressionReward,
  copyWorldEventFeedState,
  copyWorldEffectState,
  type WorldEffectState,
  type WorldEventFeedState,
  type WorldRewardState,
} from "../../world-state/WorldStateTypes";
import type { CompanyProgressionTrigger } from "./CompanyProgressionTypes";

export type CompanyGrowthGameplayLoopInput = {
  triggers: ReadonlyArray<CompanyProgressionTrigger>;
};

export type CompanyGrowthGameplayLoopResult = {
  triggers: CompanyProgressionTrigger[];
  effects: WorldEffectState[];
  rewards: WorldRewardState[];
  eventFeed: WorldEventFeedState[];
};

export class CompanyGrowthGameplayLoopService {
  private readonly worldEffectService = new CompanyProgressionWorldEffectService();
  private readonly rewardService = new CompanyProgressionRewardService();
  private readonly eventFeedService = new CompanyProgressionEventFeedService();

  createLoopResult(input: CompanyGrowthGameplayLoopInput): CompanyGrowthGameplayLoopResult {
    const triggers = input.triggers.map(copyCompanyProgressionTrigger);
    const effects = this.worldEffectService.createEffects({ triggers }).map(copyWorldEffectState);
    const rewards = this.rewardService.createRewards({ effects }).map(copyCompanyProgressionReward);
    const eventFeed = this.eventFeedService.createEvents({ rewards }).map(copyWorldEventFeedState);

    return {
      triggers,
      effects,
      rewards,
      eventFeed,
    };
  }
}

export function copyCompanyGrowthGameplayLoopResult(
  result: CompanyGrowthGameplayLoopResult,
): CompanyGrowthGameplayLoopResult {
  return {
    triggers: result.triggers.map(copyCompanyProgressionTrigger),
    effects: result.effects.map(copyWorldEffectState),
    rewards: result.rewards.map(copyCompanyProgressionReward),
    eventFeed: result.eventFeed.map(copyWorldEventFeedState),
  };
}

export function copyCompanyProgressionTrigger(trigger: CompanyProgressionTrigger): CompanyProgressionTrigger {
  return {
    ...trigger,
    unlockedOfficeZones: [...trigger.unlockedOfficeZones],
    milestones: trigger.milestones.map((milestone) => ({ ...milestone })),
  };
}
