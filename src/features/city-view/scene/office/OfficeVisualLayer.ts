import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeDefinition } from "./officeTypes";

export class OfficeVisualLayer {
  private readonly title: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene, office: OfficeDefinition) {
    this.title = scene.add
      .text(office.worldBounds.width / 2, 28, office.companyName, {
        backgroundColor: "rgba(248, 250, 252, 0.84)",
        color: "#253247",
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "700",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5, 0)
      .setDepth(20);
  }

  destroy() {
    this.title.destroy();
  }
}
