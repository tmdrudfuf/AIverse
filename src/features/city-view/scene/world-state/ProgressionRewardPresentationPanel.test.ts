import { describe, expect, it } from "vitest";
import { createProgressionRewardPresentationRows } from "./ProgressionRewardPresentationPanel";
import type { WorldRewardState } from "./WorldStateTypes";

describe("ProgressionRewardPresentationPanel", () => {
  it("formats progression rewards for compact city display", () => {
    const [row] = createProgressionRewardPresentationRows([createReward(2)]);

    expect(row).toEqual({
      id: "company-level-2-reached:world-effect:reward",
      title: "Reward Level 2: Early Stage",
      detail: "10 employee capacity; 2 floors; Zones: Entrance, Workspace",
    });
  });

  it("returns no rows for empty rewards", () => {
    expect(createProgressionRewardPresentationRows([])).toEqual([]);
  });

  it("bounds visible rows to the latest three rewards in reward order", () => {
    const rows = createProgressionRewardPresentationRows([
      createReward(2),
      createReward(3),
      createReward(4),
      createReward(5),
    ]);

    expect(rows.map((row) => row.title)).toEqual([
      "Reward Level 3: Growth Stage",
      "Reward Level 4: Expansion Stage",
      "Reward Level 5: Early Stage",
    ]);
  });

  it("summarizes long unlocked-zone lists without mutating source rewards", () => {
    const reward = createReward(3, {
      unlockedOfficeZones: ["entrance", "workspace", "reception", "focus-room"],
      milestoneIds: ["complete-first-client-project", "hire-five-employees", "ship-two-releases"],
    });

    const [row] = createProgressionRewardPresentationRows([reward]);
    row.detail = "mutated";

    expect(reward.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception", "focus-room"]);
    expect(reward.milestoneIds).toEqual([
      "complete-first-client-project",
      "hire-five-employees",
      "ship-two-releases",
    ]);
    expect(createProgressionRewardPresentationRows([reward])[0]?.detail).toBe(
      "15 employee capacity; 3 floors; Zones: Entrance, Workspace +2 more",
    );
  });
});

function createReward(toLevel: number, overrides: Partial<WorldRewardState> = {}): WorldRewardState {
  return {
    rewardId: `company-level-${toLevel}-reached:world-effect:reward`,
    rewardType: "company_progression_reward_granted",
    source: "company_progression",
    effectId: `company-level-${toLevel}-reached:world-effect`,
    triggerId: `company-level-${toLevel}-reached`,
    fromLevel: toLevel - 1,
    toLevel,
    companyStage: getStage(toLevel),
    layoutId: `layout-${toLevel}`,
    floorCount: toLevel,
    maxEmployees: toLevel * 5,
    unlockedOfficeZones: ["entrance", "workspace"],
    milestoneIds: ["complete-first-client-project", "hire-five-employees"],
    ...overrides,
  };
}

function getStage(toLevel: number) {
  if (toLevel === 3) return "growth_stage";
  if (toLevel === 4) return "expansion_stage";
  return "early-stage";
}
