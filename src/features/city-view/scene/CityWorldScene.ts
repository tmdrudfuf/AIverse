import { CITY_COLORS, CITY_WORLD_BOUNDS } from "./config/cityWorldConfig";
import {
  CAMERA_SMOOTHING,
  CAMERA_SPEED,
  CAPTURED_NAVIGATION_KEYS,
  INITIAL_ZOOM,
  KEYBOARD_ZOOM_SPEED,
  MAX_ZOOM,
  MIN_ZOOM,
  WHEEL_ZOOM_STEP,
  ZOOM_SMOOTHING,
} from "./config/navigationConfig";
import { createCityBuildingLayer } from "./layers/CityBuildingLayer";
import { createCityDecorationLayer } from "./layers/CityDecorationLayer";
import { createCityGroundLayer } from "./layers/CityGroundLayer";
import { createCityRoadLayer } from "./layers/CityRoadLayer";
import { CameraController } from "./navigation/CameraController";
import { NavigationInputController } from "./navigation/NavigationInputController";
import { createNavigationState } from "./navigation/NavigationState";
import type { NavigationState } from "./navigation/navigationTypes";
import type { PhaserRuntime } from "./shared/phaserTypes";

export function createCityWorldScene(PhaserRuntime: PhaserRuntime) {
  return class CityWorldScene extends PhaserRuntime.Scene {
    private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd?: Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>;
    private zoomKeys?: Record<"Q" | "E", Phaser.Input.Keyboard.Key>;
    private cameraVelocity = new PhaserRuntime.Math.Vector2(0, 0);
    private targetZoom = INITIAL_ZOOM;
    private navigationState?: NavigationState;
    private navigationInputController?: NavigationInputController;
    private cameraController?: CameraController;

    create() {
      this.cameras.main.setBackgroundColor(CITY_COLORS.grass);
      this.cameras.main.setBounds(
        CITY_WORLD_BOUNDS.x,
        CITY_WORLD_BOUNDS.y,
        CITY_WORLD_BOUNDS.width,
        CITY_WORLD_BOUNDS.height,
      );

      this.navigationState = createNavigationState(CITY_WORLD_BOUNDS, INITIAL_ZOOM);
      this.navigationInputController = new NavigationInputController();
      this.cameraController = new CameraController(this, this.navigationState);
      this.cameraController.setBounds(CITY_WORLD_BOUNDS);
      this.navigationInputController.setup(this, this.navigationState);
      this.events.once("shutdown", () => this.destroyNavigationControllers());

      const graphics = this.add.graphics();
      createCityGroundLayer(graphics);
      createCityRoadLayer(graphics);
      createCityBuildingLayer(this, graphics);
      createCityDecorationLayer(this, graphics);

      this.cursors = this.input.keyboard?.createCursorKeys();
      this.wasd = this.input.keyboard?.addKeys("W,A,S,D") as
        | Record<"W" | "A" | "S" | "D", Phaser.Input.Keyboard.Key>
        | undefined;
      this.zoomKeys = this.input.keyboard?.addKeys("Q,E") as
        | Record<"Q" | "E", Phaser.Input.Keyboard.Key>
        | undefined;
      this.input.keyboard?.addCapture([...CAPTURED_NAVIGATION_KEYS]);
      this.input.on(
        "wheel",
        (
          _pointer: Phaser.Input.Pointer,
          _objects: Phaser.GameObjects.GameObject[],
          _deltaX: number,
          deltaY: number,
        ) => {
          this.targetZoom = PhaserRuntime.Math.Clamp(
            this.targetZoom + (deltaY < 0 ? WHEEL_ZOOM_STEP : -WHEEL_ZOOM_STEP),
            MIN_ZOOM,
            MAX_ZOOM,
          );
        },
      );
    }

    update(_: number, delta: number) {
      const neutralIntent = this.navigationInputController?.getIntent();
      if (neutralIntent) this.cameraController?.update(delta, neutralIntent);

      const deltaSeconds = delta / 1000;
      const zoomOut = Boolean(this.zoomKeys?.Q.isDown);
      const zoomIn = Boolean(this.zoomKeys?.E.isDown);
      this.targetZoom = PhaserRuntime.Math.Clamp(
        this.targetZoom + (Number(zoomIn) - Number(zoomOut)) * KEYBOARD_ZOOM_SPEED * deltaSeconds,
        MIN_ZOOM,
        MAX_ZOOM,
      );
      this.setSmoothedZoom(this.targetZoom);

      const left = Boolean(this.cursors?.left.isDown || this.wasd?.A.isDown);
      const right = Boolean(this.cursors?.right.isDown || this.wasd?.D.isDown);
      const up = Boolean(this.cursors?.up.isDown || this.wasd?.W.isDown);
      const down = Boolean(this.cursors?.down.isDown || this.wasd?.S.isDown);
      const targetVelocity = new PhaserRuntime.Math.Vector2(
        Number(right) - Number(left),
        Number(down) - Number(up),
      );

      if (targetVelocity.lengthSq() > 0) targetVelocity.normalize().scale(CAMERA_SPEED);
      this.cameraVelocity.lerp(targetVelocity, CAMERA_SMOOTHING);

      const camera = this.cameras.main;
      this.setClampedCameraScroll(
        camera.scrollX + this.cameraVelocity.x * deltaSeconds,
        camera.scrollY + this.cameraVelocity.y * deltaSeconds,
      );
    }

    private setSmoothedZoom(targetZoom: number) {
      const camera = this.cameras.main;
      const centerX = camera.scrollX + camera.width / (2 * camera.zoom);
      const centerY = camera.scrollY + camera.height / (2 * camera.zoom);
      const nextZoom = PhaserRuntime.Math.Linear(camera.zoom, targetZoom, ZOOM_SMOOTHING);
      camera.setZoom(nextZoom);
      this.setClampedCameraScroll(
        centerX - camera.width / (2 * nextZoom),
        centerY - camera.height / (2 * nextZoom),
      );
    }

    private setClampedCameraScroll(x: number, y: number) {
      const camera = this.cameras.main;
      const visibleWidth = camera.width / camera.zoom;
      const visibleHeight = camera.height / camera.zoom;
      const maxScrollX = Math.max(0, CITY_WORLD_BOUNDS.width - visibleWidth);
      const maxScrollY = Math.max(0, CITY_WORLD_BOUNDS.height - visibleHeight);
      camera.setScroll(
        PhaserRuntime.Math.Clamp(x, CITY_WORLD_BOUNDS.x, maxScrollX),
        PhaserRuntime.Math.Clamp(y, CITY_WORLD_BOUNDS.y, maxScrollY),
      );
    }

    private destroyNavigationControllers() {
      this.navigationInputController?.destroy();
      this.cameraController?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.navigationState = undefined;
    }
  };
}