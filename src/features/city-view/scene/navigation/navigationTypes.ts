import type { Point, WorldBounds } from "../shared/geometry";

export type NavigationIntentSource = "keyboard" | "wheel" | "pointer" | "mixed" | "none";

export type NavigationIntent = {
  directionX: -1 | 0 | 1;
  directionY: -1 | 0 | 1;
  panDeltaX: number;
  panDeltaY: number;
  zoomDelta: number;
  isMoving: boolean;
  isPanning: boolean;
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
