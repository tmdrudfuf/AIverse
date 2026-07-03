import type { PhaserScene } from "../shared/phaserTypes";
import type { OfficeDefinition, OfficeInteractiveObject } from "./officeTypes";

const OFFICE_OVERLAY_DEPTH = 20;
const EXIT_MARKER_DEPTH = 8;
const INTERACTIVE_OBJECT_DEPTH = 7;

export class OfficeVisualLayer {
  private readonly title: Phaser.GameObjects.Text;
  private readonly exitMarker: Phaser.GameObjects.Container;
  private readonly interactiveObjectMarkers: Phaser.GameObjects.Container[];

  constructor(
    scene: PhaserScene,
    office: OfficeDefinition,
    interactiveObjects: ReadonlyArray<OfficeInteractiveObject> = [],
  ) {
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
    this.interactiveObjectMarkers = interactiveObjects
      .filter((object) => object.enabled && object.type === "computer")
      .map((object) => createComputerMarker(scene, object));
  }

  destroy() {
    this.title.destroy();
    this.exitMarker.destroy(true);
    this.interactiveObjectMarkers.forEach((marker) => marker.destroy(true));
  }
}

function createComputerMarker(scene: PhaserScene, object: OfficeInteractiveObject) {
  const zone = object.interactionZone;
  const centerX = zone.x + zone.width / 2;
  const deskY = zone.y + zone.height - 20;
  const monitorY = zone.y + 16;
  const marker = scene.add.container(0, 0).setDepth(INTERACTIVE_OBJECT_DEPTH);
  const graphics = scene.add.graphics();

  graphics.fillStyle(0x5f7f8d, 1);
  graphics.fillRoundedRect(zone.x + 12, deskY, zone.width - 24, 18, 4);
  graphics.lineStyle(2, 0x253247, 0.95);
  graphics.strokeRoundedRect(zone.x + 12, deskY, zone.width - 24, 18, 4);

  graphics.fillStyle(0x253247, 1);
  graphics.fillRoundedRect(centerX - 26, monitorY, 52, 34, 4);
  graphics.lineStyle(2, 0xf8fafc, 0.95);
  graphics.strokeRoundedRect(centerX - 26, monitorY, 52, 34, 4);

  graphics.fillStyle(0x9de2e4, 0.95);
  graphics.fillRoundedRect(centerX - 20, monitorY + 6, 40, 20, 2);
  graphics.fillStyle(0x253247, 1);
  graphics.fillRect(centerX - 4, monitorY + 34, 8, 12);
  graphics.fillRoundedRect(centerX - 18, monitorY + 44, 36, 6, 2);

  const label = scene.add
    .text(centerX, deskY + 9, object.displayName.toUpperCase(), {
      backgroundColor: "rgba(37, 50, 71, 0.92)",
      color: "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      fontStyle: "700",
      padding: { x: 6, y: 2 },
    })
    .setOrigin(0.5, 0.5);

  marker.add([graphics, label]);
  return marker;
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
