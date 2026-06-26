import { FOUNDER_MOVE_SPEED } from "../config/founderConfig";
import type { Point } from "../shared/geometry";
import type { MovementResolver } from "../shared/movementTypes";
import type { NavigationIntent } from "../navigation/navigationTypes";
import { FounderEntity } from "./FounderEntity";
import type { FounderFacingDirection } from "./founderTypes";

export class FounderMovementController {
  constructor(
    private readonly founder: FounderEntity,
    private readonly movementResolver: MovementResolver,
  ) {}

  update(deltaMs: number, intent: NavigationIntent) {
    if (!intent.isMoving) return;

    this.founder.setFacing(getFacingFromIntent(intent));

    const movement = getMovementDelta(intent, deltaMs / 1000);
    const currentPosition = this.founder.position;
    const proposedPosition = {
      x: currentPosition.x + movement.x,
      y: currentPosition.y + movement.y,
    };
    const resolvedPosition = this.movementResolver.resolveMovement(currentPosition, proposedPosition);
    this.founder.setPosition(resolvedPosition);
  }
}

function getMovementDelta(intent: NavigationIntent, deltaSeconds: number): Point {
  const magnitude = Math.hypot(intent.directionX, intent.directionY) || 1;
  return {
    x: (intent.directionX / magnitude) * FOUNDER_MOVE_SPEED * deltaSeconds,
    y: (intent.directionY / magnitude) * FOUNDER_MOVE_SPEED * deltaSeconds,
  };
}

function getFacingFromIntent(intent: NavigationIntent): FounderFacingDirection {
  if (Math.abs(intent.directionX) > Math.abs(intent.directionY)) {
    return intent.directionX > 0 ? "right" : "left";
  }

  return intent.directionY > 0 ? "down" : "up";
}
