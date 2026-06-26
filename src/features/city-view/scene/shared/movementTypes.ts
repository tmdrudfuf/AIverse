import type { Point } from "../shared/geometry";

export type MovementResolver = {
  resolveMovement(from: Point, to: Point): Point;
};
