import { BuildingInteractionController } from "./buildings/BuildingInteractionController";
import { BuildingInteractionPrompt } from "./buildings/BuildingInteractionPrompt";
import { BuildingRegistry } from "./buildings/BuildingRegistry";
import { BuildingTransitionController } from "./buildings/BuildingTransitionController";
import type { CityBuildingDefinition } from "./buildings/buildingTypes";
import {
  createCityProjectOperationStatusesFromBrowserSession,
  type CityProjectOperationStatusMap,
} from "./CityProjectOperationsStatusService";
import { CITY_BUILDINGS } from "./config/cityBuildingConfig";
import { CITY_COLORS, CITY_NAVIGATION_BOUNDS, CITY_WORLD_SCENE_KEY } from "./config/cityWorldConfig";
import { FOUNDER_INITIAL_POSITION, FOUNDER_SPAWN_SEARCH_RADIUS_TILES } from "./config/founderConfig";
import { INITIAL_ZOOM } from "./config/navigationConfig";
import { FounderEntity } from "./founder/FounderEntity";
import { FounderMovementController } from "./founder/FounderMovementController";
import { createCityBuildingLayer, type CityBuildingLayerHandle } from "./layers/CityBuildingLayer";
import { createCityDecorationLayer } from "./layers/CityDecorationLayer";
import { CameraController } from "./navigation/CameraController";
import { NavigationInputController } from "./navigation/NavigationInputController";
import { NavigationMovementResolver } from "./navigation/NavigationMovementResolver";
import { createNavigationState } from "./navigation/NavigationState";
import type { NavigationState } from "./navigation/navigationTypes";
import type { CityReturnPayload } from "./office/officeTypes";
import {
  portfolioSummaryMatchesFilter,
  type PortfolioFilter,
} from "./PortfolioOperationsService";
import type { Point } from "./shared/geometry";
import type { PhaserGraphics, PhaserRuntime } from "./shared/phaserTypes";
import { CityCollisionMap } from "./tilemap/CityCollisionMap";
import { createCityTilemapLayer, loadCityTilemapAssets } from "./tilemap/CityTilemapLayer";
import { ProgressionEventFeedPanel } from "./world-state/ProgressionEventFeedPanel";
import { ProgressionRewardPresentationPanel } from "./world-state/ProgressionRewardPresentationPanel";
import type { WorldStateSnapshot } from "./world-state/WorldStateTypes";
import { AI_CITY_WORLD_ID, CITY_WORLD_SPACE_ID, WorldStateSynchronizer } from "./world-state/WorldStateSynchronizer";

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
    private worldStateSynchronizer?: WorldStateSynchronizer;
    private progressionEventFeedPanel?: ProgressionEventFeedPanel;
    private progressionRewardPresentationPanel?: ProgressionRewardPresentationPanel;
    private cityProjectOperationStatuses?: CityProjectOperationStatusMap;
    private cityBuildingGraphics?: PhaserGraphics;
    private cityBuildingLayer?: CityBuildingLayerHandle;
    private portfolioFilter: PortfolioFilter = "all";
    private portfolioFilterPrompt?: Phaser.GameObjects.Text;
    private returnPayload?: CityReturnPayload;
    private readonly handlePortfolioFilterKeyDown = (event: KeyboardEvent) => {
      const nextFilter = getPortfolioFilterFromKeyboardCode(event.code);
      if (!nextFilter) return;

      event.preventDefault();
      this.setPortfolioFilter(nextFilter);
    };

    constructor() {
      super({ key: CITY_WORLD_SCENE_KEY });
    }

    init(payload?: CityReturnPayload) {
      this.returnPayload = payload;
    }

    preload() {
      loadCityTilemapAssets(this);
    }

    getWorldStateSnapshot(): WorldStateSnapshot | undefined {
      return this.worldStateSynchronizer?.getSnapshot();
    }

    create() {
      this.cameras.main.setBackgroundColor(CITY_COLORS.grass);
      this.worldStateSynchronizer = new WorldStateSynchronizer();

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
      this.cityProjectOperationStatuses = createCityProjectOperationStatusesFromBrowserSession(CITY_BUILDINGS);

      this.cityBuildingGraphics = this.add.graphics();
      this.renderCityBuildingLayer();
      createCityDecorationLayer(this, this.add.graphics());

      const founderSpawn = resolveFounderSpawn(cityCollisionMap, this.returnPayload);
      this.founderEntity = new FounderEntity(this, founderSpawn);
      if (this.returnPayload?.returnFacing) this.founderEntity.setFacing(this.returnPayload.returnFacing);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.navigationMovementResolver);

      const buildingRegistry = new BuildingRegistry(CITY_BUILDINGS);
      this.buildingInteractionController = new BuildingInteractionController(buildingRegistry);
      this.buildingInteractionController.setup(this);
      this.buildingInteractionPrompt = new BuildingInteractionPrompt(this);
      this.buildingTransitionController = new BuildingTransitionController();
      this.progressionEventFeedPanel = new ProgressionEventFeedPanel(this);
      this.progressionRewardPresentationPanel = new ProgressionRewardPresentationPanel(this);
      this.createPortfolioFilterPrompt();
      window.addEventListener("keydown", this.handlePortfolioFilterKeyDown);

      this.cameraController.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController.update(0, this.navigationState.currentIntent);
      this.synchronizeWorldState();
      this.updateCityCanvasPortfolioProbeAttributes();
    }

    update(_: number, delta: number) {
      const intent = this.navigationInputController?.getIntent();
      if (!intent || !this.founderEntity) return;

      this.founderMovementController?.update(delta, intent);
      this.buildingInteractionController?.update(this.founderEntity.position);
      const activeBuilding = this.buildingInteractionController?.getActiveBuilding();
      this.buildingInteractionPrompt?.update(activeBuilding, activeBuilding ? this.cityProjectOperationStatuses?.[activeBuilding.id] : undefined);
      this.updateCityCanvasPortfolioProbeAttributes(activeBuilding);
      const clickedBuilding = this.buildingInteractionController?.consumeClickedBuilding();
      if (clickedBuilding) {
        const entryRequest = this.buildingTransitionController?.createEntryRequest(
          clickedBuilding,
          clickedBuilding.entrancePoint,
          this.founderEntity.state.facing,
          this.cityProjectOperationStatuses?.[clickedBuilding.id],
        );

        if (entryRequest) {
          this.updateCityCanvasPortfolioProbeAttributes(clickedBuilding, entryRequest.projectId);
          this.scene.start(entryRequest.officeSceneKey, entryRequest);
          return;
        }
      }

      if (this.buildingInteractionController?.consumeInteractionPressed(activeBuilding) && activeBuilding) {
        const entryRequest = this.buildingTransitionController?.createEntryRequest(
          activeBuilding,
          this.founderEntity.position,
          this.founderEntity.state.facing,
          this.cityProjectOperationStatuses?.[activeBuilding.id],
        );

        if (entryRequest) {
          this.updateCityCanvasPortfolioProbeAttributes(activeBuilding, entryRequest.projectId);
          this.scene.start(entryRequest.officeSceneKey, entryRequest);
          return;
        }
      }

      if (intent.isMoving || intent.source === "keyboard") {
        this.cameraController?.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      }
      this.cameraController?.update(delta, intent);
      this.synchronizeWorldState();
    }

    private synchronizeWorldState() {
      const result = this.worldStateSynchronizer?.synchronize({
        worldId: AI_CITY_WORLD_ID,
        activeWorldSpaceId: CITY_WORLD_SPACE_ID,
        sceneKey: CITY_WORLD_SCENE_KEY,
        bounds: CITY_NAVIGATION_BOUNDS,
        buildings: CITY_BUILDINGS,
        cityProjectOperationStatuses: this.cityProjectOperationStatuses,
        founderState: this.founderEntity?.state,
        effects: this.returnPayload?.worldEffects,
        rewards: this.returnPayload?.rewards,
        eventFeed: this.returnPayload?.eventFeed,
      });
      this.progressionEventFeedPanel?.update(result?.snapshot);
      this.progressionRewardPresentationPanel?.update(result?.snapshot);
      this.updateCityCanvasPortfolioProbeAttributes(this.buildingInteractionController?.getActiveBuilding());
    }

    private renderCityBuildingLayer() {
      if (!this.cityBuildingGraphics || !this.cityProjectOperationStatuses) return;

      this.cityBuildingLayer?.destroy();
      this.cityBuildingLayer = createCityBuildingLayer(this, this.cityBuildingGraphics, this.cityProjectOperationStatuses, {
        portfolioFilter: this.portfolioFilter,
      });
    }

    private createPortfolioFilterPrompt() {
      this.portfolioFilterPrompt = this.add
        .text(24, 670, "", {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#ffffff",
          backgroundColor: "rgba(37, 50, 71, 0.88)",
          padding: { x: 8, y: 5 },
        })
        .setScrollFactor(0)
        .setDepth(2000)
        .setInteractive({ useHandCursor: true });
      this.portfolioFilterPrompt.on("pointerup", () => this.setPortfolioFilter(getNextPortfolioFilter(this.portfolioFilter)));
      this.updatePortfolioFilterPrompt();
    }

    private updatePortfolioFilterPrompt() {
      this.portfolioFilterPrompt?.setText(`Filter ${getPortfolioFilterLabel(this.portfolioFilter)}  1 All 2 Active 3 Attention 4 Idle 5 Done 6 Offline`);
    }

    private setPortfolioFilter(filter: PortfolioFilter) {
      if (this.portfolioFilter === filter) return;

      this.portfolioFilter = filter;
      this.renderCityBuildingLayer();
      this.updatePortfolioFilterPrompt();
      this.updateCityCanvasPortfolioProbeAttributes(this.buildingInteractionController?.getActiveBuilding());
    }

    private updateCityCanvasPortfolioProbeAttributes(activeBuilding?: CityBuildingDefinition, lastEntryProjectId?: string) {
      if (typeof document === "undefined") return;
      const host = this.game?.canvas?.parentElement;
      if (!(host instanceof HTMLElement) || !this.cityProjectOperationStatuses) return;

      const statuses = Object.values(this.cityProjectOperationStatuses);
      host.setAttribute("data-aiverse-active-scene", "city");
      host.setAttribute("data-aiverse-city-canvas-portfolio-filter", this.portfolioFilter);
      host.setAttribute("data-aiverse-city-canvas-portfolio-labels", formatPortfolioLabels(statuses));
      host.setAttribute(
        "data-aiverse-city-canvas-filtered-portfolio-labels",
        formatPortfolioLabels(statuses.filter((status) => portfolioSummaryMatchesFilter(status.portfolioSummary, this.portfolioFilter))),
      );
      if (activeBuilding) {
        const status = this.cityProjectOperationStatuses[activeBuilding.id];
        host.setAttribute("data-aiverse-city-canvas-active-building-id", activeBuilding.id);
        host.setAttribute("data-aiverse-city-canvas-active-project-id", status?.projectId ?? activeBuilding.projectBinding?.projectId ?? "");
        host.setAttribute("data-aiverse-city-canvas-active-portfolio-label", status?.label ?? "");
      }
      if (lastEntryProjectId) host.setAttribute("data-aiverse-city-canvas-last-entry-project-id", lastEntryProjectId);
    }

    private destroyNavigationControllers() {
      window.removeEventListener("keydown", this.handlePortfolioFilterKeyDown);
      this.navigationInputController?.destroy();
      this.cameraController?.destroy();
      this.founderEntity?.destroy();
      this.buildingInteractionController?.destroy(this);
      this.buildingInteractionPrompt?.destroy();
      this.buildingTransitionController?.destroy();
      this.cityBuildingLayer?.destroy();
      this.cityBuildingGraphics?.destroy();
      this.portfolioFilterPrompt?.destroy();
      this.progressionEventFeedPanel?.destroy();
      this.progressionRewardPresentationPanel?.destroy();
      this.worldStateSynchronizer = undefined;
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.navigationMovementResolver = undefined;
      this.founderMovementController = undefined;
      this.founderEntity = undefined;
      this.buildingInteractionController = undefined;
      this.buildingInteractionPrompt = undefined;
      this.buildingTransitionController = undefined;
      this.cityBuildingLayer = undefined;
      this.cityBuildingGraphics = undefined;
      this.portfolioFilterPrompt = undefined;
      this.progressionEventFeedPanel = undefined;
      this.progressionRewardPresentationPanel = undefined;
      this.cityProjectOperationStatuses = undefined;
      this.returnPayload = undefined;
      this.navigationState = undefined;
    }
  };
}

