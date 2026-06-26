import type { PhaserScene } from "../shared/phaserTypes";
import type { CityBuildingDefinition } from "./buildingTypes";

export class BuildingInteractionPrompt {
  private readonly title: Phaser.GameObjects.Text;
  private readonly action: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene) {
    this.title = scene.add.text(24, 24, "", {
      fontFamily: "monospace",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: "#253247",
      fontStyle: "bold",
      padding: { x: 10, y: 6 },
    });
    this.action = scene.add.text(24, 58, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#253247",
      backgroundColor: "#f4c85d",
      fontStyle: "bold",
      padding: { x: 10, y: 5 },
    });

    this.title.setScrollFactor(0).setDepth(2000).setVisible(false);
    this.action.setScrollFactor(0).setDepth(2000).setVisible(false);
  }

  update(building: CityBuildingDefinition | undefined) {
    if (!building) {
      this.title.setVisible(false);
      this.action.setVisible(false);
      return;
    }

    const canEnter = building.active && building.destination.enabled;
    this.title.setText(building.name).setVisible(true);
    this.action.setText(canEnter ? "Press Space to enter" : "Coming soon").setVisible(true);
  }

  destroy() {
    this.title.destroy();
    this.action.destroy();
  }
}