import { describe, expect, it } from "vitest";

import { OfficeLevelUpReactionLayer, createOfficeLevelUpReactionViewModel } from "./OfficeLevelUpReactionLayer";
import type { CompanyProgressionTrigger } from "./progression/CompanyProgressionTypes";

describe("OfficeLevelUpReactionLayer", () => {
  it("formats a visible level-up reaction from a progression trigger", () => {
    const viewModel = createOfficeLevelUpReactionViewModel([createTrigger(2)]);

    expect(viewModel).toEqual({
      visible: true,
      headline: "Company level 2 reached",
      stageLabel: "Stage: Small Office",
      capacityLabel: "10 employee capacity",
      floorLabel: "1 office floor",
      zoneLabel: "7 zones unlocked",
    });
  });

  it("returns hidden empty labels when no level-up trigger is present", () => {
    expect(createOfficeLevelUpReactionViewModel()).toEqual({
      visible: false,
      headline: "",
      stageLabel: "",
      capacityLabel: "",
      floorLabel: "",
      zoneLabel: "",
    });
    expect(createOfficeLevelUpReactionViewModel([]).visible).toBe(false);
  });

  it("clears rendered reaction text when current triggers become empty", () => {
    const { scene, texts, graphics } = createSceneStub();
    const layer = new OfficeLevelUpReactionLayer(scene);

    layer.update([createTrigger(2)]);
    expect(texts[0].text).toBe("Company level 2 reached");
    expect(graphics.visible).toBe(true);

    layer.update([]);

    expect(graphics.visible).toBe(false);
    expect(texts.map((text) => text.text)).toEqual(["", "", "", "", ""]);
    expect(texts.every((text) => text.visible === false)).toBe(true);
  });

  it("shows the newest reached level when multiple triggers are present", () => {
    const viewModel = createOfficeLevelUpReactionViewModel([
      createTrigger(2),
      createTrigger(3, {
        companyStage: "growingCompany",
        maxEmployees: 18,
        floorCount: 2,
        unlockedOfficeZones: [
          "entrance",
          "workspace",
          "workstationArea",
          "meetingArea",
          "breakArea",
          "reception",
          "storage",
          "serverArea",
        ],
      }),
    ]);

    expect(viewModel.headline).toBe("Company level 3 reached");
    expect(viewModel.stageLabel).toBe("Stage: Growing Company");
    expect(viewModel.capacityLabel).toBe("18 employee capacity");
    expect(viewModel.floorLabel).toBe("2 office floors");
    expect(viewModel.zoneLabel).toBe("8 zones unlocked");
  });

  it("keeps reaction view models independent from source triggers", () => {
    const trigger = createTrigger(2);
    const viewModel = createOfficeLevelUpReactionViewModel([trigger]);

    viewModel.headline = "Mutated";
    viewModel.zoneLabel = "Mutated";

    expect(trigger.toLevel).toBe(2);
    expect(trigger.unlockedOfficeZones).toEqual([
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "storage",
    ]);
    expect(createOfficeLevelUpReactionViewModel([trigger])).toMatchObject({
      headline: "Company level 2 reached",
      zoneLabel: "7 zones unlocked",
    });
  });
});

function createTrigger(
  toLevel: number,
  overrides: Partial<CompanyProgressionTrigger> = {},
): CompanyProgressionTrigger {
  return {
    triggerId: `company-level-${toLevel}-reached`,
    triggerType: "company_level_reached",
    source: "company_progression",
    fromLevel: toLevel - 1,
    toLevel,
    companyStage: toLevel >= 3 ? "growingCompany" : "smallOffice",
    layoutId: `layout-${toLevel}`,
    floorCount: 1,
    maxEmployees: 10,
    unlockedOfficeZones: [
      "entrance",
      "workspace",
      "workstationArea",
      "meetingArea",
      "breakArea",
      "reception",
      "storage",
    ],
    milestones: [{
      milestoneId: `level-${toLevel}-employee-count`,
      label: "Team growth",
      description: "Reach the required team size.",
      isMet: true,
      targetValue: 5,
      currentValue: 5,
    }],
    ...overrides,
  };
}

function createSceneStub() {
  const graphics = createGraphicsStub();
  const texts: TextStub[] = [];

  return {
    scene: {
      add: {
        graphics: () => graphics,
        text: (_x: number, _y: number, text: string) => {
          const stub = createTextStub(text);
          texts.push(stub);
          return stub;
        },
      },
    } as unknown as ConstructorParameters<typeof OfficeLevelUpReactionLayer>[0],
    graphics,
    texts,
  };
}

type TextStub = ReturnType<typeof createTextStub>;

function createTextStub(text: string) {
  return {
    text,
    visible: true,
    setScrollFactor() {
      return this;
    },
    setDepth() {
      return this;
    },
    setVisible(visible: boolean) {
      this.visible = visible;
      return this;
    },
    setText(nextText: string) {
      this.text = nextText;
      return this;
    },
    destroy() {
      return undefined;
    },
  };
}

function createGraphicsStub() {
  return {
    visible: true,
    setScrollFactor() {
      return this;
    },
    setDepth() {
      return this;
    },
    setVisible(visible: boolean) {
      this.visible = visible;
      return this;
    },
    clear() {
      return this;
    },
    fillStyle() {
      return this;
    },
    fillRoundedRect() {
      return this;
    },
    lineStyle() {
      return this;
    },
    strokeRoundedRect() {
      return this;
    },
    lineBetween() {
      return this;
    },
    destroy() {
      return undefined;
    },
  };
}
