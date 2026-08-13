import type { CompanyProgressionFeedEvent, CompanyProgressionReward } from "./WorldStateTypes";
import { copyWorldEventFeedState } from "./WorldStateTypes";

export type CompanyProgressionEventFeedInput = {
  rewards: ReadonlyArray<CompanyProgressionReward>;
};

export class CompanyProgressionEventFeedService {
  createEvents(input: CompanyProgressionEventFeedInput): CompanyProgressionFeedEvent[] {
    return input.rewards.map(createCompanyProgressionFeedEvent).map(copyWorldEventFeedState);
  }
}

function createCompanyProgressionFeedEvent(reward: CompanyProgressionReward): CompanyProgressionFeedEvent {
  return {
    eventId: `${reward.rewardId}:feed-event`,
    eventType: "company_progression_feed_event",
    source: "company_progression",
    rewardId: reward.rewardId,
    effectId: reward.effectId,
    triggerId: reward.triggerId,
    fromLevel: reward.fromLevel,
    toLevel: reward.toLevel,
    companyStage: reward.companyStage,
    layoutId: reward.layoutId,
    floorCount: reward.floorCount,
    maxEmployees: reward.maxEmployees,
    unlockedOfficeZones: [...reward.unlockedOfficeZones],
    milestoneIds: [...reward.milestoneIds],
  };
}
