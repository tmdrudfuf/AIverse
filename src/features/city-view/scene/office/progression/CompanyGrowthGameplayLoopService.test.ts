import { describe, expect, it } from "vitest";
import { CompanyGrowthGameplayLoopService } from "./CompanyGrowthGameplayLoopService";
import type { CompanyProgressionTrigger } from "./CompanyProgressionTypes";

describe("CompanyGrowthGameplayLoopService", () => {
  it("creates a copied growth loop result from one company progression trigger", () => {
    const service = new CompanyGrowthGameplayLoopService();
    const trigger = createTrigger(2);

    const result = service.createLoopResult({ triggers: [trigger] });

    expect(result.triggers).toHaveLength(1);
    expect(result.effects).toHaveLength(1);
    expect(result.rewards).toHaveLength(1);
    expect(result.eventFeed).toHaveLength(1);
    expect(result.effects[0]).toMatchObject({
      effectId: "company-level-2-reached:world-effect",
      triggerId: "company-level-2-reached",
      toLevel: 2,
    });
    expect(result.rewards[0]).toMatchObject({
      rewardId: "company-level-2-reached:world-effect:reward",
      effectId: result.effects[0].effectId,
      triggerId: trigger.triggerId,
    });
    expect(result.eventFeed[0]).toMatchObject({
      eventId: "company-level-2-reached:world-effect:reward:feed-event",
      rewardId: result.rewards[0].rewardId,
      effectId: result.effects[0].effectId,
      triggerId: trigger.triggerId,
    });

    result.triggers[0].unlockedOfficeZones[0] = "storage";
    result.triggers[0].milestones[0].milestoneId = "mutated";
    result.effects[0].unlockedOfficeZones[0] = "storage";
    result.rewards[0].milestoneIds[0] = "mutated";
    result.eventFeed[0].milestoneIds[0] = "mutated";

    expect(trigger.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception"]);
    expect(trigger.milestones[0].milestoneId).toBe("complete-first-client-project");
    expect(service.createLoopResult({ triggers: [trigger] }).effects[0].unlockedOfficeZones).toEqual([
      "entrance",
      "workspace",
      "reception",
    ]);
  });

  it("returns empty arrays when no progression triggers are present", () => {
    const result = new CompanyGrowthGameplayLoopService().createLoopResult({ triggers: [] });

    expect(result).toEqual({
      triggers: [],
      effects: [],
      rewards: [],
      eventFeed: [],
    });
  });

  it("preserves multiple level-up triggers in order", () => {
    const result = new CompanyGrowthGameplayLoopService().createLoopResult({
      triggers: [createTrigger(2), createTrigger(3)],
    });

    expect(result.triggers.map((trigger) => trigger.toLevel)).toEqual([2, 3]);
    expect(result.effects.map((effect) => effect.toLevel)).toEqual([2, 3]);
    expect(result.rewards.map((reward) => reward.toLevel)).toEqual([2, 3]);
    expect(result.eventFeed.map((event) => event.toLevel)).toEqual([2, 3]);
  });
});

function createTrigger(toLevel: number): CompanyProgressionTrigger {
  return {
    triggerId: `company-level-${toLevel}-reached`,
    triggerType: "company_level_reached",
    source: "company_progression",
    fromLevel: 1,
    toLevel,
    companyStage: toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: toLevel >= 3 ? "growing-company-level-3" : "small-office-level-2",
    floorCount: 1,
    maxEmployees: toLevel >= 3 ? 18 : 10,
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
    ],
  };
}