const PORTFOLIO_FILTER_SEQUENCE: PortfolioFilter[] = ["all", "active", "attention", "idle", "completed", "disconnected"];

function getPortfolioFilterFromKeyboardCode(code: string): PortfolioFilter | undefined {
  if (code === "Digit1" || code === "Numpad1") return "all";
  if (code === "Digit2" || code === "Numpad2") return "active";
  if (code === "Digit3" || code === "Numpad3") return "attention";
  if (code === "Digit4" || code === "Numpad4") return "idle";
  if (code === "Digit5" || code === "Numpad5") return "completed";
  if (code === "Digit6" || code === "Numpad6") return "disconnected";
  return undefined;
}

function getNextPortfolioFilter(current: PortfolioFilter): PortfolioFilter {
  const currentIndex = PORTFOLIO_FILTER_SEQUENCE.indexOf(current);
  return PORTFOLIO_FILTER_SEQUENCE[(currentIndex + 1) % PORTFOLIO_FILTER_SEQUENCE.length] ?? "all";
}

function getPortfolioFilterLabel(filter: PortfolioFilter) {
  if (filter === "all") return "ALL";
  if (filter === "active") return "ACTIVE";
  if (filter === "attention") return "ATTENTION";
  if (filter === "idle") return "IDLE";
  if (filter === "completed") return "DONE";
  return "OFFLINE";
}

