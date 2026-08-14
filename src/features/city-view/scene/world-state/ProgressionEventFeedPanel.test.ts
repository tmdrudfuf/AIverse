import { describe, expect, it } from "vitest";
import type { WorldEventFeedState } from "./WorldStateTypes";
import { createProgressionEventFeedPanelRows } from "./ProgressionEventFeedPanel";

describe("ProgressionEventFeedPanel", () => {
  it("formats progression feed events for compact city display", () => {
    const [row] = createProgressionEventFeedPanelRows([createFeedEvent(2)]);

    expect(row).toEqual({
      id: "company-level-2-reached:world-effect:reward:feed-event",
      title: "Level 2 reached: Early Stage",
      detail: "Zones: Entrance, Workspace; 2 milestones",
    });
  });

  it("returns no rows for empty feed events", () => {
    expect(createProgressionEventFeedPanelRows([])).toEqual([]);
  });

  it("bounds visible rows to the latest three feed events in feed order", () => {
    const rows = createProgressionEventFeedPanelRows([
      createFeedEvent(2),
      createFeedEvent(3),
      createFeedEvent(4),
      createFeedEvent(5),
    ]);

    expect(rows.map((row) => row.title)).toEqual([
      "Level 3 reached: Growth Stage",
      "Level 4 reached: Expansion Stage",
      "Level 5 reached: Early Stage",
    ]);
  });

  it("summarizes long unlocked-zone lists without mutating source events", () => {
    const event = createFeedEvent(3, {
      unlockedOfficeZones: ["entrance", "workspace", "reception", "focus-room"],
      milestoneIds: ["complete-first-client-project", "hire-five-employees", "ship-two-releases"],
    });

    const [row] = createProgressionEventFeedPanelRows([event]);
    row.detail = "mutated";

    expect(event.unlockedOfficeZones).toEqual(["entrance", "workspace", "reception", "focus-room"]);
    expect(event.milestoneIds).toEqual(["complete-first-client-project", "hire-five-employees", "ship-two-releases"]);
    expect(createProgressionEventFeedPanelRows([event])[0]?.detail).toBe("Zones: Entrance, Workspace +2 more; 3 milestones");
  });
});

function createFeedEvent(toLevel: number, overrides: Partial<WorldEventFeedState> = {}): WorldEventFeedState {
  return {
    eventId: `company-level-${toLevel}-reached:world-effect:reward:feed-event`,
    eventType: "company_progression_feed_event",
    source: "company_progression",
    rewardId: `company-level-${toLevel}-reached:world-effect:reward`,
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
