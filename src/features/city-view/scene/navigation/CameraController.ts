import { CAMERA_SMOOTHING, CAMERA_SPEED, MAX_ZOOM, MIN_ZOOM, ZOOM_SMOOTHING } from "../config/navigationConfig";
import type { Point, WorldBounds } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { CameraTarget, NavigationIntent, NavigationState } from "./navigationTypes";

export class CameraController {
  constructor(
    private readonly scene: PhaserScene,
    private readonly state: NavigationState,
  ) {}

  update(deltaMs: number, intent: NavigationIntent) {
    this.state.currentIntent = intent;

    const deltaSeconds = deltaMs / 1000;
    const camera = this.scene.cameras.main;
    this.applyZoomIntent(intent, deltaSeconds);

    const targetVelocity = getTargetVelocity(intent);
    this.state.cameraVelocity = {
      x: lerp(this.state.cameraVelocity.x, targetVelocity.x, CAMERA_SMOOTHING),
      y: lerp(this.state.cameraVelocity.y, targetVelocity.y, CAMERA_SMOOTHING),
    };

    const nextX = camera.scrollX + this.state.cameraVelocity.x * deltaSeconds;
    const nextY = camera.scrollY + this.state.cameraVelocity.y * deltaSeconds;
    const movedScroll = clampCameraScroll(nextX, nextY, this.state.bounds, camera.width, camera.height, camera.zoom);
    camera.setScroll(movedScroll.x, movedScroll.y);

    this.updateZoom();
  }

  setBounds(bounds: WorldBounds) {
    this.state.bounds = bounds;
  }

  setZoomTarget(zoom: number) {
    this.state.targetZoom = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  }

  focusWorldPoint(point: Point, options: { preferredZoom?: number; targetId?: string } = {}) {
    this.state.activeCameraTarget = {
      id: options.targetId ?? "manual-focus-target",
      position: point,
      preferredZoom: options.preferredZoom,
    };
  }

  destroy() {
    this.state.cameraVelocity = { x: 0, y: 0 };
    this.state.activeCameraTarget = undefined;
  }

  private applyZoomIntent(intent: NavigationIntent, deltaSeconds: number) {
    if (intent.zoomDelta === 0) return;

    const zoomDelta = intent.source === "keyboard" ? intent.zoomDelta * deltaSeconds : intent.zoomDelta;
    this.setZoomTarget(this.state.targetZoom + zoomDelta);
  }

  private updateZoom() {
    const camera = this.scene.cameras.main;
    const currentZoom = camera.zoom;
    const nextZoom = snapZoom(lerp(currentZoom, this.state.targetZoom, ZOOM_SMOOTHING), this.state.targetZoom);
    if (nextZoom === currentZoom) return;

    const center = getCameraCenter(camera.scrollX, camera.scrollY, camera.width, camera.height, currentZoom);
    camera.setZoom(nextZoom);

    const nextX = center.x - camera.width / (2 * nextZoom);
    const nextY = center.y - camera.height / (2 * nextZoom);
    const clamped = clampCameraScroll(nextX, nextY, this.state.bounds, camera.width, camera.height, nextZoom);
    camera.setScroll(clamped.x, clamped.y);
  }
}

function getTargetVelocity(intent: NavigationIntent): Point {
  if (!intent.isMoving) return { x: 0, y: 0 };

  const magnitude = Math.hypot(intent.directionX, intent.directionY) || 1;
  return {
    x: (intent.directionX / magnitude) * CAMERA_SPEED,
    y: (intent.directionY / magnitude) * CAMERA_SPEED,
  };
}

function getCameraCenter(x: number, y: number, viewportWidth: number, viewportHeight: number, zoom: number): Point {
  return {
    x: x + viewportWidth / (2 * zoom),
    y: y + viewportHeight / (2 * zoom),
  };
}

function clampCameraScroll(
  x: number,
  y: number,
  bounds: WorldBounds,
  viewportWidth: number,
  viewportHeight: number,
  zoom: number,
): Point {
  const visibleWidth = viewportWidth / zoom;
  const visibleHeight = viewportHeight / zoom;
  const minX = bounds.x;
  const minY = bounds.y;
  const maxX = bounds.x + Math.max(0, bounds.width - visibleWidth);
  const maxY = bounds.y + Math.max(0, bounds.height - visibleHeight);

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY),
  };
}

function snapZoom(current: number, target: number) {
  return Math.abs(current - target) < 0.001 ? target : current;
}

function lerp(current: number, target: number, amount: number) {
  return current + (target - current) * amount;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
