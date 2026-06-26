import { BuildingInteractionController } from "./buildings/BuildingInteractionController";
import { BuildingInteractionPrompt } from "./buildings/BuildingInteractionPrompt";
import { BuildingRegistry } from "./buildings/BuildingRegistry";
import { BuildingTransitionController } from "./buildings/BuildingTransitionController";
import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import { CITY_BUILDINGS } from "./config/cityBuildingConfig";
import { CITY_COLORS, CITY_NAVIGATION_BOUNDS } from "./config/cityWorldConfig";
import { FOUNDER_INITIAL_POSITION, FOUNDER_SPAWN_SEARCH_RADIUS_TILES } from "./config/founderConfig";
import { INITIAL_ZOOM } from "./config/navigationConfig";
import { FounderEntity } from "./founder/FounderEntity";
import { FounderMovementController } from "./founder/FounderMovementController";
import { createCityBuildingLayer } from "./layers/CityBuildingLayer";
import { createCityDecorationLayer } from "./layers/CityDecorationLayer";
import { CameraController } from "./navigation/CameraController";
import { NavigationInputController } from "./navigation/NavigationInputController";
import { NavigationMovementResolver } from "./navigation/NavigationMovementResolver";
import { createNavigationState } from "./navigation/NavigationState";
import type { NavigationState } from "./navigation/navigationTypes";
import type { Point } from "./shared/geometry";
import type { PhaserRuntime } from "./shared/phaserTypes";
import { CityCollisionMap } from "./tilemap/CityCollisionMap";
import { createCityTilemapLayer, loadCityTilemapAssets } from "./tilemap/CityTilemapLayer";

export function createCityWorldScene(PhaserRuntime: PhaserRuntime) {
  return class CityWorldScene extends PhaserRuntime.Scene {
    private navigationState?: NavigationState;
    private navigationInputController?: NavigationInputController;
    private cameraController?: CameraController;
    private navigationMovementResolver?: NavigationMovementResolver;
    private founderEntity?: FounderEntity;
    private founderMovementController?: FounderMovementController;
    private buildingInteractionController?: BuildingInteractionController;
    private buildingInteractionPrompt?: BuildingInteractionPrompt;
    private buildingTransitionController?: BuildingTransitionController;

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
      const cityCollisionMap = new CityCollisionMap(tilemapLayers.collision);
      this.navigationMovementResolver = new NavigationMovementResolver(cityCollisionMap);
      validateBuildingInteractionZones(CITY_BUILDINGS, cityCollisionMap);

      const graphics = this.add.graphics();
      createCityBuildingLayer(this, graphics);
      createCityDecorationLayer(this, graphics);

      const founderSpawn = resolveFounderSpawn(cityCollisionMap);
      this.founderEntity = new FounderEntity(this, founderSpawn);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.navigationMovementResolver);

      const buildingRegistry = new BuildingRegistry(CITY_BUILDINGS);
      this.buildingInteractionController = new BuildingInteractionController(buildingRegistry);
      this.buildingInteractionController.setup(this);
      this.buildingInteractionPrompt = new BuildingInteractionPrompt(this);
      this.buildingTransitionController = new BuildingTransitionController();

      this.cameraController.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController.update(0, this.navigationState.currentIntent);
    }

    update(_: number, delta: number) {
      const intent = this.navigationInputController?.getIntent();
      if (!intent || !this.founderEntity) return;

      this.founderMovementController?.update(delta, intent);
      this.buildingInteractionController?.update(this.founderEntity.position);
      const activeBuilding = this.buildingInteractionController?.getActiveBuilding();
      this.buildingInteractionPrompt?.update(activeBuilding);

      if (this.buildingInteractionController?.consumeInteractionPressed(activeBuilding) && activeBuilding) {
        this.buildingTransitionController?.createEntryRequest(activeBuilding, this.founderEntity.position);
      }

      this.cameraController?.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController?.update(delta, intent);
    }

    private destroyNavigationControllers() {
      this.navigationInputController?.destroy();
      this.cameraController?.destroy();
      this.founderEntity?.destroy();
      this.buildingInteractionController?.destroy(this);
      this.buildingInteractionPrompt?.destroy();
      this.buildingTransitionController?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.navigationMovementResolver = undefined;
      this.founderMovementController = undefined;
      this.founderEntity = undefined;
      this.buildingInteractionController = undefined;
      this.buildingInteractionPrompt = undefined;
      this.buildingTransitionController = undefined;
      this.navigationState = undefined;
    }
  };
}

function resolveFounderSpawn(collisionMap: CityCollisionMap): Point {
  const configuredSpawn = { ...FOUNDER_INITIAL_POSITION };
  if (!collisionMap.isBlockedWorldPoint(configuredSpawn)) return configuredSpawn;

  const openSpawn = collisionMap.findNearestOpenTileCenter(configuredSpawn, FOUNDER_SPAWN_SEARCH_RADIUS_TILES);
  if (openSpawn) return openSpawn;

  throw new Error(
    `Founder spawn ${configuredSpawn.x},${configuredSpawn.y} is blocked and no open tile was found within ${FOUNDER_SPAWN_SEARCH_RADIUS_TILES} tiles.`,
  );
}

function validateBuildingInteractionZones(buildings: CityBuildingDefinition[], collisionMap: CityCollisionMap) {
  if (process.env.NODE_ENV === "production") return;

  buildings.forEach((building) => {
    const zoneCenter = {
      x: building.interactionZone.x + building.interactionZone.width / 2,
      y: building.interactionZone.y + building.interactionZone.height / 2,
    };

    if (collisionMap.isBlockedWorldPoint(building.entrancePoint)) {
      console.warn(`Building ${building.id} entrance point is blocked by collision.`, building.entrancePoint);
    }

    if (collisionMap.isBlockedWorldPoint(zoneCenter)) {
      console.warn(`Building ${building.id} interaction zone center is blocked by collision.`, zoneCenter);
    }
  });
}