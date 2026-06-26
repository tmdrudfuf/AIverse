import type { CityReturnPayload, OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";
import type { FounderFacingDirection } from "../founder/founderTypes";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";

const EXIT_KEY_CODE = "Space";

export class OfficeExitController {
  private readonly prompt: Phaser.GameObjects.Text;
  private pendingExit = false;
  private isFounderInExitZone = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code !== EXIT_KEY_CODE) return;

    event.preventDefault();
    this.pendingExit = true;
  };

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

  setup() {
    this.scene.input.keyboard?.addCapture("SPACE");
    window.addEventListener("keydown", this.handleKeyDown);
  }

  update(founderPosition: Point) {
    this.isFounderInExitZone = isPointInExitZone(founderPosition, this.office);
    this.prompt.setVisible(this.isFounderInExitZone);
  }

  consumeReturnPayload(currentFacing?: FounderFacingDirection): CityReturnPayload | undefined {
    const shouldExit = this.pendingExit && this.isFounderInExitZone;
    this.pendingExit = false;
    if (!shouldExit) return undefined;

    return {
      buildingId: this.spawnRequest.buildingId,
      returnPosition: { ...this.spawnRequest.returnPosition },
      returnFacing: currentFacing ?? this.spawnRequest.returnFacing,
    };
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    this.scene.input.keyboard?.removeCapture("SPACE");
    this.prompt.destroy();
    this.pendingExit = false;
    this.isFounderInExitZone = false;
  }
}

function isPointInExitZone(point: Point, office: OfficeDefinition) {
  const zone = office.exitZone;
  return point.x >= zone.x && point.x <= zone.x + zone.width && point.y >= zone.y && point.y <= zone.y + zone.height;
}
