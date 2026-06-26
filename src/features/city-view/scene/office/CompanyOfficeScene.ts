import { INITIAL_ZOOM } from "../config/navigationConfig";
import { FounderEntity } from "../founder/FounderEntity";
import { FounderMovementController } from "../founder/FounderMovementController";
import { CameraController } from "../navigation/CameraController";
import { NavigationInputController } from "../navigation/NavigationInputController";
import { createNavigationState } from "../navigation/NavigationState";
import type { NavigationState } from "../navigation/navigationTypes";
import type { PhaserRuntime } from "../shared/phaserTypes";
import { DAILY_PROOF_OFFICE_SCENE_KEY } from "./officeConfig";
import { OfficeBoundsMovementResolver } from "./OfficeBoundsMovementResolver";
import { OfficeExitController } from "./OfficeExitController";
import { OfficeSpawnManager } from "./OfficeSpawnManager";
import { OfficeVisualLayer } from "./OfficeVisualLayer";
import type { OfficeDefinition, OfficeSpawnRequest } from "./officeTypes";

export function createCompanyOfficeScene(PhaserRuntime: PhaserRuntime) {
  return class CompanyOfficeScene extends PhaserRuntime.Scene {
    private navigationState?: NavigationState;
    private navigationInputController?: NavigationInputController;
    private cameraController?: CameraController;
    private founderEntity?: FounderEntity;
    private founderMovementController?: FounderMovementController;
    private officeMovementResolver?: OfficeBoundsMovementResolver;
    private officeVisualLayer?: OfficeVisualLayer;
    private officeExitController?: OfficeExitController;
    private office?: OfficeDefinition;
    private spawnRequest?: OfficeSpawnRequest;

    constructor() {
      super({ key: DAILY_PROOF_OFFICE_SCENE_KEY });
    }

    init(payload?: OfficeSpawnRequest) {
      this.spawnRequest = payload;
    }

    create() {
      const spawnResolution = new OfficeSpawnManager().resolveSpawn(this.spawnRequest);
      this.office = spawnResolution.office;
      this.spawnRequest = spawnResolution.spawnRequest;
      validateOfficeSpawn(this.office);

      this.cameras.main.setBackgroundColor(0x202a3a);
      this.navigationState = createNavigationState(this.office.worldBounds, INITIAL_ZOOM);
      this.navigationInputController = new NavigationInputController();
      this.cameraController = new CameraController(this, this.navigationState);
      this.cameraController.setBounds(this.office.worldBounds);
      this.navigationInputController.setup(this, this.navigationState);
      this.events.once("shutdown", () => this.destroyOfficeControllers());

      this.officeVisualLayer = new OfficeVisualLayer(this, this.office);
      this.founderEntity = new FounderEntity(this, this.office.founderSpawn);
      if (this.spawnRequest.returnFacing) this.founderEntity.setFacing(this.spawnRequest.returnFacing);

      this.officeMovementResolver = new OfficeBoundsMovementResolver(this.office.walkableBounds);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.officeMovementResolver);
      this.officeExitController = new OfficeExitController(this, this.office, this.spawnRequest);
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
      this.office = undefined;
      this.spawnRequest = undefined;
      this.navigationState = undefined;
    }
  };
}

function validateOfficeSpawn(office: OfficeDefinition) {
  const spawn = office.founderSpawn;
  const bounds = office.walkableBounds;
  const isInside =
    spawn.x >= bounds.x &&
    spawn.x <= bounds.x + bounds.width &&
    spawn.y >= bounds.y &&
    spawn.y <= bounds.y + bounds.height;

  if (!isInside) {
    throw new Error(
      `Office ${office.sceneKey} founder spawn ${spawn.x},${spawn.y} is outside walkable bounds ${bounds.x},${bounds.y},${bounds.width},${bounds.height}.`,
    );
  }
}
