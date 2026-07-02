import type { Point, WorldBounds } from "../shared/geometry";

export type NavigationIntentSource = "keyboard" | "wheel" | "mixed" | "none";

export type NavigationIntent = {
  directionX: -1 | 0 | 1;
  directionY: -1 | 0 | 1;
  zoomDelta: number;
  isMoving: boolean;
  source: NavigationIntentSource;
};

export type CameraBoundsMode = "clamp" | "free";

export type CameraTarget = {
  id: string;
  position: Point;
  preferredZoom?: number;
  boundsMode?: CameraBoundsMode;
};

export type CameraFocusOptions = {
  targetId?: string;
  preferredZoom?: number;
  boundsMode?: CameraBoundsMode;
};

export type CameraFocusRequest = {
  point: Point;
  options?: CameraFocusOptions;
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
