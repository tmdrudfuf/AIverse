import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeDefinition } from "./officeTypes";

const OFFICE_OVERLAY_DEPTH = 20;
const EXIT_MARKER_DEPTH = 8;

export class OfficeVisualLayer {
  private readonly title: Phaser.GameObjects.Text;
  private readonly exitMarker: Phaser.GameObjects.Container;

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
      .setDepth(OFFICE_OVERLAY_DEPTH);

    this.exitMarker = createExitMarker(scene, office);
  }

  destroy() {
    this.title.destroy();
    this.exitMarker.destroy(true);
  }
}

function createExitMarker(scene: PhaserScene, office: OfficeDefinition) {
  const zone = office.exitZone;
  const centerX = zone.x + zone.width / 2;
  const signY = zone.y - 12;
  const thresholdY = zone.y + zone.height - 12;

  const marker = scene.add.container(0, 0).setDepth(EXIT_MARKER_DEPTH);
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x253247, 1);
  graphics.fillRoundedRect(zone.x + 12, signY, zone.width - 24, 22, 4);
  graphics.lineStyle(2, 0xf8fafc, 1);
  graphics.strokeRoundedRect(zone.x + 12, signY, zone.width - 24, 22, 4);

  graphics.fillStyle(0xf4c85d, 0.95);
  graphics.fillRoundedRect(zone.x + 8, thresholdY, zone.width - 16, 12, 4);
  graphics.lineStyle(2, 0x253247, 0.9);
  graphics.strokeRoundedRect(zone.x + 8, thresholdY, zone.width - 16, 12, 4);

  const label = scene.add
    .text(centerX, signY + 11, "EXIT", {
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      fontStyle: "700",
    })
    .setOrigin(0.5, 0.5);

  marker.add([graphics, label]);
  return marker;
}
