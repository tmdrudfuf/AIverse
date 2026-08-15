import type { PhaserScene } from "../shared/phaserTypes";
import type { CompanyProgressionTrigger } from "./progression/CompanyProgressionTypes";

const REACTION_X = 314;
const REACTION_Y = 18;
const REACTION_WIDTH = 286;
const REACTION_HEIGHT = 84;
const REACTION_DEPTH = 19;

export type OfficeLevelUpReactionViewModel = {
  visible: boolean;
  headline: string;
  stageLabel: string;
  capacityLabel: string;
  floorLabel: string;
  zoneLabel: string;
};

export class OfficeLevelUpReactionLayer {
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly headline: Phaser.GameObjects.Text;
  private readonly stageText: Phaser.GameObjects.Text;
  private readonly capacityText: Phaser.GameObjects.Text;
  private readonly floorText: Phaser.GameObjects.Text;
  private readonly zoneText: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene) {
    this.background = scene.add.graphics().setScrollFactor(0).setDepth(REACTION_DEPTH).setVisible(false);
    this.headline = scene.add
      .text(REACTION_X + 12, REACTION_Y + 10, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#fef3c7",
        fontStyle: "bold",
      })
      .setScrollFactor(0)
      .setDepth(REACTION_DEPTH + 1)
      .setVisible(false);
    this.stageText = createReactionText(scene, REACTION_Y + 30, "#ffffff");
    this.capacityText = createReactionText(scene, REACTION_Y + 46, "#fde68a");
    this.floorText = createReactionText(scene, REACTION_Y + 62, "#fde68a");
    this.zoneText = createReactionText(scene, REACTION_Y + 72, "#fde68a");

    this.drawBackground();
  }

  update(triggers?: ReadonlyArray<CompanyProgressionTrigger>) {
    const viewModel = createOfficeLevelUpReactionViewModel(triggers);

    if (!viewModel.visible) {
      this.setVisible(false);
      this.headline.setText("");
      this.stageText.setText("");
      this.capacityText.setText("");
      this.floorText.setText("");
      this.zoneText.setText("");
      return;
    }

    this.setVisible(true);
    this.headline.setText(viewModel.headline);
    this.stageText.setText(viewModel.stageLabel);
    this.capacityText.setText(viewModel.capacityLabel);
    this.floorText.setText(viewModel.floorLabel);
    this.zoneText.setText(viewModel.zoneLabel);
  }

  destroy() {
    this.background.destroy();
    this.headline.destroy();
    this.stageText.destroy();
    this.capacityText.destroy();
    this.floorText.destroy();
    this.zoneText.destroy();
  }

  private setVisible(visible: boolean) {
    this.background.setVisible(visible);
    this.headline.setVisible(visible);
    this.stageText.setVisible(visible);
    this.capacityText.setVisible(visible);
    this.floorText.setVisible(visible);
    this.zoneText.setVisible(visible);
  }

  private drawBackground() {
    this.background.clear();
    this.background.fillStyle(0x312e81, 0.86);
    this.background.fillRoundedRect(REACTION_X, REACTION_Y, REACTION_WIDTH, REACTION_HEIGHT, 5);
    this.background.lineStyle(1, 0xfbbf24, 0.78);
    this.background.strokeRoundedRect(REACTION_X, REACTION_Y, REACTION_WIDTH, REACTION_HEIGHT, 5);
    this.background.lineStyle(1, 0xffffff, 0.14);
    this.background.lineBetween(REACTION_X + 8, REACTION_Y + 8, REACTION_X + REACTION_WIDTH - 8, REACTION_Y + 8);
  }
}

export function createOfficeLevelUpReactionViewModel(
  triggers?: ReadonlyArray<CompanyProgressionTrigger>,
): OfficeLevelUpReactionViewModel {
  const trigger = triggers?.at(-1);
  if (!trigger) return createHiddenViewModel();

  return {
    visible: true,
    headline: `Company level ${trigger.toLevel} reached`,
    stageLabel: `Stage: ${formatLabel(trigger.companyStage)}`,
    capacityLabel: `${trigger.maxEmployees} employee capacity`,
    floorLabel: formatFloors(trigger.floorCount),
    zoneLabel: formatUnlockedZones(trigger.unlockedOfficeZones.length),
  };
}

function createHiddenViewModel(): OfficeLevelUpReactionViewModel {
  return {
    visible: false,
    headline: "",
    stageLabel: "",
    capacityLabel: "",
    floorLabel: "",
    zoneLabel: "",
  };
}

function createReactionText(scene: PhaserScene, y: number, color: string) {
  return scene.add
    .text(REACTION_X + 12, y, "", {
      fontFamily: "monospace",
      fontSize: "10px",
      color,
    })
    .setScrollFactor(0)
    .setDepth(REACTION_DEPTH + 1)
    .setVisible(false);
}

function formatFloors(floorCount: number) {
  return floorCount === 1 ? "1 office floor" : `${floorCount} office floors`;
}

function formatUnlockedZones(zoneCount: number) {
  return zoneCount === 1 ? "1 zone unlocked" : `${zoneCount} zones unlocked`;
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
