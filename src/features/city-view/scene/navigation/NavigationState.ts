import type { WorldBounds } from "../shared/geometry";
import type { NavigationIntent, NavigationState } from "./navigationTypes";

export const NEUTRAL_NAVIGATION_INTENT: NavigationIntent = {
  directionX: 0,
  directionY: 0,
  zoomDelta: 0,
  isMoving: false,
  source: "none",
};

export function createNavigationState(bounds: WorldBounds, initialZoom: number): NavigationState {
  return {
    cameraVelocity: { x: 0, y: 0 },
    targetZoom: initialZoom,
    currentIntent: NEUTRAL_NAVIGATION_INTENT,
    bounds,
    isCityViewFocused: false,
  };
}
