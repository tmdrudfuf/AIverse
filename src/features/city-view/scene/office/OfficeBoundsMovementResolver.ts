import type { Rect } from "../buildings/buildingTypes";
import type { Point } from "../shared/geometry";
import type { MovementResolver } from "../shared/movementTypes";

export class OfficeBoundsMovementResolver implements MovementResolver {
  constructor(private readonly walkableBounds: Rect) {}

  resolveMovement(_: Point, to: Point): Point {
    return {
      x: clamp(to.x, this.walkableBounds.x, this.walkableBounds.x + this.walkableBounds.width),
      y: clamp(to.y, this.walkableBounds.y, this.walkableBounds.y + this.walkableBounds.height),
    };
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
