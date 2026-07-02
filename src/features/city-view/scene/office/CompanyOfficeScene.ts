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
import { OfficeActionInputController } from "./OfficeActionInputController";
import { OfficeCollisionMap } from "./OfficeCollisionMap";
import { OfficeExitController } from "./OfficeExitController";
import { EmployeeInsightOverlay } from "./insight/EmployeeInsightOverlay";
import { EmployeeInsightService } from "./insight/EmployeeInsightService";
import { OfficeInteractionController } from "./OfficeInteractionController";
import { OfficeInteractionPrompt } from "./OfficeInteractionPrompt";
import { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { OfficeEmployeeNpcRenderer } from "./npc/OfficeEmployeeNpcRenderer";
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
    private officeActionInputController?: OfficeActionInputController;
    private officeInteractionController?: OfficeInteractionController;
    private officeInteractionPrompt?: OfficeInteractionPrompt;
    private officeProjectPortalController?: OfficeProjectPortalController;
    private officeEmployeeNpcRenderer?: OfficeEmployeeNpcRenderer;
    private employeeInsightService?: EmployeeInsightService;
    private employeeInsightOverlay?: EmployeeInsightOverlay;
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
      this.officeActionInputController = new OfficeActionInputController();
      this.officeActionInputController.setup(this);
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

      const objectRegistry = OfficeInteractiveObjectRegistry.fromTilemapLayers(configuredOffice, this.officeTilemapLayers);
      this.officeInteractionController = new OfficeInteractionController(objectRegistry);
      this.officeInteractionPrompt = new OfficeInteractionPrompt(this);
      this.officeProjectPortalController = new OfficeProjectPortalController(this);
      this.officeEmployeeNpcRenderer = new OfficeEmployeeNpcRenderer(this);
      this.employeeInsightService = new EmployeeInsightService();
      this.employeeInsightOverlay = new EmployeeInsightOverlay(this);
      void this.officeProjectPortalController.initializeEmployeeSimulationSnapshots().then(() => {
        this.refreshEmployeeNpcRenderer();
        this.refreshEmployeeInsightOverlay();
      });
      this.officeMovementResolver = new OfficeTileMovementResolver(this.officeCollisionMap);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.officeMovementResolver);
      this.officeExitController = new OfficeExitController(this, this.office, this.requireSpawnRequest());

      this.cameraController.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController.update(0, this.navigationState.currentIntent);
    }

    update(_: number, delta: number) {
      if (!this.founderEntity || !this.spawnRequest) return;

      const actionPressed = this.officeActionInputController?.consumeActionPressed() ?? false;
      const escapePressed = this.officeActionInputController?.consumeEscapePressed() ?? false;
      const upPressed = this.officeActionInputController?.consumeUpPressed() ?? false;
      const downPressed = this.officeActionInputController?.consumeDownPressed() ?? false;
      const enterPressed = this.officeActionInputController?.consumeEnterPressed() ?? false;

      if (this.officeProjectPortalController?.isOpen()) {
        this.officeProjectPortalController.updateInput({
          actionPressed,
          escapePressed,
          upPressed,
          downPressed,
          enterPressed,
        });
        this.refreshEmployeeNpcRenderer();
        this.refreshEmployeeInsightOverlay({ isBlockingOverlayOpen: true });
        return;
      }

      const intent = this.navigationInputController?.getIntent();
      if (!intent) return;

      this.founderMovementController?.update(delta, intent);
      this.officeExitController?.update(this.founderEntity.position);
      this.officeInteractionController?.update(this.founderEntity.position);

      const isExitActive = this.officeExitController?.isExitActive() ?? false;
      const activeObject = isExitActive ? undefined : this.officeInteractionController?.getActiveObject();
      this.officeInteractionPrompt?.update(activeObject);

      if (actionPressed) {
        const returnPayload = this.officeExitController?.createReturnPayload(this.founderEntity.state.facing);
        if (returnPayload) {
          this.scene.start(this.spawnRequest.returnSceneKey, returnPayload);
          return;
        }

        const interactionResult = this.officeInteractionController?.consumePlaceholderInteraction();
        if (interactionResult?.action === "use_computer") {
          this.officeInteractionPrompt?.update(undefined);
          this.officeProjectPortalController?.open();
        }
      }

      this.cameraController?.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController?.update(delta, intent);
      this.refreshEmployeeNpcRenderer();
      this.refreshEmployeeInsightOverlay();
    }

    private refreshEmployeeNpcRenderer() {
      const viewModels = this.officeProjectPortalController?.getEmployeeNpcViewModels() ?? [];
      this.officeEmployeeNpcRenderer?.render(viewModels);
    }

    private refreshEmployeeInsightOverlay(options: { isBlockingOverlayOpen?: boolean } = {}) {
      if (!this.founderEntity || !this.employeeInsightService || !this.employeeInsightOverlay) return;

      const insightState = this.employeeInsightService.getInsightState(
        this.founderEntity.position,
        this.officeProjectPortalController?.getEmployeeInsightSources() ?? [],
        options,
      );

      if (insightState.viewModel) {
        this.employeeInsightOverlay.update(insightState.viewModel);
        return;
      }

      this.employeeInsightOverlay.hide();
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
      this.officeActionInputController?.destroy(this);
      this.officeInteractionController?.destroy();
      this.officeInteractionPrompt?.destroy();
      this.employeeInsightOverlay?.destroy();
      this.officeEmployeeNpcRenderer?.destroy();
      this.officeProjectPortalController?.destroy();
      this.officeExitController?.destroy();
      this.officeVisualLayer?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.founderMovementController = undefined;
      this.officeMovementResolver = undefined;
      this.founderEntity = undefined;
      this.officeActionInputController = undefined;
      this.officeInteractionController = undefined;
      this.officeInteractionPrompt = undefined;
      this.officeProjectPortalController = undefined;
      this.officeEmployeeNpcRenderer = undefined;
      this.employeeInsightService = undefined;
      this.employeeInsightOverlay = undefined;
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
