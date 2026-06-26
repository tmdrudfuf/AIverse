import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeDefinition } from "./officeTypes";

export class OfficeVisualLayer {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly title: Phaser.GameObjects.Text;

  constructor(scene: PhaserScene, office: OfficeDefinition) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(0);

    this.graphics.fillStyle(0x202a3a, 1);
    this.graphics.fillRect(office.worldBounds.x, office.worldBounds.y, office.worldBounds.width, office.worldBounds.height);

    this.graphics.fillStyle(0xd8d2bf, 1);
    this.graphics.fillRect(office.walkableBounds.x, office.walkableBounds.y, office.walkableBounds.width, office.walkableBounds.height);

    this.graphics.lineStyle(12, 0x253247, 1);
    this.graphics.strokeRect(office.walkableBounds.x, office.walkableBounds.y, office.walkableBounds.width, office.walkableBounds.height);

    this.graphics.fillStyle(0x6fbf73, 1);
    this.graphics.fillRect(office.exitZone.x, office.exitZone.y, office.exitZone.width, office.exitZone.height);
    this.graphics.lineStyle(4, 0x253247, 1);
    this.graphics.strokeRect(office.exitZone.x, office.exitZone.y, office.exitZone.width, office.exitZone.height);

    this.title = scene.add
      .text(office.worldBounds.width / 2, 28, office.companyName, {
        color: "#253247",
        fontFamily: "Arial, sans-serif",
        fontSize: "24px",
        fontStyle: "700",
      })
      .setOrigin(0.5, 0)
      .setDepth(20);
  }

  destroy() {
    this.graphics.destroy();
    this.title.destroy();
  }
}
