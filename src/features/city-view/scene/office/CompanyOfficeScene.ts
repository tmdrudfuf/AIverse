import type { Rect } from "../buildings/buildingTypes";
import { INITIAL_ZOOM } from "../config/navigationConfig";
import { FounderEntity } from "../founder/FounderEntity";
import { FounderMovementController } from "../founder/FounderMovementController";
import { CameraController } from "../navigation/CameraController";
import { NavigationInputController } from "../navigation/NavigationInputController";
import { createNavigationState } from "../navigation/NavigationState";
import type { NavigationState } from "../navigation/navigationTypes";
import type { Point } from "../shared/geometry";
import type { PhaserRuntime } from "../shared/phaserTypes";
import { DAILY_PROOF_OFFICE_SCENE_KEY } from "./officeConfig";
import { OfficeCollisionMap } from "./OfficeCollisionMap";
import { OfficeExitController } from "./OfficeExitController";
import { OfficeSpawnManager } from "./OfficeSpawnManager";
import { OfficeTileMovementResolver } from "./OfficeTileMovementResolver";
import { createOfficeTilemapLayer, loadOfficeTilemapAssets, type OfficeTilemapLayers } from "./OfficeTilemapLayer";
import { OfficeVisualLayer } from "./OfficeVisualLayer";
import type { OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";

export function createCompanyOfficeScene(PhaserRuntime: PhaserRuntime) {
  return class CompanyOfficeScene extends PhaserRuntime.Scene {
    private navigationState?: NavigationState;
    private navigationInputController?: NavigationInputController;
    private cameraController?: CameraController;
    private founderEntity?: FounderEntity;
    private founderMovementController?: FounderMovementController;
    private officeMovementResolver?: OfficeTileMovementResolver;
    private officeVisualLayer?: OfficeVisualLayer;
    private officeExitController?: OfficeExitController;
    private officeTilemapLayers?: OfficeTilemapLayers;
    private officeCollisionMap?: OfficeCollisionMap;
    private office?: OfficeDefinition;
    private spawnRequest?: OfficeSpawnRequest;

    constructor() {
      super({ key: DAILY_PROOF_OFFICE_SCENE_KEY });
    }

    init(payload?: OfficeSpawnRequest) {
      this.spawnRequest = payload;
    }

    preload() {
      loadOfficeTilemapAssets(this, this.resolveConfiguredOffice());
    }

    create() {
      const configuredOffice = this.resolveConfiguredOffice();

      this.cameras.main.setBackgroundColor(0x202a3a);
      this.navigationState = createNavigationState(configuredOffice.worldBounds, INITIAL_ZOOM);
      this.navigationInputController = new NavigationInputController();
      this.cameraController = new CameraController(this, this.navigationState);
      this.cameraController.setBounds(configuredOffice.worldBounds);
      this.navigationInputController.setup(this, this.navigationState);
      this.events.once("shutdown", () => this.destroyOfficeControllers());

      this.officeTilemapLayers = createOfficeTilemapLayer(this, configuredOffice);
      this.officeCollisionMap = new OfficeCollisionMap(this.officeTilemapLayers.collision);
      this.office = {
        ...configuredOffice,
        founderSpawn: this.officeTilemapLayers.markers.founderSpawn,
        exitZone: this.officeTilemapLayers.markers.exitZone,
      };
      validateOfficeLayout(this.office, this.officeCollisionMap);

      this.officeVisualLayer = new OfficeVisualLayer(this, this.office);
      this.founderEntity = new FounderEntity(this, this.office.founderSpawn);
      if (this.spawnRequest?.returnFacing) this.founderEntity.setFacing(this.spawnRequest.returnFacing);

      this.officeMovementResolver = new OfficeTileMovementResolver(this.officeCollisionMap);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.officeMovementResolver);
      this.officeExitController = new OfficeExitController(this, this.office, this.requireSpawnRequest());
      this.officeExitController.setup();

      this.cameraController.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController.update(0, this.navigationState.currentIntent);
    }

    update(_: number, delta: number) {
      const intent = this.navigationInputController?.getIntent();
      if (!intent || !this.founderEntity || !this.spawnRequest) return;

      this.officeExitController?.update(this.founderEntity.position);
      const returnPayload = this.officeExitController?.consumeReturnPayload(this.founderEntity.state.facing);
      if (returnPayload) {
        this.scene.start(this.spawnRequest.returnSceneKey, returnPayload);
        return;
      }

      this.founderMovementController?.update(delta, intent);
      this.officeExitController?.update(this.founderEntity.position);

      this.cameraController?.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController?.update(delta, intent);
    }

    private resolveConfiguredOffice() {
      if (this.office && this.spawnRequest) return this.office;

      const spawnResolution = new OfficeSpawnManager().resolveSpawn(this.spawnRequest);
      this.office = spawnResolution.office;
      this.spawnRequest = spawnResolution.spawnRequest;
      return this.office;
    }

    private requireSpawnRequest() {
      if (!this.spawnRequest) {
        throw new Error("CompanyOfficeScene requires an OfficeSpawnRequest. Enter the office through a city building interaction.");
      }
      return this.spawnRequest;
    }

    private destroyOfficeControllers() {
      this.navigationInputController?.destroy();
      this.cameraController?.destroy();
      this.founderEntity?.destroy();
      this.officeExitController?.destroy();
      this.officeVisualLayer?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.founderMovementController = undefined;
      this.officeMovementResolver = undefined;
      this.founderEntity = undefined;
      this.officeExitController = undefined;
      this.officeVisualLayer = undefined;
      this.officeTilemapLayers = undefined;
      this.officeCollisionMap = undefined;
      this.office = undefined;
      this.spawnRequest = undefined;
      this.navigationState = undefined;
    }
  };
}

function validateOfficeLayout(office: OfficeDefinition, collisionMap: OfficeCollisionMap) {
  validateOpenPoint(office.sceneKey, "founder spawn", office.founderSpawn, collisionMap);
  validateOpenPoint(office.sceneKey, "exit zone center", getRectCenter(office.exitZone), collisionMap);
}

function validateOpenPoint(sceneKey: string, label: string, point: Point, collisionMap: OfficeCollisionMap) {
  if (!collisionMap.isBlockedWorldPoint(point)) return;

  throw new Error(`Office ${sceneKey} ${label} ${point.x},${point.y} is blocked by the collision layer.`);
}

function getRectCenter(rect: Rect): Point {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}
