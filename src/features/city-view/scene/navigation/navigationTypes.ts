import type { Point, WorldBounds } from "../shared/geometry";

export type NavigationIntentSource = "keyboard" | "wheel" | "mixed" | "none";

export type NavigationMovementConstraint = (from: Point, to: Point) => Point;

export type NavigationIntent = {
  directionX: -1 | 0 | 1;
  directionY: -1 | 0 | 1;
  zoomDelta: number;
  isMoving: boolean;
  source: NavigationIntentSource;
};

export type CameraTarget = {
  id: string;
  position: Point;
  preferredZoom?: number;
  boundsMode?: "clamp" | "free";
};

export type NavigationState = {
  cameraVelocity: Point;
  targetZoom: number;
  currentIntent: NavigationIntent;
  bounds: WorldBounds;
  isCityViewFocused: boolean;
  activeCameraTarget?: CameraTarget;
};

export type NavigationConfig = {
  initialZoom: number;
  bounds: WorldBounds;
};
