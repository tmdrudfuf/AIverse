import type { Point } from "../shared/geometry";

export type FounderFacingDirection = "up" | "down" | "left" | "right";

export type FounderState = {
  id: string;
  position: Point;
  facing?: FounderFacingDirection;
};
