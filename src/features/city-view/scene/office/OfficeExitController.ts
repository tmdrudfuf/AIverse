import type { CityReturnPayload, OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";

export class OfficeExitController {
  private readonly prompt: Phaser.GameObjects.Text;
  private isFounderInExitZone = false;

  constructor(
    private readonly scene: PhaserScene,
    private readonly office: OfficeDefinition,
    private readonly spawnRequest: OfficeSpawnRequest,
  ) {
    this.prompt = scene.add
      .text(24, 24, "Press Space to return to city", {
        backgroundColor: "rgba(37, 50, 71, 0.88)",
        color: "#ffffff",
        fontFamily: "Arial, sans-serif",
        fontSize: "16px",
        padding: { x: 12, y: 8 },
      })
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
  }

  update(founderPosition: Point, showPrompt = true) {
    this.isFounderInExitZone = isPointInExitZone(founderPosition, this.office);
    this.prompt.setVisible(showPrompt && this.isFounderInExitZone);
  }

  isExitActive() {
    return this.isFounderInExitZone;
  }

  createReturnPayload(currentFacing?: FounderFacingDirection): CityReturnPayload | undefined {
    if (!this.isFounderInExitZone) return undefined;

    return {
      buildingId: this.spawnRequest.buildingId,
      returnPosition: { ...this.spawnRequest.returnPosition },
      returnFacing: currentFacing ?? this.spawnRequest.returnFacing,
    };
  }

  destroy() {
    this.prompt.destroy();
    this.isFounderInExitZone = false;
  }
}

function isPointInExitZone(point: Point, office: OfficeDefinition) {
  const zone = office.exitZone;
  return point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height;
}
