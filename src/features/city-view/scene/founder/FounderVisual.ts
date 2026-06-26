import { FOUNDER_VISUAL_DEPTH } from "../config/founderConfig";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { FounderFacingDirection } from "./founderTypes";

export class FounderVisual {
  private readonly container: Phaser.GameObjects.Container;
  private readonly directionMarker: Phaser.GameObjects.Graphics;

  constructor(scene: PhaserScene, position: Point, facing: FounderFacingDirection = "down") {
    const body = scene.add.graphics();
    body.fillStyle(0xf4c85d, 1);
    body.fillCircle(0, 0, 13);
    body.lineStyle(3, 0x253247, 1);
    body.strokeCircle(0, 0, 13);
    body.fillStyle(0xffffff, 1);
    body.fillCircle(-4, -3, 2);
    body.fillCircle(4, -3, 2);

    this.directionMarker = scene.add.graphics();
    this.directionMarker.fillStyle(0x253247, 1);
    this.directionMarker.fillTriangle(0, -18, -5, -8, 5, -8);

    this.container = scene.add.container(position.x, position.y, [body, this.directionMarker]);
    this.container.setDepth(FOUNDER_VISUAL_DEPTH);
    this.setFacing(facing);
  }

  setPosition(position: Point) {
    this.container.setPosition(position.x, position.y);
  }

  setFacing(facing: FounderFacingDirection) {
    this.directionMarker.setRotation(getFacingRotation(facing));
  }

  destroy() {
    this.container.destroy(true);
  }
}

function getFacingRotation(facing: FounderFacingDirection) {
  switch (facing) {
    case "up":
      return 0;
    case "right":
      return Math.PI / 2;
    case "down":
      return Math.PI;
    case "left":
      return -Math.PI / 2;
  }
}
