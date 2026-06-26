import { CITY_COLORS, CITY_NAVIGATION_BOUNDS } from "./config/cityWorldConfig";
import { INITIAL_ZOOM } from "./config/navigationConfig";
import { createCityBuildingLayer } from "./layers/CityBuildingLayer";
import { createCityDecorationLayer } from "./layers/CityDecorationLayer";
import { CameraController } from "./navigation/CameraController";
import { NavigationInputController } from "./navigation/NavigationInputController";
import { NavigationMovementResolver } from "./navigation/NavigationMovementResolver";
import { createNavigationState } from "./navigation/NavigationState";
import type { NavigationState } from "./navigation/navigationTypes";
import type { PhaserRuntime } from "./shared/phaserTypes";
import { createCityTilemapLayer, loadCityTilemapAssets } from "./tilemap/CityTilemapLayer";
import { CityCollisionMap } from "./tilemap/CityCollisionMap";

export function createCityWorldScene(PhaserRuntime: PhaserRuntime) {
  return class CityWorldScene extends PhaserRuntime.Scene {
    private navigationState?: NavigationState;
    private navigationInputController?: NavigationInputController;
    private cameraController?: CameraController;
    private navigationMovementResolver?: NavigationMovementResolver;

    preload() {
      loadCityTilemapAssets(this);
    }

    create() {
      this.cameras.main.setBackgroundColor(CITY_COLORS.grass);

      this.navigationState = createNavigationState(CITY_NAVIGATION_BOUNDS, INITIAL_ZOOM);
      this.navigationInputController = new NavigationInputController();
      this.cameraController = new CameraController(this, this.navigationState);
      this.cameraController.setBounds(CITY_NAVIGATION_BOUNDS);
      this.navigationInputController.setup(this, this.navigationState);
      this.events.once("shutdown", () => this.destroyNavigationControllers());

      const tilemapLayers = createCityTilemapLayer(this);
      this.navigationMovementResolver = new NavigationMovementResolver(new CityCollisionMap(tilemapLayers.collision));

      const graphics = this.add.graphics();
      createCityBuildingLayer(this, graphics);
      createCityDecorationLayer(this, graphics);
    }

    update(_: number, delta: number) {
      const intent = this.navigationInputController?.getIntent();
      if (intent) {
        this.cameraController?.update(delta, intent, (from, to) => this.navigationMovementResolver?.resolveMovement(from, to) ?? to);
      }
    }

    private destroyNavigationControllers() {
      this.navigationInputController?.destroy();
      this.cameraController?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.navigationMovementResolver = undefined;
      this.navigationState = undefined;
    }
  };
}
