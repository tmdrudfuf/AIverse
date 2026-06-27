import type { Point } from "../shared/geometry";
import type { MovementResolver } from "../shared/movementTypes";
import type { OfficeCollisionMap } from "./OfficeCollisionMap";

export class OfficeTileMovementResolver implements MovementResolver {
  constructor(private readonly collisionMap: OfficeCollisionMap) {}

  resolveMovement(from: Point, to: Point): Point {
    const deltaX = to.x - from.x;
    const deltaY = to.y - from.y;
    const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
    if (distance === 0) return from;

    const maxStepSize = Math.max(1, this.collisionMap.maxStepSize);
    const stepCount = Math.ceil(distance / maxStepSize);
    const stepX = deltaX / stepCount;
    const stepY = deltaY / stepCount;

    let current = from;
    for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
      current = this.resolveStep(current, { x: current.x + stepX, y: current.y + stepY });
    }

    return current;
  }

  private resolveStep(from: Point, to: Point): Point {
    if (!this.collisionMap.isBlockedWorldPoint(to)) return to;

    const xOnly = { x: to.x, y: from.y };
    if (!this.collisionMap.isBlockedWorldPoint(xOnly)) return xOnly;

    const yOnly = { x: from.x, y: to.y };
    if (!this.collisionMap.isBlockedWorldPoint(yOnly)) return yOnly;

    return from;
  }
}
