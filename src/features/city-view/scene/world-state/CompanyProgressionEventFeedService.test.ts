import { describe, expect, it } from "vitest";
import { CompanyProgressionEventFeedService } from "./CompanyProgressionEventFeedService";
import type { CompanyProgressionReward } from "./WorldStateTypes";

describe("CompanyProgressionEventFeedService", () => {
  it("creates a copied feed event from a company progression reward", () => {
    const reward = createReward(2);
    const [event] = new CompanyProgressionEventFeedService().createEvents({ rewards: [reward] });

    expect(event).toEqual({
      eventId: "company-level-2-reached:world-effect:reward:feed-event",
      eventType: "company_progression_feed_event",
      source: "company_progression",
      rewardId: "company-level-2-reached:world-effect:reward",
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

    reward.unlockedOfficeZones[0] = "storage";
    reward.milestoneIds[0] = "mutated";

    expect(event.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(event.milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees"]);
  });

  it("preserves reward order when creating multiple feed events", () => {
    const events = new CompanyProgressionEventFeedService().createEvents({
      rewards: [createReward(2), createReward(3), createReward(4)],
    });

    expect(events.map((event) => event.toLevel)).toEqual([2, 3, 4]);
    expect(events.map((event) => event.eventId)).toEqual([
      "company-level-2-reached:world-effect:reward:feed-event",
      "company-level-3-reached:world-effect:reward:feed-event",
      "company-level-4-reached:world-effect:reward:feed-event",
    ]);
  });
});

function createReward(toLevel: number): CompanyProgressionReward {
  return {
    rewardId: `company-level-${toLevel}-reached:world-effect:reward`,
    rewardType: "company_progression_reward_granted",
    source: "company_progression",
    effectId: `company-level-${toLevel}-reached:world-effect`,
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