function formatPortfolioLabels(statuses: ReadonlyArray<CityProjectOperationStatusMap[string]>) {
  return statuses
    .map((status) => `${status.projectId ?? "unknown"}:${status.label}`)
    .join("|");
}

function resolveFounderSpawn(collisionMap: CityCollisionMap, returnPayload?: CityReturnPayload): Point {
  const returnPosition = getValidReturnPosition(returnPayload);
  if (returnPosition && !collisionMap.isBlockedWorldPoint(returnPosition)) {
    return { ...returnPosition };
  }

  const configuredSpawn = returnPosition ? { ...returnPosition } : { ...FOUNDER_INITIAL_POSITION };
  if (!collisionMap.isBlockedWorldPoint(configuredSpawn)) return configuredSpawn;

  const openSpawn = collisionMap.findNearestOpenTileCenter(configuredSpawn, FOUNDER_SPAWN_SEARCH_RADIUS_TILES);
  if (openSpawn) return openSpawn;

  const spawnSource = returnPosition ? "city return" : "Founder";
  throw new Error(
    `${spawnSource} spawn ${configuredSpawn.x},${configuredSpawn.y} is blocked and no open tile was found within ${FOUNDER_SPAWN_SEARCH_RADIUS_TILES} tiles.`,
  );
}

function getValidReturnPosition(returnPayload?: CityReturnPayload): Point | undefined {
  const position = returnPayload?.returnPosition;
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return undefined;

  return position;
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
