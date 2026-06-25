import type { Point, WorldBounds } from "../shared/geometry";
import type { PhaserScene } from "../shared/phaserTypes";
import type { CameraTarget, NavigationIntent, NavigationState } from "./navigationTypes";

export class CameraController {
  constructor(
    private readonly scene: PhaserScene,
    private readonly state: NavigationState,
  ) {}

  update(_deltaMs: number, intent: NavigationIntent) {
    this.state.currentIntent = intent;
  }

  setBounds(bounds: WorldBounds) {
    this.state.bounds = bounds;
  }

  setZoomTarget(zoom: number) {
    this.state.targetZoom = zoom;
  }

  focusWorldPoint(point: Point, options: { preferredZoom?: number; targetId?: string } = {}) {
    this.state.activeCameraTarget = {
      id: options.targetId ?? "manual-focus-target",
      position: point,
      preferredZoom: options.preferredZoom,
    };
  }

  destroy() {
    this.state.activeCameraTarget = undefined;
    void this.scene;
  }
}
