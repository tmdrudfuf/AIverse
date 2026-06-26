import { MAX_ZOOM, MIN_ZOOM, ZOOM_SMOOTHING } from "../config/navigationConfig";
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
    this.applyZoomIntent(intent, deltaSeconds);
    this.updateZoom();
    this.applyActiveCameraTarget();
  }

  setBounds(bounds: WorldBounds) {
    this.state.bounds = bounds;
    const camera = this.scene.cameras.main;
    camera.setBounds(bounds.x, bounds.y, bounds.width, bounds.height);
    this.setZoomTarget(this.state.targetZoom);

    const boundedZoom = clampZoom(camera.zoom, bounds, camera.width, camera.height);
    if (boundedZoom !== camera.zoom) camera.setZoom(boundedZoom);

    this.clampCurrentScroll();
  }

  setZoomTarget(zoom: number) {
    const camera = this.scene.cameras.main;
    this.state.targetZoom = clampZoom(zoom, this.state.bounds, camera.width, camera.height);
  }

  focusWorldPoint(point: Point, options: { preferredZoom?: number; targetId?: string } = {}) {
    this.state.activeCameraTarget = {
      id: options.targetId ?? "manual-focus-target",
      position: point,
      preferredZoom: options.preferredZoom,
    };

    if (options.preferredZoom !== undefined) this.setZoomTarget(options.preferredZoom);
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
    const targetZoom = clampZoom(this.state.targetZoom, this.state.bounds, camera.width, camera.height);
    this.state.targetZoom = targetZoom;

    const nextZoom = snapZoom(currentZoom + (targetZoom - currentZoom) * ZOOM_SMOOTHING, targetZoom);
    if (nextZoom === currentZoom) return;

    const center = {
      x: camera.scrollX + camera.width / (2 * currentZoom),
      y: camera.scrollY + camera.height / (2 * currentZoom),
    };
    camera.setZoom(nextZoom);

    const nextX = center.x - camera.width / (2 * nextZoom);
    const nextY = center.y - camera.height / (2 * nextZoom);
    const clamped = clampCameraScroll(nextX, nextY, this.state.bounds, camera.width, camera.height, nextZoom);
    camera.setScroll(clamped.x, clamped.y);
  }

  private applyActiveCameraTarget() {
    const target = this.state.activeCameraTarget;
    if (!target) return;

    const camera = this.scene.cameras.main;
    const nextX = target.position.x - camera.width / (2 * camera.zoom);
    const nextY = target.position.y - camera.height / (2 * camera.zoom);
    const clamped = clampCameraScroll(nextX, nextY, this.state.bounds, camera.width, camera.height, camera.zoom);
    camera.setScroll(clamped.x, clamped.y);
  }

  private clampCurrentScroll() {
    const camera = this.scene.cameras.main;
    const clamped = clampCameraScroll(camera.scrollX, camera.scrollY, this.state.bounds, camera.width, camera.height, camera.zoom);
    camera.setScroll(clamped.x, clamped.y);
  }
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

function clampZoom(zoom: number, bounds: WorldBounds, viewportWidth: number, viewportHeight: number) {
  const minZoomForBounds = Math.max(MIN_ZOOM, viewportWidth / bounds.width, viewportHeight / bounds.height);
  const maxZoomForBounds = Math.max(MAX_ZOOM, minZoomForBounds);
  return clamp(zoom, minZoomForBounds, maxZoomForBounds);
}

function snapZoom(current: number, target: number) {
  return Math.abs(current - target) < 0.001 ? target : current;
}


function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}