import { FOUNDER_ID } from "../config/founderConfig";
import type { Point } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import { FounderVisual } from "./FounderVisual";
import type { FounderFacingDirection, FounderState } from "./founderTypes";

export class FounderEntity {
  readonly state: FounderState;
  private readonly visual: FounderVisual;

  constructor(scene: PhaserScene, position: Point) {
    this.state = {
      id: FOUNDER_ID,
      position,
      facing: "down",
    };
    this.visual = new FounderVisual(scene, this.state.position, this.state.facing);
  }

  get position(): Point {
    return this.state.position;
  }

  setPosition(position: Point) {
    this.state.position = position;
    this.visual.setPosition(position);
  }

  setFacing(facing: FounderFacingDirection) {
    this.state.facing = facing;
    this.visual.setFacing(facing);
  }

  destroy() {
    this.visual.destroy();
  }
}
