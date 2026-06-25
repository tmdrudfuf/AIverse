import { CITY_COLORS, CITY_WORLD_BOUNDS } from "./config/cityWorldConfig";
import { INITIAL_ZOOM } from "./config/navigationConfig";
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
    }

    update(_: number, delta: number) {
      const intent = this.navigationInputController?.getIntent();
      if (intent) this.cameraController?.update(delta, intent);
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
