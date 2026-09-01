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
import { validateInteriorFoundation } from "./OfficeInteriorFoundation";
import { validateVisualEnvironment } from "./OfficeVisualEnvironment";
import { EmployeeConversationBubbleOverlay } from "./conversations/EmployeeConversationBubbleOverlay";
import { EmployeeInsightOverlay } from "./insight/EmployeeInsightOverlay";
import { EmployeeInsightService } from "./insight/EmployeeInsightService";
import type { EmployeeInsightTarget } from "./insight/EmployeeInsightTypes";
import { EmployeeKnowledgeOverlay } from "./knowledge/EmployeeKnowledgeOverlay";
import { EmployeeKnowledgeService } from "./knowledge/EmployeeKnowledgeService";
import { OfficeInteractionController } from "./OfficeInteractionController";
import { OfficeInteractionPrompt } from "./OfficeInteractionPrompt";
import { OfficeInteractiveObjectRegistry } from "./OfficeInteractiveObjectRegistry";
import { OfficeLevelUpReactionLayer } from "./OfficeLevelUpReactionLayer";
import { OfficeProgressionVisualStateLayer } from "./OfficeProgressionVisualStateLayer";
import { OfficeProjectPortalController } from "./OfficeProjectPortalController";
import { ReceptionDeskRuntimeSpawnService } from "./ReceptionDeskRuntimeSpawnService";
import { OfficeEmployeeNpcRenderer } from "./npc/OfficeEmployeeNpcRenderer";
import { OfficeSpawnManager } from "./OfficeSpawnManager";
import { OfficeTileMovementResolver } from "./OfficeTileMovementResolver";
import { createOfficeTilemapLayer, loadOfficeTilemapAssets, type OfficeTilemapLayers } from "./OfficeTilemapLayer";
import { OfficeVisualLayer } from "./OfficeVisualLayer";
import type { OfficeDefinition, OfficeInteractiveAction, OfficeSpawnRequest } from "./officeTypes";

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
    private officeLevelUpReactionLayer?: OfficeLevelUpReactionLayer;
    private officeProgressionVisualStateLayer?: OfficeProgressionVisualStateLayer;
    private officeProjectPortalController?: OfficeProjectPortalController;
    private receptionDeskRuntimeSpawnService?: ReceptionDeskRuntimeSpawnService;
    private officeInteractiveObjectRegistry?: OfficeInteractiveObjectRegistry;
    private officeEmployeeNpcRenderer?: OfficeEmployeeNpcRenderer;
    private employeeConversationBubbleOverlay?: EmployeeConversationBubbleOverlay;
    private employeeInsightService?: EmployeeInsightService;
    private employeeInsightOverlay?: EmployeeInsightOverlay;
    private currentEmployeeInsightTarget?: EmployeeInsightTarget;
    private employeeKnowledgeService?: EmployeeKnowledgeService;
    private employeeKnowledgeOverlay?: EmployeeKnowledgeOverlay;
    private developmentRequestTextArea?: HTMLTextAreaElement;
    private projectBacklogForm?: ProjectBacklogFormElements;
    private officeTilemapLayers?: OfficeTilemapLayers;
    private officeCollisionMap?: OfficeCollisionMap;
    private office?: OfficeDefinition;
    private spawnRequest?: OfficeSpawnRequest;
    private receptionDeskRuntimeSpawnObjectId?: string;
    private receptionDeskRuntimeSpawnSignature?: string;

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
      validateInteriorFoundation(this.office);
      validateVisualEnvironment(this.office);
      validateOfficeLayout(this.office, this.officeCollisionMap);

      this.officeInteractiveObjectRegistry = OfficeInteractiveObjectRegistry.fromTilemapLayers(configuredOffice, this.officeTilemapLayers);
      this.officeVisualLayer = new OfficeVisualLayer(this, this.office, this.officeInteractiveObjectRegistry.getObjects());
      this.founderEntity = new FounderEntity(this, this.office.founderSpawn);
      if (this.spawnRequest?.returnFacing) this.founderEntity.setFacing(this.spawnRequest.returnFacing);

      this.officeInteractionController = new OfficeInteractionController(this.officeInteractiveObjectRegistry);
      this.officeInteractionController.setup(this);
      this.officeInteractionPrompt = new OfficeInteractionPrompt(this);
      this.officeProgressionVisualStateLayer = new OfficeProgressionVisualStateLayer(this);
      this.officeLevelUpReactionLayer = new OfficeLevelUpReactionLayer(this);
      this.officeProjectPortalController = new OfficeProjectPortalController(this, {
        activeProjectId: this.spawnRequest?.projectId,
        activeProjectBindingId: this.spawnRequest?.projectBindingId,
        activeProjectBuildingId: this.spawnRequest?.buildingId,
        activeProjectCompanyName: this.spawnRequest?.companyName,
      });
      this.receptionDeskRuntimeSpawnService = new ReceptionDeskRuntimeSpawnService();
      this.officeEmployeeNpcRenderer = new OfficeEmployeeNpcRenderer(this);
      this.employeeConversationBubbleOverlay = new EmployeeConversationBubbleOverlay(this);
      this.employeeInsightService = new EmployeeInsightService();
      this.employeeInsightOverlay = new EmployeeInsightOverlay(this);
      this.employeeKnowledgeService = new EmployeeKnowledgeService();
      this.employeeKnowledgeOverlay = new EmployeeKnowledgeOverlay(this);
      void this.officeProjectPortalController.initializeEmployeeSimulationSnapshots().then(() => {
        this.refreshEmployeeNpcRenderer();
        this.refreshEmployeeInsightOverlay();
        this.refreshLiveAgentWorkVisualization();
      });
      this.officeMovementResolver = new OfficeTileMovementResolver(this.officeCollisionMap);
      this.founderMovementController = new FounderMovementController(this.founderEntity, this.officeMovementResolver);
      this.officeExitController = new OfficeExitController(this, this.office, this.requireSpawnRequest());

      this.cameraController.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      this.cameraController.update(0, this.navigationState.currentIntent);
      this.refreshOfficeProgressionVisualState();
      this.refreshLiveAgentWorkVisualization();
      this.updateOfficeProbeAttributes();
    }

    update(_: number, delta: number) {
      if (!this.founderEntity || !this.spawnRequest) return;

      const actionPressed = this.officeActionInputController?.consumeActionPressed() ?? false;
      const escapePressed = this.officeActionInputController?.consumeEscapePressed() ?? false;
      const upPressed = this.officeActionInputController?.consumeUpPressed() ?? false;
      const downPressed = this.officeActionInputController?.consumeDownPressed() ?? false;
      const enterPressed = this.officeActionInputController?.consumeEnterPressed() ?? false;
      const openCandidateDetailPressed = this.officeActionInputController?.consumeOpenCandidateDetailPressed() ?? false;
      const approveCandidateDetailPressed = this.officeActionInputController?.consumeApproveCandidateDetailPressed() ?? false;
      const deferCandidateDetailPressed = this.officeActionInputController?.consumeDeferCandidateDetailPressed() ?? false;
      const rejectCandidateDetailPressed = this.officeActionInputController?.consumeRejectCandidateDetailPressed() ?? false;
      const startImplementerPressed = this.officeActionInputController?.consumeStartImplementerPressed() ?? false;
      const startReviewerPressed = this.officeActionInputController?.consumeStartReviewerPressed() ?? false;
      const promoteReviewPressed = this.officeActionInputController?.consumePromoteReviewPressed() ?? false;
      const requestReviewFixPressed = this.officeActionInputController?.consumeRequestReviewFixPressed() ?? false;
      const planReviewFixPressed = this.officeActionInputController?.consumePlanReviewFixPressed() ?? false;
      const startReviewFixRuntimePressed = this.officeActionInputController?.consumeStartReviewFixRuntimePressed() ?? false;
      const startValidationRuntimePressed = this.officeActionInputController?.consumeStartValidationRuntimePressed() ?? false;
      const preparePostValidationReviewTargetPressed = this.officeActionInputController?.consumePreparePostValidationReviewTargetPressed() ?? false;
      const startPostValidationReviewPressed = this.officeActionInputController?.consumeStartPostValidationReviewPressed() ?? false;
      const startBacklogDevelopmentPressed = this.officeActionInputController?.consumeStartBacklogDevelopmentPressed() ?? false;
      const generateBacklogSuggestionsPressed = this.officeActionInputController?.consumeGenerateBacklogSuggestionsPressed() ?? false;
      const acceptBacklogSuggestionPressed = this.officeActionInputController?.consumeAcceptBacklogSuggestionPressed() ?? false;
      const rejectBacklogSuggestionPressed = this.officeActionInputController?.consumeRejectBacklogSuggestionPressed() ?? false;

      if (this.officeProjectPortalController?.isOpen()) {
        this.navigationInputController?.setPointerNavigationEnabled(false);
        this.officeInteractionController?.setPointerInteractionEnabled(false);
        const developmentRequestText = this.officeProjectPortalController.shouldShowDevelopmentRequestInput()
          ? this.syncDevelopmentRequestTextArea()
          : this.hideDevelopmentRequestTextArea();
        if (this.officeProjectPortalController.shouldShowProjectBacklogInput()) {
          this.syncProjectBacklogForm();
        } else {
          this.hideProjectBacklogForm();
        }
        this.officeProjectPortalController.updateInput({
          actionPressed,
          escapePressed,
          upPressed,
          downPressed,
          enterPressed,
          openCandidateDetailPressed,
          approveCandidateDetailPressed,
          deferCandidateDetailPressed,
          rejectCandidateDetailPressed,
          startImplementerPressed,
          startReviewerPressed,
          promoteReviewPressed,
          requestReviewFixPressed,
          planReviewFixPressed,
          startReviewFixRuntimePressed,
          startValidationRuntimePressed,
          preparePostValidationReviewTargetPressed,
          startPostValidationReviewPressed,
          startBacklogDevelopmentPressed,
          generateBacklogSuggestionsPressed,
          acceptBacklogSuggestionPressed,
          rejectBacklogSuggestionPressed,
          developmentRequestText,
        });
        this.refreshEmployeeNpcRenderer();
        this.refreshLiveAgentWorkVisualization();
        this.refreshEmployeeInsightOverlay({ isBlockingOverlayOpen: true });
        this.employeeConversationBubbleOverlay?.hide();
        this.refreshOfficeProgressionVisualState();
        this.updateOfficeProbeAttributes();
        return;
      }
      this.hideDevelopmentRequestTextArea();
      this.hideProjectBacklogForm();
      this.navigationInputController?.setPointerNavigationEnabled(true);
      this.officeInteractionController?.setPointerInteractionEnabled(true);

      const intent = this.navigationInputController?.getIntent();
      if (!intent) return;

      this.founderMovementController?.update(delta, intent);
      this.officeExitController?.update(this.founderEntity.position);
      this.officeInteractionController?.update(this.founderEntity.position);

      const isExitActive = this.officeExitController?.isExitActive() ?? false;
      const activeObject = isExitActive ? undefined : this.officeInteractionController?.getActiveObject();
      this.officeInteractionPrompt?.update(activeObject);
      this.refreshEmployeeInsightOverlay();

      const clickedInteractionResult = this.officeInteractionController?.consumeClickedInteraction();
      if (clickedInteractionResult && opensProjectWorkspace(clickedInteractionResult.action)) {
        this.officeInteractionPrompt?.update(undefined);
        this.officeProjectPortalController?.open();
        this.employeeConversationBubbleOverlay?.hide();
      } else if (actionPressed) {
        const growthLoop = this.officeProjectPortalController?.getCompanyGrowthGameplayLoopResult();
        const returnPayload = this.officeExitController?.createReturnPayload(
          this.founderEntity.state.facing,
          growthLoop?.effects,
          growthLoop?.rewards,
          growthLoop?.eventFeed,
        );
        if (returnPayload) {
          this.scene.start(this.spawnRequest.returnSceneKey, returnPayload);
          return;
        }

        const interactionResult = this.officeInteractionController?.consumePlaceholderInteraction();
        if (interactionResult && opensProjectWorkspace(interactionResult.action)) {
          this.officeInteractionPrompt?.update(undefined);
          this.officeProjectPortalController?.open();
          this.employeeConversationBubbleOverlay?.hide();
        } else if (!interactionResult) {
          this.showNearbyEmployeeConversationBubble();
        }
      }

      if (intent.isMoving || intent.source === "keyboard") {
        this.cameraController?.focusWorldPoint(this.founderEntity.position, { targetId: this.founderEntity.state.id });
      }
      this.cameraController?.update(delta, intent);
      this.refreshEmployeeNpcRenderer();
      this.refreshLiveAgentWorkVisualization();
      this.refreshEmployeeInsightOverlay();
      this.employeeConversationBubbleOverlay?.update(this.time.now);
      this.refreshOfficeProgressionVisualState();
      this.updateOfficeProbeAttributes();
    }

    private refreshOfficeProgressionVisualState() {
      const progression = this.officeProjectPortalController?.getCompanyProgressionSnapshot();
      const activeLayout = this.officeProjectPortalController?.getActiveOfficeLayout();

      this.syncReceptionDeskRuntimeSpawn(progression, activeLayout);
      this.officeProgressionVisualStateLayer?.update(progression, activeLayout);
      this.officeLevelUpReactionLayer?.update(this.officeProjectPortalController?.getCompanyProgressionTriggers());
    }

    private syncReceptionDeskRuntimeSpawn(progression: ReturnType<OfficeProjectPortalController["getCompanyProgressionSnapshot"]> | undefined, activeLayout: ReturnType<OfficeProjectPortalController["getActiveOfficeLayout"]> | undefined) {
      if (!this.office || !this.officeInteractiveObjectRegistry || !this.officeVisualLayer || !this.receptionDeskRuntimeSpawnService || !progression || !activeLayout) {
        return;
      }

      const receptionDesk = this.receptionDeskRuntimeSpawnService.createReceptionDeskInteractable({
        office: this.office,
        progression,
        layout: activeLayout,
      });

      if (!receptionDesk) {
        if (!this.receptionDeskRuntimeSpawnObjectId) return;

        this.officeInteractiveObjectRegistry.removeObject(this.receptionDeskRuntimeSpawnObjectId);
        this.receptionDeskRuntimeSpawnObjectId = undefined;
        this.receptionDeskRuntimeSpawnSignature = undefined;
        this.officeVisualLayer.refreshInteractiveObjects(this, this.officeInteractiveObjectRegistry.getObjects());
        return;
      }

      const nextSignature = createReceptionDeskRuntimeSpawnSignature(receptionDesk);
      if (this.receptionDeskRuntimeSpawnObjectId === receptionDesk.id && this.receptionDeskRuntimeSpawnSignature === nextSignature) {
        return;
      }

      if (this.receptionDeskRuntimeSpawnObjectId && this.receptionDeskRuntimeSpawnObjectId !== receptionDesk.id) {
        this.officeInteractiveObjectRegistry.removeObject(this.receptionDeskRuntimeSpawnObjectId);
      }

      this.officeInteractiveObjectRegistry.registerObject(receptionDesk);
      this.receptionDeskRuntimeSpawnObjectId = receptionDesk.id;
      this.receptionDeskRuntimeSpawnSignature = nextSignature;
      this.officeVisualLayer.refreshInteractiveObjects(this, this.officeInteractiveObjectRegistry.getObjects());
    }

    private refreshEmployeeNpcRenderer() {
      const viewModels = this.officeProjectPortalController?.getEmployeeNpcViewModels() ?? [];
      this.officeEmployeeNpcRenderer?.render(viewModels);
    }

    private refreshLiveAgentWorkVisualization() {
      const workState = this.officeProjectPortalController?.getLiveAgentWorkState();
      this.officeVisualLayer?.updateLiveAgentWorkState(workState);
    }

    private updateOfficeProbeAttributes() {
      if (typeof document === "undefined") return;
      const host = this.game?.canvas?.parentElement;
      if (!(host instanceof HTMLElement)) return;

      const workState = this.officeProjectPortalController?.getLiveAgentWorkState();
      const activeObject = this.officeInteractionController?.getActiveObject();
      host.setAttribute("data-aiverse-active-scene", "office");
      host.setAttribute("data-aiverse-office-project-id", workState?.projectId ?? this.spawnRequest?.projectId ?? "");
      host.setAttribute("data-aiverse-office-work-stage", workState?.stage ?? "unknown");
      host.setAttribute("data-aiverse-office-work-lifecycle", workState?.lifecycle ?? "unknown");
      host.setAttribute("data-aiverse-office-company-name", this.spawnRequest?.companyName ?? "");
      host.setAttribute("data-aiverse-office-active-object-id", activeObject?.id ?? "");
      host.setAttribute("data-aiverse-office-active-object-action", activeObject?.action ?? "");
      const backlogProbe = this.officeProjectPortalController?.getProjectBacklogProbeState();
      host.setAttribute("data-aiverse-office-portal-view-mode", backlogProbe?.viewMode ?? "");
      host.setAttribute("data-aiverse-office-backlog-project-id", backlogProbe?.projectId ?? "");
      host.setAttribute("data-aiverse-office-backlog-task-count", String(backlogProbe?.taskCount ?? 0));
      host.setAttribute("data-aiverse-office-backlog-task-titles", JSON.stringify(backlogProbe?.taskTitles ?? []));
      host.setAttribute("data-aiverse-office-backlog-selected-task-id", backlogProbe?.selectedTaskId ?? "");
      host.setAttribute("data-aiverse-office-backlog-selected-task-title", backlogProbe?.selectedTaskTitle ?? "");
      host.setAttribute("data-aiverse-office-backlog-selected-task-status", backlogProbe?.selectedTaskStatus ?? "");
      host.setAttribute("data-aiverse-office-backlog-selected-task-priority", backlogProbe?.selectedTaskPriority ?? "");
      host.setAttribute("data-aiverse-office-backlog-selected-blocked-reason", backlogProbe?.selectedTaskBlockedReason ?? "");
      host.setAttribute(
        "data-aiverse-office-founder-position",
        this.founderEntity ? `${Math.round(this.founderEntity.position.x)},${Math.round(this.founderEntity.position.y)}` : "",
      );
      host.setAttribute("data-aiverse-office-exit-active", String(this.officeExitController?.isExitActive() ?? false));
    }

    private refreshEmployeeInsightOverlay(options: { isBlockingOverlayOpen?: boolean } = {}) {
      if (!this.founderEntity || !this.employeeInsightService || !this.employeeInsightOverlay) return;

      const insightState = this.employeeInsightService.getInsightState(
        this.founderEntity.position,
        this.officeProjectPortalController?.getEmployeeInsightSources() ?? [],
        options,
      );

      if (insightState.viewModel) {
        this.currentEmployeeInsightTarget = insightState.target;
        this.employeeInsightOverlay.update(insightState.viewModel);
        this.refreshEmployeeKnowledgeOverlay(insightState.target);
        return;
      }

      this.currentEmployeeInsightTarget = undefined;
      this.employeeInsightOverlay.hide();
      this.employeeKnowledgeOverlay?.hide();
    }

    private showNearbyEmployeeConversationBubble() {
      const employeeId = this.currentEmployeeInsightTarget?.employeeId;
      if (!employeeId) return;

      const viewModel = this.officeProjectPortalController?.getEmployeeConversationViewModel(employeeId);
      if (!viewModel) return;

      this.employeeConversationBubbleOverlay?.show(viewModel, this.time.now);
    }

    private refreshEmployeeKnowledgeOverlay(insightTarget: ReturnType<EmployeeInsightService["getInsightState"]>["target"]) {
      if (!this.employeeKnowledgeService || !this.employeeKnowledgeOverlay) return;

      const knowledgeSource = this.officeProjectPortalController?.getEmployeeKnowledgeSource(insightTarget);
      const knowledgeState = this.employeeKnowledgeService.getKnowledgeState(knowledgeSource);

      if (knowledgeState.viewModel) {
        this.employeeKnowledgeOverlay.update(knowledgeState.viewModel);
        return;
      }

      this.employeeKnowledgeOverlay.hide();
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
      this.officeInteractionController?.destroy(this);
      this.officeInteractionPrompt?.destroy();
      this.officeProgressionVisualStateLayer?.destroy();
      this.officeLevelUpReactionLayer?.destroy();
      this.employeeInsightOverlay?.destroy();
      this.employeeKnowledgeOverlay?.destroy();
      this.employeeConversationBubbleOverlay?.destroy();
      this.officeEmployeeNpcRenderer?.destroy();
      this.officeProjectPortalController?.destroy();
      this.officeExitController?.destroy();
      this.officeVisualLayer?.destroy();
      this.navigationInputController = undefined;
      this.cameraController = undefined;
      this.founderMovementController = undefined;
      this.officeMovementResolver = undefined;
      this.officeInteractiveObjectRegistry = undefined;
      this.founderEntity = undefined;
      this.officeActionInputController = undefined;
      this.officeInteractionController = undefined;
      this.officeInteractionPrompt = undefined;
      this.officeProgressionVisualStateLayer = undefined;
      this.officeLevelUpReactionLayer = undefined;
      this.officeProjectPortalController = undefined;
      this.receptionDeskRuntimeSpawnService = undefined;
      this.officeEmployeeNpcRenderer = undefined;
      this.employeeConversationBubbleOverlay = undefined;
      this.employeeInsightService = undefined;
      this.employeeInsightOverlay = undefined;
      this.currentEmployeeInsightTarget = undefined;
      this.employeeKnowledgeService = undefined;
      this.employeeKnowledgeOverlay = undefined;
      this.officeExitController = undefined;
      this.officeVisualLayer = undefined;
      this.destroyDevelopmentRequestTextArea();
      this.destroyProjectBacklogForm();
      this.officeTilemapLayers = undefined;
      this.officeCollisionMap = undefined;
      this.office = undefined;
      this.spawnRequest = undefined;
      this.receptionDeskRuntimeSpawnObjectId = undefined;
      this.receptionDeskRuntimeSpawnSignature = undefined;
      this.navigationState = undefined;
    }

    private syncDevelopmentRequestTextArea() {
      const textArea = this.getDevelopmentRequestTextArea();
      const canvasBounds = this.game.canvas.getBoundingClientRect();
      const width = Math.min(520, Math.max(280, canvasBounds.width - 160));
      const height = 76;
      textArea.style.left = `${canvasBounds.left + (canvasBounds.width - width) / 2}px`;
      textArea.style.top = `${canvasBounds.top + Math.max(92, canvasBounds.height - 172)}px`;
      textArea.style.width = `${width}px`;
      textArea.style.height = `${height}px`;
      textArea.style.display = "block";
      return textArea.value;
    }

    private getDevelopmentRequestTextArea() {
      if (this.developmentRequestTextArea) return this.developmentRequestTextArea;

      const textArea = document.createElement("textarea");
      textArea.setAttribute("aria-label", "Development request");
      textArea.placeholder = "Enter development request for this project...";
      textArea.spellcheck = true;
      Object.assign(textArea.style, {
        position: "fixed",
        zIndex: "3100",
        display: "none",
        resize: "none",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        background: "#020617",
        color: "#f8fafc",
        padding: "10px",
        font: "13px Courier New, monospace",
        outline: "none",
        boxSizing: "border-box",
      });
      textArea.addEventListener("keydown", stopPortalShortcutPropagation);
      textArea.addEventListener("keyup", stopPortalShortcutPropagation);
      document.body.appendChild(textArea);
      this.developmentRequestTextArea = textArea;
      return textArea;
    }

    private hideDevelopmentRequestTextArea() {
      if (this.developmentRequestTextArea) this.developmentRequestTextArea.style.display = "none";
      return undefined;
    }

    private destroyDevelopmentRequestTextArea() {
      if (!this.developmentRequestTextArea) return;
      this.developmentRequestTextArea.removeEventListener("keydown", stopPortalShortcutPropagation);
      this.developmentRequestTextArea.removeEventListener("keyup", stopPortalShortcutPropagation);
      this.developmentRequestTextArea.remove();
      this.developmentRequestTextArea = undefined;
    }

    private syncProjectBacklogForm() {
      const form = this.getProjectBacklogForm();
      const canvasBounds = this.game.canvas.getBoundingClientRect();
      const selectedTask = this.officeProjectPortalController?.getSelectedProjectBacklogTaskInput();
      const probe = this.officeProjectPortalController?.getProjectBacklogProbeState();
      if (form.lastSelectedTaskId !== selectedTask?.id) {
        form.titleInput.value = selectedTask?.title ?? "";
        form.descriptionInput.value = selectedTask?.description ?? "";
        form.prioritySelect.value = selectedTask?.priority ?? "normal";
        form.statusSelect.value = selectedTask?.status ?? "backlog";
        form.blockedReasonInput.value = selectedTask?.blockedReason ?? "";
        form.lastSelectedTaskId = selectedTask?.id;
      }
      form.startDevelopmentButton.disabled = !probe?.developmentEligible;
      form.startDevelopmentButton.title = probe?.developmentEligible
        ? "Start Development"
        : probe?.developmentEligibilityReason || "Select a Ready task in an available project.";
      form.startDevelopmentButton.style.opacity = probe?.developmentEligible ? "1" : "0.52";
      form.startDevelopmentButton.style.cursor = probe?.developmentEligible ? "pointer" : "not-allowed";
      const width = Math.min(560, Math.max(300, canvasBounds.width - 144));
      const left = canvasBounds.left + (canvasBounds.width - width) / 2;
      const top = canvasBounds.top + Math.max(126, canvasBounds.height - 216);
      Object.assign(form.root.style, {
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        display: "grid",
      });
    }

    private getProjectBacklogForm() {
      if (this.projectBacklogForm) return this.projectBacklogForm;

      const root = document.createElement("div");
      const titleInput = document.createElement("input");
      const descriptionInput = document.createElement("textarea");
      const prioritySelect = document.createElement("select");
      const statusSelect = document.createElement("select");
      const blockedReasonInput = document.createElement("input");
      const createButton = document.createElement("button");
      const updateButton = document.createElement("button");
      const startDevelopmentButton = document.createElement("button");

      titleInput.setAttribute("aria-label", "Backlog task title");
      titleInput.placeholder = "Task title";
      descriptionInput.setAttribute("aria-label", "Backlog task description");
      descriptionInput.placeholder = "Task description / request text";
      blockedReasonInput.setAttribute("aria-label", "Backlog blocked reason");
      blockedReasonInput.placeholder = "Blocked reason (optional)";
      prioritySelect.setAttribute("aria-label", "Backlog task priority");
      statusSelect.setAttribute("aria-label", "Backlog task planning status");
      for (const priority of ["low", "normal", "high", "urgent"]) {
        prioritySelect.appendChild(new Option(priority, priority, priority === "normal", priority === "normal"));
      }
      for (const status of ["backlog", "ready", "in_progress", "blocked", "completed", "cancelled"]) {
        statusSelect.appendChild(new Option(status, status, status === "backlog", status === "backlog"));
      }
      createButton.textContent = "Create backlog task";
      updateButton.textContent = "Update selected task";
      startDevelopmentButton.textContent = "Start Development";

      Object.assign(root.style, {
        position: "fixed",
        zIndex: "3100",
        display: "none",
        gridTemplateColumns: "1fr 132px 132px",
        gap: "6px",
        background: "#020617",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        padding: "8px",
        boxSizing: "border-box",
      });
      for (const element of [
        titleInput,
        descriptionInput,
        prioritySelect,
        statusSelect,
        blockedReasonInput,
        createButton,
        updateButton,
        startDevelopmentButton,
      ]) {
        Object.assign(element.style, {
          minWidth: "0",
          border: "1px solid #334155",
          borderRadius: "4px",
          background: "#0f172a",
          color: "#f8fafc",
          font: "12px Courier New, monospace",
          padding: "6px",
          boxSizing: "border-box",
        });
        element.addEventListener("keydown", stopPortalShortcutPropagation);
        element.addEventListener("keyup", stopPortalShortcutPropagation);
      }
      Object.assign(descriptionInput.style, {
        gridColumn: "1 / 4",
        height: "54px",
        resize: "none",
      });
      Object.assign(blockedReasonInput.style, { gridColumn: "1 / 2" });
      Object.assign(startDevelopmentButton.style, { gridColumn: "1 / 4" });

      const createHandler = () => {
        this.officeProjectPortalController?.createBacklogTaskFromInput({
          title: titleInput.value,
          description: descriptionInput.value,
          priority: prioritySelect.value as never,
        });
      };
      const updateHandler = () => {
        this.officeProjectPortalController?.updateSelectedBacklogTaskFromInput({
          title: titleInput.value,
          description: descriptionInput.value,
          priority: prioritySelect.value as never,
          status: statusSelect.value as never,
          blockedReason: blockedReasonInput.value,
        });
      };
      const startDevelopmentHandler = () => {
        void this.officeProjectPortalController?.startSelectedBacklogTaskDevelopment();
      };
      createButton.addEventListener("click", createHandler);
      updateButton.addEventListener("click", updateHandler);
      startDevelopmentButton.addEventListener("click", startDevelopmentHandler);

      root.append(
        titleInput,
        prioritySelect,
        statusSelect,
        descriptionInput,
        blockedReasonInput,
        createButton,
        updateButton,
        startDevelopmentButton,
      );
      document.body.appendChild(root);
      this.projectBacklogForm = {
        root,
        titleInput,
        descriptionInput,
        prioritySelect,
        statusSelect,
        blockedReasonInput,
        createButton,
        updateButton,
        startDevelopmentButton,
        createHandler,
        updateHandler,
        startDevelopmentHandler,
      };
      return this.projectBacklogForm;
    }

    private hideProjectBacklogForm() {
      if (this.projectBacklogForm) this.projectBacklogForm.root.style.display = "none";
    }

    private destroyProjectBacklogForm() {
      const form = this.projectBacklogForm;
      if (!form) return;
      for (const element of [
        form.titleInput,
        form.descriptionInput,
        form.prioritySelect,
        form.statusSelect,
        form.blockedReasonInput,
        form.createButton,
        form.updateButton,
        form.startDevelopmentButton,
      ]) {
        element.removeEventListener("keydown", stopPortalShortcutPropagation);
        element.removeEventListener("keyup", stopPortalShortcutPropagation);
      }
      form.createButton.removeEventListener("click", form.createHandler);
      form.updateButton.removeEventListener("click", form.updateHandler);
      form.startDevelopmentButton.removeEventListener("click", form.startDevelopmentHandler);
      form.root.remove();
      this.projectBacklogForm = undefined;
    }
  };
}

type ProjectBacklogFormElements = {
  root: HTMLDivElement;
  titleInput: HTMLInputElement;
  descriptionInput: HTMLTextAreaElement;
  prioritySelect: HTMLSelectElement;
  statusSelect: HTMLSelectElement;
  blockedReasonInput: HTMLInputElement;
  createButton: HTMLButtonElement;
  updateButton: HTMLButtonElement;
  startDevelopmentButton: HTMLButtonElement;
  createHandler: () => void;
  updateHandler: () => void;
  startDevelopmentHandler: () => void;
  lastSelectedTaskId?: string;
};

function stopPortalShortcutPropagation(event: Event) {
  event.stopPropagation();
}

function opensProjectWorkspace(action: OfficeInteractiveAction) {
  return action === "use_computer" || action === "open_workspace";
}

function createReceptionDeskRuntimeSpawnSignature(object: ReturnType<ReceptionDeskRuntimeSpawnService["createReceptionDeskInteractable"]>) {
  if (!object) return "";
  return [object.id, object.type, object.displayName, object.enabled, object.action, object.markerId, object.interactionZone.x, object.interactionZone.y, object.interactionZone.width, object.interactionZone.height].join("|");
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
