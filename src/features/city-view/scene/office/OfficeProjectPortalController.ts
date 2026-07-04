import type { PhaserScene } from "../shared/phaserTypes";
import { AIProjectManagerService } from "./ai/AIProjectManagerService";
import { AIService } from "./ai/AIService";
import { createMockAIService } from "./ai/MockAIServiceFactory";
import { EmployeeConversationService } from "./conversations/EmployeeConversationService";
import type {
  EmployeeConversation,
  EmployeeConversationViewModel,
  NearbyEmployeeConversationTarget,
} from "./conversations/EmployeeConversationTypes";
import {
  createCompanyDashboardProviderRegistry,
  getEnabledCompanyDashboardProvider,
} from "./dashboard/CompanyDashboardProviderRegistry";
import type { CompanyDashboardProvider } from "./dashboard/CompanyDashboardTypes";
import { EmployeeAIService } from "./employees/EmployeeAIService";
import type { EmployeeAISnapshot } from "./employees/EmployeeAITypes";
import { EmployeeService } from "./employees/EmployeeService";
import { EmployeeSimulationService } from "./employees/EmployeeSimulationService";
import type { EmployeeSimulationSnapshot } from "./employees/EmployeeSimulationTypes";
import { MockEmployeeProvider } from "./employees/MockEmployeeProvider";
import { GitHubRepositoryService } from "./github/GitHubRepositoryService";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { EmployeeInsightSource, EmployeeInsightTarget } from "./insight/EmployeeInsightTypes";
import { CompanyInfluencePlanningService } from "./influence/CompanyInfluencePlanningService";
import type { CompanyFocusId, CompanyFocusSummary } from "./influence/CompanyInfluencePlanningTypes";
import type { EmployeeKnowledgeSource } from "./knowledge/EmployeeKnowledgeTypes";
import { MockGitHubRepositoryProvider } from "./github/MockGitHubRepositoryProvider";
import { OfficeLayoutService } from "./layout/OfficeLayoutService";
import type { OfficeLayoutPositionHint, OfficeLayoutSnapshot, OfficeLayoutZone } from "./layout/OfficeLayoutTypes";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { EmployeeNpcMovementService } from "./npc/EmployeeNpcMovementService";
import { resolveEmployeeNpcWorldPosition } from "./npc/EmployeeNpcPositionResolver";
import type { EmployeeNpcMovementPositionHint, EmployeeNpcMovementSnapshot } from "./npc/EmployeeNpcMovementTypes";
import type { EmployeeNpcPositionZone, EmployeeNpcViewModel } from "./npc/EmployeeNpcTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";
import { InternalSimulationProjectDashboardProvider } from "./project-dashboard/InternalSimulationProjectDashboardProvider";
import { GitHubProjectDashboardProvider } from "./project-dashboard/GitHubProjectDashboardProvider";
import type {
  ProjectDashboardProvider,
  ProjectDashboardProviderContext,
  ProjectDashboardSnapshot,
  ProjectDashboardSourceMetadata,
} from "./project-dashboard/ProjectDashboardTypes";
import { CompanyProgressionService } from "./progression/CompanyProgressionService";
import type { CompanyProgressionSnapshot } from "./progression/CompanyProgressionTypes";
import { EmployeeDailyScheduleService } from "./schedules/EmployeeDailyScheduleService";
import type {
  EmployeeDailyScheduleSnapshot,
  EmployeeSchedulePositionIntent,
} from "./schedules/EmployeeDailyScheduleTypes";
import { MockProjectTaskProvider } from "./tasks/MockProjectTaskProvider";
import { ProjectTaskService } from "./tasks/ProjectTaskService";
import type { ProjectTask, TaskActivity, TaskStatus } from "./tasks/ProjectTaskTypes";
import { MockWorkSessionProvider } from "./work-sessions/MockWorkSessionProvider";
import { WorkSessionService } from "./work-sessions/WorkSessionService";
import { WorkstationOccupancyService } from "./workstations/WorkstationOccupancyService";
import type { WorkstationSnapshot } from "./workstations/WorkstationTypes";

const CONVERSATION_PREVIEW_TIMESTAMP = "2026-01-01T00:00:00.000Z";
const CONVERSATION_POSITION_ZONES = new Set<string>([
  "desk",
  "collaboration",
  "review",
  "idle",
  "entrance",
  "workstation",
  "meetingArea",
  "breakArea",
  "idleSpot",
]);

export type OfficeProjectPortalInput = {
  actionPressed: boolean;
  escapePressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  enterPressed: boolean;
};

export class OfficeProjectPortalController {
  private readonly maxEmployeeConversationDistance = 48;
  private readonly state: ProjectPortalState;
  private readonly view: OfficeProjectPortalView;
  private readonly repositoryService: GitHubRepositoryService;
  private readonly taskService: ProjectTaskService;
  private readonly employeeService: EmployeeService;
  private readonly employeeSimulationService: EmployeeSimulationService;
  private readonly employeeNpcMovementService: EmployeeNpcMovementService;
  private readonly workstationOccupancyService: WorkstationOccupancyService;
  private readonly employeeDailyScheduleService: EmployeeDailyScheduleService;
  private readonly employeeConversationService: EmployeeConversationService;
  private readonly employeeAIService: EmployeeAIService;
  private readonly companyProgressionService: CompanyProgressionService;
  private readonly officeLayoutService: OfficeLayoutService;
  private readonly workSessionService: WorkSessionService;
  private readonly companyDashboardProvider: CompanyDashboardProvider;
  private readonly projectDashboardProvider: ProjectDashboardProvider;
  private readonly githubProjectDashboardProvider: GitHubProjectDashboardProvider;
  private readonly companyInfluencePlanningService: CompanyInfluencePlanningService;
  private readonly aiService: AIService;
  private readonly aiProjectManagerService: AIProjectManagerService;
  private repositoryRequestVersion = 0;
  private taskRequestVersion = 0;
  private employeeRequestVersion = 0;
  private employeeNpcBootstrapRequestVersion = 0;
  private taskAnalysisRequestVersion = 0;
  private employeeRecommendationRequestVersion = 0;
  private projectManagerRequestVersion = 0;

  constructor(scene: PhaserScene) {
    this.state = createProjectPortalState();
    this.view = new OfficeProjectPortalView(scene, this.state);
    this.repositoryService = new GitHubRepositoryService(new MockGitHubRepositoryProvider());
    this.taskService = new ProjectTaskService(new MockProjectTaskProvider());
    this.employeeService = new EmployeeService(new MockEmployeeProvider());
    this.employeeSimulationService = new EmployeeSimulationService();
    this.employeeNpcMovementService = new EmployeeNpcMovementService();
    this.workstationOccupancyService = new WorkstationOccupancyService();
    this.employeeDailyScheduleService = new EmployeeDailyScheduleService();
    this.employeeConversationService = new EmployeeConversationService();
    this.employeeAIService = new EmployeeAIService();
    this.companyProgressionService = new CompanyProgressionService();
    this.officeLayoutService = new OfficeLayoutService();
    this.workSessionService = new WorkSessionService(new MockWorkSessionProvider());
    const companyDashboardProvider = getEnabledCompanyDashboardProvider(createCompanyDashboardProviderRegistry());
    if (!companyDashboardProvider) throw new Error("Company dashboard provider is not configured.");
    this.companyDashboardProvider = companyDashboardProvider;
    this.projectDashboardProvider = new InternalSimulationProjectDashboardProvider();
    this.githubProjectDashboardProvider = new GitHubProjectDashboardProvider();
    this.companyInfluencePlanningService = new CompanyInfluencePlanningService();
    this.aiService = createMockAIService();
    this.aiProjectManagerService = new AIProjectManagerService(this.aiService);
  }

  open() {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.state.justOpened = true;
    this.state.viewMode = "list";
    this.state.selectedProjectIndex = clamp(this.state.selectedProjectIndex, -1, this.state.projects.length - 1);
    this.state.selectedProjectId = this.state.projects[this.state.selectedProjectIndex]?.id ?? "";
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
    this.view.show();
  }

  updateInput(input: OfficeProjectPortalInput) {
    if (!this.state.isOpen) return;

    if (this.state.justOpened) {
      this.state.justOpened = false;
      return;
    }

    if (this.state.viewMode === "list") {
      this.updateListInput(input);
      return;
    }

    if (this.state.viewMode === "detail") {
      this.updateDetailInput(input);
      return;
    }

    if (this.state.viewMode === "workspace") {
      this.updateWorkspaceInput(input);
      return;
    }

    if (this.state.viewMode === "repository-detail") {
      this.updateRepositoryDetailInput(input);
      return;
    }

    if (this.state.viewMode === "task-list") {
      this.updateTaskListInput(input);
      return;
    }

    if (this.state.viewMode === "task-detail") {
      this.updateTaskDetailInput(input);
      return;
    }

    if (this.state.viewMode === "project-dashboard") {
      this.updateProjectDashboardInput(input);
      return;
    }

    if (this.state.viewMode === "influence-planning") {
      this.updateInfluencePlanningInput(input);
      return;
    }

    this.updateEmployeeSelectionInput(input);
  }

  isOpen() {
    return this.state.isOpen;
  }

  async initializeEmployeeSimulationSnapshots() {
    if (this.state.employees.length > 0) {
      this.refreshEmployeeSimulationSnapshots();
      return;
    }

    const requestVersion = this.employeeNpcBootstrapRequestVersion + 1;
    this.employeeNpcBootstrapRequestVersion = requestVersion;

    const employees = await this.employeeService.getEmployees();
    if (this.employeeNpcBootstrapRequestVersion !== requestVersion) return;

    this.state.employees = employees;
    this.refreshEmployeeSimulationSnapshots();
  }

  getEmployeeSimulationSnapshots(): ReadonlyArray<EmployeeSimulationSnapshot> {
    return this.employeeSimulationService.getSnapshots(this.state.employeeSimulations);
  }

  getVisibleOfficeEmployees(): ReadonlyArray<EmployeeSimulationSnapshot> {
    return this.getEmployeeSimulationSnapshots();
  }

  getWorkstationSnapshots(): ReadonlyArray<WorkstationSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.workstationOccupancyService.deriveSnapshots(visibleEmployees);
    return this.workstationOccupancyService.getSnapshots();
  }

  getEmployeeDailyScheduleSnapshots(): ReadonlyArray<EmployeeDailyScheduleSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.employeeDailyScheduleService.deriveSnapshots(visibleEmployees);
    return this.employeeDailyScheduleService.getSnapshots();
  }

  getCompanyProgressionSnapshot(): CompanyProgressionSnapshot {
    return this.companyProgressionService.getProgressionSnapshot({
      activeEmployees: this.state.employees.length,
      completedProjects: getAllLoadedTasks(this.state.taskCollections).filter((task) => task.status === "Done").length,
    });
  }

  getActiveOfficeLayout(): OfficeLayoutSnapshot {
    const progression = this.getCompanyProgressionSnapshot();
    return this.officeLayoutService.getActiveLayout(progression.layoutId);
  }

  getOfficeZoneSnapshots(): ReadonlyArray<OfficeLayoutZone> {
    return this.getActiveOfficeLayout().zones;
  }

  getOfficeLayoutPositionHints(): ReadonlyArray<OfficeLayoutPositionHint> {
    const progression = this.getCompanyProgressionSnapshot();
    return this.officeLayoutService.getPositionHints(progression.layoutId);
  }

  getEmployeeAIStateSnapshots(): ReadonlyArray<EmployeeAISnapshot> {
    if (this.state.employees.length > 0) {
      this.refreshEmployeeSimulationSnapshots();
    }

    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const employeeSnapshots = Array.from(this.getVisibleOfficeEmployees()).sort((left, right) =>
      left.employeeId.localeCompare(right.employeeId),
    );
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const employeeAIPreviewTimestamp = getLatestMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      CONVERSATION_PREVIEW_TIMESTAMP,
    );
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      employeeAIPreviewTimestamp,
      targetPositionHints,
    );
    const scheduleByEmployeeId = new Map(scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const companyProgression = this.getCompanyProgressionSnapshot();
    const officeLayout = this.officeLayoutService.getActiveLayout(companyProgression.layoutId);

    return this.employeeAIService.updateMany(employeeSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      employee: employeesById.get(snapshot.employeeId),
      simulationSnapshot: snapshot,
      movementSnapshot: movementByEmployeeId.get(snapshot.employeeId),
      scheduleSnapshot: scheduleByEmployeeId.get(snapshot.employeeId),
      companyProgression,
      officeLayout,
      officeZones: officeLayout.zones,
      updatedAt: employeeAIPreviewTimestamp,
    }))).map((result) => result.snapshot);
  }

  getEmployeeInsightSources(): ReadonlyArray<EmployeeInsightSource> {
    const previewState = this.createPreviewEmployeeInsightState();
    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const tasksById = new Map(previewState.tasks.map((task) => [task.id, task]));
    const projectsById = new Map(this.state.projects.map((project) => [project.id, project]));
    const aiByEmployeeId = new Map(previewState.aiSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const scheduleByEmployeeId = new Map(previewState.scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(previewState.movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));

    return previewState.employeeSnapshots.map((snapshot) => {
      const employee = employeesById.get(snapshot.employeeId);
      const currentTask = snapshot.currentTaskId ? tasksById.get(snapshot.currentTaskId) : undefined;
      const projectId = currentTask?.projectId ?? snapshot.currentProjectId ?? employee?.currentProjectId;
      const currentProject = projectId ? projectsById.get(projectId) : undefined;
      const movementSnapshot = movementByEmployeeId.get(snapshot.employeeId);
      const workstationSnapshot = previewState.workstationSnapshots
        .find((item) => item.assignedEmployeeId === snapshot.employeeId || item.occupiedByEmployeeId === snapshot.employeeId);
      const scheduleSnapshot = scheduleByEmployeeId.get(snapshot.employeeId);
      const aiSnapshot = aiByEmployeeId.get(snapshot.employeeId);
      const movementPosition = movementSnapshot
        ? {
            ...resolveEmployeeNpcWorldPosition(movementSnapshot.positionHint),
            positionHint: movementSnapshot.positionHint,
          }
        : undefined;

      return {
        employeeId: snapshot.employeeId,
        name: employee?.name ?? snapshot.employeeId,
        role: employee?.role ?? "Engineer",
        aiState: aiSnapshot?.currentState ?? "idle",
        aiSnapshot,
        simulationState: snapshot.currentState,
        simulationSnapshot: snapshot,
        currentTask,
        currentProject,
        workProgress: createInsightProgress(currentTask),
        scheduleState: scheduleSnapshot?.scheduleState,
        scheduleSnapshot,
        movementPosition,
        movementSnapshot,
        workstationState: workstationSnapshot?.state,
        workstationSnapshot,
        companyProgression: previewState.companyProgression,
      };
    });
  }

  getEmployeeKnowledgeSource(insightTarget: EmployeeInsightTarget | undefined): EmployeeKnowledgeSource | undefined {
    if (!insightTarget) return undefined;

    const { context } = this.createPreviewEmployeeConversationContext(insightTarget.employeeId);

    return {
      insightTarget,
      insightSource: insightTarget.source,
      conversationContext: context,
      activitySources: createKnowledgeActivitySources(
        insightTarget.source,
        this.state.workSessions,
      ),
    };
  }

  getCompanyDashboardSnapshot() {
    const employeeInsightSources = this.getEmployeeInsightSources();
    const tasks = getAllLoadedTasks(this.state.taskCollections);

    return {
      ...this.companyDashboardProvider.getSnapshot({
        employeeInsightSources,
        employees: this.state.employees,
        projects: this.state.projects,
        tasks,
        workSessions: Object.values(this.state.workSessions).flat(),
        workstations: this.getWorkstationSnapshots(),
        companyProgression: this.getCompanyProgressionSnapshot(),
      }),
      companyFocus: this.getCompanyFocusSummary(),
    };
  }

  getCompanyFocusOptions() {
    return this.getCompanyInfluencePlanningService().getFocusOptions();
  }

  getCompanyFocusSummary(): CompanyFocusSummary {
    const service = this.getCompanyInfluencePlanningService();
    this.state.companyFocusSummary = service.createFocusSummary(this.state.companyInfluencePlan);
    return this.state.companyFocusSummary;
  }

  getProjectDashboardListItems() {
    return this.projectDashboardProvider.listProjects(this.createProjectDashboardContext());
  }

  getProjectDashboardSnapshot(projectId: string) {
    const context = this.createProjectDashboardContext();
    const internalSnapshot = this.projectDashboardProvider.getProjectSnapshot(context, projectId);
    this.state.projectDashboardSnapshot = this.mergeGitHubProjectDashboardSource(internalSnapshot, context, projectId);
    return this.state.projectDashboardSnapshot;
  }

  setCompanyFocus(focusId: CompanyFocusId | string, updatedAt?: string) {
    const service = this.getCompanyInfluencePlanningService();
    this.state.companyInfluencePlan = service.selectFocus(this.state.companyInfluencePlan, focusId, updatedAt);
    this.state.companyFocusSummary = service.createFocusSummary(this.state.companyInfluencePlan);
    this.syncCompanyFocusToDashboardSnapshot();
    return this.state.companyFocusSummary;
  }

  getEmployeeMovementSnapshots(
    targetPositionHints: Record<string, EmployeeNpcMovementPositionHint> = {},
  ): ReadonlyArray<EmployeeNpcMovementSnapshot> {
    const visibleEmployees = this.getVisibleOfficeEmployees();
    this.employeeNpcMovementService.deriveSnapshots(visibleEmployees, undefined, targetPositionHints);
    return this.employeeNpcMovementService.getSnapshots();
  }

  getEmployeeNpcViewModels(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithSchedule();
  }

  getEmployeeNpcViewModelsWithSchedule(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithWorkstations();
  }

  getEmployeeNpcViewModelsWithWorkstations(): EmployeeNpcViewModel[] {
    return this.getEmployeeNpcViewModelsWithMovement();
  }

  getEmployeeNpcViewModelsWithMovement(): EmployeeNpcViewModel[] {
    if (this.state.employees.length > 0) {
      this.refreshEmployeeSimulationSnapshots();
    }

    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const tasksById = new Map(getAllLoadedTasks(this.state.taskCollections).map((task) => [task.id, task]));
    const visibleEmployees = Array.from(this.getVisibleOfficeEmployees()).sort((left, right) =>
      left.employeeId.localeCompare(right.employeeId),
    );
    const workstationSnapshots = this.getWorkstationSnapshots();
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.getEmployeeDailyScheduleSnapshots();
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, visibleEmployees, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementByEmployeeId = new Map(
      this.getEmployeeMovementSnapshots(targetPositionHints).map((snapshot) => [snapshot.employeeId, snapshot]),
    );

    return visibleEmployees
      .map((snapshot: EmployeeSimulationSnapshot, index: number) => {
        const employee = employeesById.get(snapshot.employeeId);
        const currentTask = snapshot.currentTaskId ? tasksById.get(snapshot.currentTaskId) : undefined;
        const movementSnapshot = movementByEmployeeId.get(snapshot.employeeId);

        return {
          employeeId: snapshot.employeeId,
          displayName: employee?.name ?? snapshot.employeeId,
          displayLabel: snapshot.displayLabel,
          state: snapshot.currentState,
          currentTaskTitle: currentTask?.title,
          positionHint: movementSnapshot?.positionHint ?? {
            zone: getNpcPositionZone(snapshot.currentState),
            slot: index,
          },
          movementState: movementSnapshot?.movementState,
          currentMovementPosition: movementSnapshot?.currentPosition,
          targetMovementPosition: movementSnapshot?.targetPosition,
          placeholderStyle: {
            fillColor: parseNpcColor(employee?.avatarColor) ?? 0x64748b,
            borderColor: 0xf8fafc,
            labelColor: "#f8fafc",
          },
        };
      });
  }

  getEmployeeConversation(employeeId: string): EmployeeConversation | undefined {
    const { context } = this.createPreviewEmployeeConversationContext(employeeId);
    return this.employeeConversationService.createConversation(context);
  }

  getEmployeeConversationViewModel(employeeId: string): EmployeeConversationViewModel | undefined {
    const { context, positionHint } = this.createPreviewEmployeeConversationContext(employeeId);
    const conversation = this.employeeConversationService.createConversation(context);
    if (!conversation) return undefined;

    return this.employeeConversationService.createConversationViewModel(conversation, positionHint);
  }

  getNearbyEmployeeConversationTarget(
    playerPosition: EmployeeConversationPlayerPosition,
  ): NearbyEmployeeConversationTarget | undefined {
    if (!isResolvedConversationPlayerPosition(playerPosition)) return undefined;

    const targets = this.deriveCurrentEmployeeConversationTargets(playerPosition)
      .sort((left, right) => left.distance - right.distance || left.employeeId.localeCompare(right.employeeId));
    const nearestTarget = targets[0];
    if (!nearestTarget || nearestTarget.distance > this.maxEmployeeConversationDistance) return undefined;

    return nearestTarget;
  }
  close() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.justOpened = false;
    this.state.viewMode = "list";
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedEmployeeIndex = 0;
    this.state.selectedProjectDashboardProjectId = undefined;
    this.state.projectDashboardSnapshot = undefined;
    this.state.selectedWorkSessionId = undefined;
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.view.hide();
  }

  destroy() {
    this.repositoryRequestVersion += 1;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.employeeNpcBootstrapRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.view.destroy();
    this.state.isOpen = false;
    this.state.justOpened = false;
  }

  private updateListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.close();
      return;
    }

    if (input.upPressed) this.moveProjectSelection(-1);
    if (input.downPressed) this.moveProjectSelection(1);

    if (input.actionPressed || input.enterPressed) {
      if (this.state.selectedProjectIndex < 0) {
        this.openInfluencePlanning();
        return;
      }

      const project = this.getSelectedProject();
      if (!project) return;

      void this.openProjectDashboard(project.id);
    }
  }

  private updateProjectDashboardInput(input: OfficeProjectPortalInput) {
    if (!input.escapePressed) return;

    this.state.viewMode = "list";
    this.state.selectedProjectDashboardProjectId = undefined;
    this.state.projectDashboardSnapshot = undefined;
    this.refreshCompanyDashboardSnapshot();
    this.view.render(this.state);
  }

  private updateDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      if (!project || !project.nextAction.enabled) return;

      const workspace = this.state.workspaces[project.id];
      if (!workspace) return;

      this.state.selectedWorkspaceSectionIndex = clamp(
        this.state.selectedWorkspaceSectionIndex,
        0,
        workspace.sections.length - 1,
      );
      this.state.viewMode = "workspace";
      void this.prepareProjectManagementSuggestion(project.id);
      this.view.render(this.state);
    }
  }

  private updateWorkspaceInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "detail";
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveWorkspaceSelection(-1);
    if (input.downPressed) this.moveWorkspaceSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const project = this.getSelectedProject();
      const workspace = project ? this.state.workspaces[project.id] : undefined;
      const section = workspace?.sections[this.state.selectedWorkspaceSectionIndex];
      if (!project || !section?.enabled) return;

      if (section.id === "repository") {
        void this.openRepositoryDetail(project.id);
        return;
      }

      if (section.id === "tasks") {
        void this.openTaskList(project.id);
      }
    }
  }

  private updateRepositoryDetailInput(input: OfficeProjectPortalInput) {
    if (!input.escapePressed) return;

    this.state.viewMode = "workspace";
    this.state.selectedRepositoryProjectId = undefined;
    this.repositoryRequestVersion += 1;
    this.view.render(this.state);
  }

  private updateTaskListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "workspace";
      this.state.selectedTaskId = undefined;
      this.taskRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveTaskSelection(-1);
    if (input.downPressed) this.moveTaskSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const task = this.getSelectedTask();
      if (!task) return;

      this.state.selectedTaskId = task.id;
      void this.prepareSelectedTaskAnalysis();
      void this.prepareSelectedEmployeeRecommendation();
      this.state.viewMode = "task-detail";
      this.view.render(this.state);
    }
  }

  private updateTaskDetailInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-list";
      this.view.render(this.state);
      return;
    }

    if (input.actionPressed || input.enterPressed) {
      const taskAction = this.getSelectedTaskAction();

      if (taskAction === "assign_employee") {
        void this.openEmployeeSelection();
        return;
      }

      if (taskAction === "start_work") {
        void this.startPlaceholderWorkOnSelectedTask();
        return;
      }

      if (taskAction === "move_to_review") {
        this.moveSelectedTaskToReview();
        return;
      }

      if (taskAction === "mark_done") {
        this.markSelectedTaskDone();
      }
    }
  }

  private updateEmployeeSelectionInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "task-detail";
      this.employeeRequestVersion += 1;
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveEmployeeSelection(-1);
    if (input.downPressed) this.moveEmployeeSelection(1);

    if (input.actionPressed || input.enterPressed) {
      this.assignSelectedEmployeeToSelectedTask();
    }
  }

  private updateInfluencePlanningInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.state.viewMode = "list";
      this.syncCompanyFocusToDashboardSnapshot();
      this.view.render(this.state);
      return;
    }

    if (input.upPressed) this.moveInfluenceFocusSelection(-1);
    if (input.downPressed) this.moveInfluenceFocusSelection(1);

    if (input.actionPressed || input.enterPressed) {
      const focus = this.getCompanyFocusOptions()[this.state.selectedInfluenceFocusIndex];
      if (!focus) return;

      this.setCompanyFocus(focus.id);
      this.view.render(this.state);
    }
  }

  private openInfluencePlanning() {
    const options = this.getCompanyFocusOptions();
    const activeFocusId = this.state.companyInfluencePlan.selectedFocusId;
    const activeIndex = activeFocusId ? options.findIndex((option) => option.id === activeFocusId) : -1;
    this.state.selectedInfluenceFocusIndex = activeIndex >= 0
      ? activeIndex
      : clamp(this.state.selectedInfluenceFocusIndex, 0, Math.max(options.length - 1, 0));
    this.state.viewMode = "influence-planning";
    this.view.render(this.state);
  }

  private async openProjectDashboard(projectId: string) {
    this.state.selectedProjectDashboardProjectId = projectId;
    if (this.hasRepositoryMapping(projectId) && !this.state.repositorySummaries[projectId]) {
      this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    }
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.state.viewMode = "project-dashboard";
    this.view.render(this.state);
    void this.refreshProjectDashboardRepositorySummary(projectId);

    if (this.state.taskCollections[projectId]) return;

    const requestVersion = this.taskRequestVersion + 1;
    this.taskRequestVersion = requestVersion;

    const collection = await this.taskService.getTaskCollection(projectId);
    if (!this.shouldApplyProjectDashboardTaskCollection(projectId, requestVersion)) return;

    this.state.taskCollections[projectId] = collection;
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.view.render(this.state);
  }

  private async openRepositoryDetail(projectId: string) {
    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;
    this.state.selectedRepositoryProjectId = projectId;
    this.state.repositorySummaries[projectId] = createLoadingRepositorySummary();
    this.state.viewMode = "repository-detail";
    this.view.render(this.state);

    const summary = await this.repositoryService.getRepositorySummary(projectId);
    if (!this.shouldApplyRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.view.render(this.state);
  }

  private async refreshProjectDashboardRepositorySummary(projectId: string) {
    if (!this.hasRepositoryMapping(projectId)) return;

    const requestVersion = this.repositoryRequestVersion + 1;
    this.repositoryRequestVersion = requestVersion;

    const summary = await this.repositoryService.getRepositorySummary(projectId);
    if (!this.shouldApplyProjectDashboardRepositorySummary(projectId, requestVersion)) return;

    this.state.repositorySummaries[projectId] = summary;
    this.state.projectDashboardSnapshot = this.getProjectDashboardSnapshot(projectId);
    this.view.render(this.state);
  }

  private async openTaskList(projectId: string) {
    this.state.selectedTaskProjectId = projectId;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.viewMode = "task-list";

    const existingCollection = this.state.taskCollections[projectId];
    if (existingCollection) {
      this.state.selectedTaskIndex = clamp(this.state.selectedTaskIndex, 0, Math.max(existingCollection.tasks.length - 1, 0));
      this.state.selectedTaskId = existingCollection.tasks[this.state.selectedTaskIndex]?.id;
      void this.prepareTaskAnalyses(existingCollection.tasks, projectId);
      void this.prepareSelectedEmployeeRecommendation();
      void this.prepareProjectManagementSuggestion(projectId);
      this.view.render(this.state);
      return;
    }

    this.view.render(this.state);

    const requestVersion = this.taskRequestVersion + 1;
    this.taskRequestVersion = requestVersion;

    const collection = await this.taskService.getTaskCollection(projectId);
    if (!this.shouldApplyTaskCollection(projectId, requestVersion)) return;

    this.state.taskCollections[projectId] = collection;
    this.state.selectedTaskIndex = clamp(this.state.selectedTaskIndex, 0, Math.max(collection.tasks.length - 1, 0));
    this.state.selectedTaskId = collection.tasks[this.state.selectedTaskIndex]?.id;
    void this.prepareTaskAnalyses(collection.tasks, projectId);
    void this.prepareSelectedEmployeeRecommendation();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private async openEmployeeSelection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task) return;

    this.state.selectedTaskId = task.id;
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(this.state.employees.length - 1, 0));
    this.state.viewMode = "employee-selection";
    this.view.render(this.state);

    if (this.state.employees.length > 0) return;

    const requestVersion = this.employeeRequestVersion + 1;
    this.employeeRequestVersion = requestVersion;

    const employees = await this.employeeService.getEmployees();
    if (!this.shouldApplyEmployees(projectId, task.id, requestVersion)) return;

    this.state.employees = employees;
    this.refreshEmployeeSimulationSnapshots();
    this.state.selectedEmployeeIndex = clamp(this.state.selectedEmployeeIndex, 0, Math.max(employees.length - 1, 0));
    void this.prepareSelectedEmployeeRecommendation();
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private shouldApplyRepositorySummary(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "repository-detail" &&
      this.state.selectedRepositoryProjectId === projectId &&
      this.repositoryRequestVersion === requestVersion
    );
  }

  private shouldApplyTaskCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail") &&
      this.state.selectedTaskProjectId === projectId &&
      this.taskRequestVersion === requestVersion
    );
  }

  private shouldApplyProjectDashboardTaskCollection(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.taskRequestVersion === requestVersion
    );
  }

  private shouldApplyProjectDashboardRepositorySummary(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "project-dashboard" &&
      this.state.selectedProjectDashboardProjectId === projectId &&
      this.repositoryRequestVersion === requestVersion
    );
  }

  private shouldApplyEmployees(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "employee-selection" &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.employeeRequestVersion === requestVersion
    );
  }

  private assignSelectedEmployeeToSelectedTask() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    const task = collection?.tasks[this.state.selectedTaskIndex];
    const employee = this.state.employees[this.state.selectedEmployeeIndex];
    if (!projectId || !collection || !task || !employee) return;

    const previousAssigneeId = task.assigneeId;
    const assignedAt = new Date().toISOString();
    const activity = {
      id: `${task.id}-employee-assigned-${Date.now()}`,
      taskId: task.id,
      type: "employee_assigned" as const,
      message: `${employee.name} assigned to task`,
      createdAt: assignedAt,
      actorId: employee.id,
      actorName: employee.name,
    };
    const updatedTask = {
      ...task,
      assignee: employee.name,
      assigneeId: employee.id,
      updatedAt: assignedAt,
      activityLog: [activity, ...(task.activityLog ?? [])],
    };

    this.state.taskCollections[projectId] = {
      ...collection,
      tasks: collection.tasks.map((item) => (item.id === task.id ? updatedTask : item)),
    };
    const previousAssignment = previousAssigneeId && previousAssigneeId !== employee.id
      ? this.findLoadedAssignmentForEmployee(previousAssigneeId)
      : undefined;
    this.state.employees = this.state.employees.map((item) => {
      if (item.id === employee.id) {
        return {
          ...item,
          status: "Working" as const,
          assignedTaskId: task.id,
          currentProjectId: projectId,
        };
      }

      if (item.id === previousAssigneeId && !previousAssignment) {
        return {
          ...item,
          status: "Idle" as const,
          assignedTaskId: undefined,
          currentProjectId: undefined,
        };
      }

      if (item.id === previousAssigneeId && previousAssignment) {
        return {
          ...item,
          status: "Working" as const,
          assignedTaskId: previousAssignment.taskId,
          currentProjectId: previousAssignment.projectId,
        };
      }

      return item;
    });
    this.state.employeeAssignments = {
      ...this.state.employeeAssignments,
      [task.id]: employee.id,
    };
    this.refreshEmployeeSimulationSnapshotsForTaskAssigned();
    this.state.selectedTaskId = task.id;
    this.state.viewMode = "task-detail";
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private async startPlaceholderWorkOnSelectedTask() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task?.assignee || task.status !== "Todo") return;

    const employee = task.assigneeId
      ? this.state.employees.find((item) => item.id === task.assigneeId)
      : this.state.employees.find((item) => item.name === task.assignee);
    const employeeId = employee?.id ?? task.assigneeId ?? task.assignee;
    const employeeName = employee?.name ?? task.assignee;
    const startedAt = new Date().toISOString();
    const workSession = await this.workSessionService.createWorkSession({
      taskId: task.id,
      projectId,
      employeeId,
      employeeName,
      startedAt,
    });
    const activityMessage = await this.aiService.generateActivityMessage({
      type: "work_started",
      taskTitle: task.title,
      employeeName,
      workSessionId: workSession.id,
      status: workSession.status,
      provider: workSession.provider,
    });

    if (!this.shouldApplyStartedWorkSession(projectId, task.id)) return;

    const activityId = `${task.id}-work-started-${Date.now()}`;
    const workSessionWithActivity = {
      ...workSession,
      activityIds: [activityId, ...(workSession.activityIds ?? [])],
    };
    const updatedTask = this.appendTaskActivity(task, {
      id: activityId,
      taskId: task.id,
      type: "work_started" as const,
      message: activityMessage.message,
      createdAt: startedAt,
      actorId: employeeId,
      actorName: employeeName,
    }, startedAt);

    this.state.workSessions[task.id] = [workSessionWithActivity, ...(this.state.workSessions[task.id] ?? [])];
    this.state.selectedWorkSessionId = workSessionWithActivity.id;
    this.refreshEmployeeSimulationSnapshotsForWorkStarted();
    this.updateSelectedTask({
      ...updatedTask,
      status: "In Progress",
    });
    void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private shouldApplyStartedWorkSession(projectId: string, taskId: string) {
    return (
      this.state.isOpen &&
      this.state.viewMode === "task-detail" &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId
    );
  }

  private moveSelectedTaskToReview() {
    const task = this.getSelectedTask();
    if (!task || task.status !== "In Progress") return;

    this.moveSelectedTaskStatus("Review", "Task moved to review", "moved-to-review");
  }

  private markSelectedTaskDone() {
    const task = this.getSelectedTask();
    if (!task || task.status !== "Review") return;

    this.moveSelectedTaskStatus("Done", "Task marked done", "marked-done");
    if (task.assigneeId) {
      this.releaseEmployeeIfUnassigned(task.assigneeId, task.id);
      this.refreshEmployeeSimulationSnapshotsForWorkCompleted();
      this.view.render(this.state);
    }
  }

  private moveSelectedTaskStatus(nextStatus: TaskStatus, message: string, activityIdLabel: string) {
    const task = this.getSelectedTask();
    if (!task) return;

    const changedAt = new Date().toISOString();
    const updatedTask = this.appendTaskActivity(task, {
      id: `${task.id}-${activityIdLabel}-${Date.now()}`,
      taskId: task.id,
      type: "status_changed" as const,
      message,
      createdAt: changedAt,
    }, changedAt);

    this.updateSelectedTask({
      ...updatedTask,
      status: nextStatus,
    });
    void this.prepareProjectManagementSuggestion(task.projectId);
    this.view.render(this.state);
  }

  private updateSelectedTask(updatedTask: ProjectTask) {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const collection = projectId ? this.state.taskCollections[projectId] : undefined;
    if (!projectId || !collection) return;

    this.state.taskCollections[projectId] = {
      ...collection,
      tasks: collection.tasks.map((item) => (item.id === updatedTask.id ? updatedTask : item)),
    };
    this.state.selectedTaskId = updatedTask.id;
  }

  private appendTaskActivity(task: ProjectTask, activity: NonNullable<ProjectTask["activityLog"]>[number], updatedAt: string) {
    return {
      ...task,
      updatedAt,
      activityLog: [activity, ...(task.activityLog ?? [])],
    };
  }

  private releaseEmployeeIfUnassigned(employeeId: string, completedTaskId: string) {
    const remainingAssignment = this.findLoadedAssignmentForEmployee(employeeId, completedTaskId);
    this.state.employees = this.state.employees.map((employee) => {
      if (employee.id !== employeeId) return employee;

      if (remainingAssignment) {
        return {
          ...employee,
          status: "Working" as const,
          assignedTaskId: remainingAssignment.taskId,
          currentProjectId: remainingAssignment.projectId,
        };
      }

      return {
        ...employee,
        status: "Idle" as const,
        assignedTaskId: undefined,
        currentProjectId: undefined,
      };
    });
  }

  private moveProjectSelection(delta: number) {
    const nextIndex = clamp(this.state.selectedProjectIndex + delta, -1, this.state.projects.length - 1);
    if (nextIndex === this.state.selectedProjectIndex) return;

    this.state.selectedProjectIndex = nextIndex;
    this.state.selectedProjectId = this.state.projects[nextIndex]?.id ?? "";
    this.state.selectedWorkspaceSectionIndex = 0;
    this.state.selectedRepositoryProjectId = undefined;
    this.state.selectedTaskProjectId = undefined;
    this.state.selectedTaskId = undefined;
    this.state.selectedTaskIndex = 0;
    this.state.selectedEmployeeIndex = 0;
    this.state.selectedWorkSessionId = undefined;
    this.taskRequestVersion += 1;
    this.employeeRequestVersion += 1;
    this.taskAnalysisRequestVersion += 1;
    this.employeeRecommendationRequestVersion += 1;
    this.projectManagerRequestVersion += 1;
    this.view.render(this.state);
  }

  private moveWorkspaceSelection(delta: number) {
    const project = this.getSelectedProject();
    const workspace = project ? this.state.workspaces[project.id] : undefined;
    if (!workspace) return;

    const nextIndex = clamp(this.state.selectedWorkspaceSectionIndex + delta, 0, workspace.sections.length - 1);
    if (nextIndex === this.state.selectedWorkspaceSectionIndex) return;

    this.state.selectedWorkspaceSectionIndex = nextIndex;
    this.view.render(this.state);
  }

  private moveTaskSelection(delta: number) {
    const collection = this.getSelectedTaskCollection();
    if (!collection || collection.tasks.length === 0) return;

    const nextIndex = clamp(this.state.selectedTaskIndex + delta, 0, collection.tasks.length - 1);
    if (nextIndex === this.state.selectedTaskIndex) return;

    this.state.selectedTaskIndex = nextIndex;
    this.state.selectedTaskId = collection.tasks[nextIndex]?.id;
    void this.prepareSelectedTaskAnalysis();
    void this.prepareSelectedEmployeeRecommendation();
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    if (projectId) void this.prepareProjectManagementSuggestion(projectId);
    this.view.render(this.state);
  }

  private moveEmployeeSelection(delta: number) {
    if (this.state.employees.length === 0) return;

    const nextIndex = clamp(this.state.selectedEmployeeIndex + delta, 0, this.state.employees.length - 1);
    if (nextIndex === this.state.selectedEmployeeIndex) return;

    this.state.selectedEmployeeIndex = nextIndex;
    this.view.render(this.state);
  }

  private moveInfluenceFocusSelection(delta: number) {
    const options = this.getCompanyFocusOptions();
    if (options.length === 0) return;

    const nextIndex = clamp(this.state.selectedInfluenceFocusIndex + delta, 0, options.length - 1);
    if (nextIndex === this.state.selectedInfluenceFocusIndex) return;

    this.state.selectedInfluenceFocusIndex = nextIndex;
    this.view.render(this.state);
  }

  private getCompanyInfluencePlanningService() {
    if (!this.companyInfluencePlanningService) {
      (this as unknown as { companyInfluencePlanningService: CompanyInfluencePlanningService }).companyInfluencePlanningService =
        new CompanyInfluencePlanningService();
    }

    return this.companyInfluencePlanningService;
  }

  private refreshEmployeeSimulationSnapshots() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForTaskAssigned() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForTaskAssigned(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForWorkStarted() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForWorkStarted(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshEmployeeSimulationSnapshotsForWorkCompleted() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    this.state.employeeSimulations = this.employeeSimulationService.updateForWorkCompleted(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
    );
  }

  private refreshCompanyDashboardSnapshot() {
    this.state.companyDashboardSnapshot = this.getCompanyDashboardSnapshot();
  }

  private createProjectDashboardContext() {
    const employeeInsightSources = this.getEmployeeInsightSources();

    return {
      employeeInsightSources,
      employees: this.state.employees,
      projects: this.state.projects,
      tasks: getAllLoadedTasks(this.state.taskCollections),
      workSessions: Object.values(this.state.workSessions).flat(),
      workstations: this.getWorkstationSnapshots(),
      companyProgression: this.getCompanyProgressionSnapshot(),
      companyFocus: this.getCompanyFocusSummary(),
      repositoryMappings: this.state.repositoryMappings,
      repositorySummaries: this.state.repositorySummaries,
    };
  }

  private mergeGitHubProjectDashboardSource(
    snapshot: ProjectDashboardSnapshot,
    context: ProjectDashboardProviderContext,
    projectId: string,
  ): ProjectDashboardSnapshot {
    if (!this.hasRepositoryMapping(projectId)) return snapshot;

    const githubSnapshot = this.githubProjectDashboardProvider.getProjectSnapshot(context, projectId);
    const githubSource: ProjectDashboardSourceMetadata = {
      ...githubSnapshot.source,
      signals: githubSnapshot.source.signals?.map((signal) => ({ ...signal })),
    };

    return {
      ...snapshot,
      externalSources: [
        ...(snapshot.externalSources ?? []).filter((source) => source.sourceType !== "github"),
        githubSource,
      ],
      sections: snapshot.sections.map((section) =>
        section.id === "source_metadata"
          ? { ...section, status: "available" }
          : section,
      ),
    };
  }

  private hasRepositoryMapping(projectId: string) {
    return this.state.repositoryMappings.some((mapping) => mapping.projectId === projectId && mapping.enabled);
  }

  private syncCompanyFocusToDashboardSnapshot() {
    if (!this.state.companyDashboardSnapshot) return;

    this.state.companyDashboardSnapshot = {
      ...this.state.companyDashboardSnapshot,
      companyFocus: this.state.companyFocusSummary,
    };
  }

  private async prepareProjectManagementSuggestion(projectId: string) {
    const project = this.state.projects.find((item) => item.id === projectId);
    if (!project) return;

    const tasks = this.state.taskCollections[projectId]?.tasks ?? [];
    const activityLogs = getTaskActivityLogs(tasks);
    const requestVersion = this.projectManagerRequestVersion;
    const suggestion = await this.aiProjectManagerService.createProjectManagementSuggestion(
      project,
      tasks,
      this.state.employees,
      activityLogs,
    );
    if (!this.shouldApplyProjectManagementSuggestion(projectId, requestVersion)) return;

    this.state.projectManagementSuggestions[projectId] = suggestion;
  }

  private shouldApplyProjectManagementSuggestion(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      this.state.selectedProjectId === projectId &&
      this.projectManagerRequestVersion === requestVersion
    );
  }

  private async prepareTaskAnalyses(tasks: ProjectTask[], projectId: string) {
    const missingTasks = tasks.filter((task) => !this.state.taskAnalyses[task.id]);
    if (missingTasks.length === 0) return;

    const requestVersion = this.taskAnalysisRequestVersion;

    const analyses = await Promise.all(missingTasks.map((task) => this.aiService.analyzeTask(task)));
    if (!this.shouldApplyTaskAnalyses(projectId, requestVersion)) return;

    analyses.forEach((analysis) => {
      this.state.taskAnalyses[analysis.taskId] = analysis;
    });
  }

  private async prepareSelectedTaskAnalysis() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task || this.state.taskAnalyses[task.id]) return;

    const requestVersion = this.taskAnalysisRequestVersion;
    const analysis = await this.aiService.analyzeTask(task);
    if (!this.shouldApplySelectedTaskAnalysis(projectId, task.id, requestVersion)) return;

    this.state.taskAnalyses[analysis.taskId] = analysis;
    void this.prepareSelectedEmployeeRecommendation();
  }

  private async prepareSelectedEmployeeRecommendation() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    const task = this.getSelectedTask();
    if (!projectId || !task || this.state.employees.length === 0 || this.state.employeeRecommendations[task.id]) return;

    const requestVersion = this.employeeRecommendationRequestVersion;
    const recommendation = await this.aiService.recommendEmployeeForTask(task, this.state.employees);
    if (!this.shouldApplySelectedEmployeeRecommendation(projectId, task.id, requestVersion)) return;

    this.state.employeeRecommendations[recommendation.taskId] = recommendation;
  }

  private shouldApplyTaskAnalyses(projectId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail") &&
      this.state.selectedTaskProjectId === projectId &&
      this.taskAnalysisRequestVersion === requestVersion
    );
  }

  private shouldApplySelectedTaskAnalysis(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail" || this.state.viewMode === "employee-selection") &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.taskAnalysisRequestVersion === requestVersion
    );
  }

  private shouldApplySelectedEmployeeRecommendation(projectId: string, taskId: string, requestVersion: number) {
    return (
      this.state.isOpen &&
      (this.state.viewMode === "task-list" || this.state.viewMode === "task-detail" || this.state.viewMode === "employee-selection") &&
      this.state.selectedTaskProjectId === projectId &&
      this.state.selectedTaskId === taskId &&
      this.employeeRecommendationRequestVersion === requestVersion
    );
  }

  private getSelectedProject() {
    return this.state.projects[this.state.selectedProjectIndex];
  }

  private getSelectedTaskCollection() {
    const projectId = this.state.selectedTaskProjectId ?? this.getSelectedProject()?.id;
    return projectId ? this.state.taskCollections[projectId] : undefined;
  }

  private getSelectedTask() {
    const collection = this.getSelectedTaskCollection();
    return collection?.tasks[this.state.selectedTaskIndex];
  }

  private getSelectedTaskAction(): SelectedTaskAction | undefined {
    const task = this.getSelectedTask();
    if (!task) return undefined;
    if (task.status === "Done") return "completed";
    if (task.status === "Review") return "mark_done";
    if (task.status === "In Progress") return "move_to_review";
    return task.assignee ? "start_work" : "assign_employee";
  }

  private findLoadedAssignmentForEmployee(employeeId: string, excludedTaskId?: string) {
    for (const collection of Object.values(this.state.taskCollections)) {
      const task = collection.tasks.find((item) => item.id !== excludedTaskId && item.status !== "Done" && item.assigneeId === employeeId);
      if (task) {
        return {
          projectId: collection.projectId,
          taskId: task.id,
        };
      }
    }

    return undefined;
  }

  private deriveCurrentEmployeeConversationTargets(
    playerPosition: ResolvedEmployeeConversationPlayerPosition,
  ): NearbyEmployeeConversationTarget[] {
    return this.createPreviewEmployeeConversationState().movementSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      distance: getConversationDistance(playerPosition, snapshot.positionHint),
    }));
  }

  private createPreviewEmployeeConversationContext(employeeId: string) {
    const previewState = this.createPreviewEmployeeConversationState();
    const employee = this.state.employees.find((item) => item.id === employeeId);
    const simulationSnapshot = previewState.employeeSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const currentTask = simulationSnapshot?.currentTaskId
      ? previewState.tasks.find((task) => task.id === simulationSnapshot.currentTaskId)
      : undefined;
    const workstationSnapshot = previewState.workstationSnapshots
      .find((snapshot) => snapshot.assignedEmployeeId === employeeId || snapshot.occupiedByEmployeeId === employeeId);
    const scheduleSnapshot = previewState.scheduleSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const movementSnapshot = previewState.movementSnapshots.find((snapshot) => snapshot.employeeId === employeeId);
    const projectName = currentTask
      ? this.state.projects.find((project) => project.id === currentTask.projectId)?.name
      : undefined;

    return {
      context: {
        employee,
        simulationSnapshot,
        currentTask,
        workstationSnapshot,
        scheduleSnapshot,
        projectName,
      },
      positionHint: movementSnapshot?.positionHint,
    };
  }

  private createPreviewEmployeeConversationState() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const conversationPreviewTimestamp = getLatestMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      CONVERSATION_PREVIEW_TIMESTAMP,
    );
    const employeeSnapshots = Object.values(this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
      conversationPreviewTimestamp,
    )).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      conversationPreviewTimestamp,
      targetPositionHints,
    );

    return {
      tasks,
      employeeSnapshots,
      workstationSnapshots,
      scheduleSnapshots,
      movementSnapshots,
    };
  }

  private createPreviewEmployeeInsightState() {
    const tasks = getAllLoadedTasks(this.state.taskCollections);
    const insightPreviewTimestamp = getLatestMovementTimestamp(
      this.employeeNpcMovementService.getSnapshots(),
      CONVERSATION_PREVIEW_TIMESTAMP,
    );
    const employeeSnapshots = Object.values(this.employeeSimulationService.deriveSnapshots(
      this.state.employees,
      tasks,
      this.state.workSessions,
      this.state.employeeSimulations,
      insightPreviewTimestamp,
    )).sort((left, right) => left.employeeId.localeCompare(right.employeeId));
    const workstationSnapshots = this.workstationOccupancyService.previewSnapshots(employeeSnapshots);
    const workstationTargetHints = createWorkstationTargetHints(workstationSnapshots);
    const scheduleSnapshots = this.employeeDailyScheduleService.previewSnapshots(employeeSnapshots);
    const scheduleTargetHints = createScheduleTargetHints(scheduleSnapshots, employeeSnapshots, workstationTargetHints);
    const targetPositionHints = {
      ...scheduleTargetHints,
      ...workstationTargetHints,
    };
    const movementSnapshots = this.employeeNpcMovementService.previewSnapshots(
      employeeSnapshots,
      insightPreviewTimestamp,
      targetPositionHints,
    );
    const scheduleByEmployeeId = new Map(scheduleSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const movementByEmployeeId = new Map(movementSnapshots.map((snapshot) => [snapshot.employeeId, snapshot]));
    const companyProgression = this.getCompanyProgressionSnapshot();
    const officeLayout = this.officeLayoutService.getActiveLayout(companyProgression.layoutId);
    const employeesById = new Map(this.state.employees.map((employee) => [employee.id, employee]));
    const aiSnapshots = this.employeeAIService.updateMany(employeeSnapshots.map((snapshot) => ({
      employeeId: snapshot.employeeId,
      employee: employeesById.get(snapshot.employeeId),
      simulationSnapshot: snapshot,
      movementSnapshot: movementByEmployeeId.get(snapshot.employeeId),
      scheduleSnapshot: scheduleByEmployeeId.get(snapshot.employeeId),
      companyProgression,
      officeLayout,
      officeZones: officeLayout.zones,
      updatedAt: insightPreviewTimestamp,
    }))).map((result) => result.snapshot);

    return {
      tasks,
      employeeSnapshots,
      workstationSnapshots,
      scheduleSnapshots,
      movementSnapshots,
      companyProgression,
      aiSnapshots,
    };
  }
}

type SelectedTaskAction = "assign_employee" | "start_work" | "move_to_review" | "mark_done" | "completed";

type EmployeeConversationPlayerPosition = {
  zone?: string;
  slot?: number;
};

type ResolvedEmployeeConversationPlayerPosition = {
  zone: EmployeeNpcPositionZone;
  slot: number;
};

function getAllLoadedTasks(taskCollections: ProjectPortalState["taskCollections"]): ProjectTask[] {
  return Object.values(taskCollections).flatMap((collection) => collection.tasks);
}

function getTaskActivityLogs(tasks: ProjectTask[]): TaskActivity[] {
  return tasks.flatMap((task) => task.activityLog ?? []);
}

function createInsightProgress(task: ProjectTask | undefined) {
  if (!task) return undefined;

  return {
    label: task.status,
    status: task.status,
    percent: getTaskStatusProgressPercent(task.status),
  };
}

function createKnowledgeActivitySources(
  insightSource: EmployeeInsightSource,
  workSessions: ProjectPortalState["workSessions"],
) {
  const employeeWorkSessions = Object.values(workSessions)
    .flat()
    .filter((session) => session.employeeId === insightSource.employeeId);

  return [
    ...(insightSource.currentTask?.activityLog ?? []).map((activity) => ({
      kind: "task_activity" as const,
      activity,
    })),
    ...employeeWorkSessions.map((workSession) => ({
      kind: "work_session" as const,
      workSession,
    })),
    ...(insightSource.aiSnapshot?.lastTransition
      ? [{
          kind: "ai_transition" as const,
          employeeId: insightSource.employeeId,
          fromState: insightSource.aiSnapshot.lastTransition.fromState,
          toState: insightSource.aiSnapshot.lastTransition.toState,
          reason: insightSource.aiSnapshot.lastTransition.reason,
          occurredAt: insightSource.aiSnapshot.lastTransition.occurredAt,
        }]
      : []),
    ...(insightSource.scheduleSnapshot?.currentBlock
      ? [{
          kind: "schedule" as const,
          employeeId: insightSource.employeeId,
          scheduleState: insightSource.scheduleSnapshot.scheduleState,
          label: insightSource.scheduleSnapshot.currentBlock.label,
          occurredAt: insightSource.scheduleSnapshot.lastUpdatedAt,
        }]
      : []),
  ];
}

function getTaskStatusProgressPercent(status: TaskStatus) {
  if (status === "Done") return 100;
  if (status === "Review") return 80;
  if (status === "In Progress") return 50;
  return 0;
}

function isResolvedConversationPlayerPosition(
  playerPosition: EmployeeConversationPlayerPosition,
): playerPosition is ResolvedEmployeeConversationPlayerPosition {
  return (
    typeof playerPosition.zone === "string" &&
    CONVERSATION_POSITION_ZONES.has(playerPosition.zone) &&
    typeof playerPosition.slot === "number" &&
    Number.isFinite(playerPosition.slot)
  );
}

function getConversationDistance(
  playerPosition: ResolvedEmployeeConversationPlayerPosition,
  npcPosition: EmployeeNpcViewModel["positionHint"],
) {
  const zoneDistance = playerPosition.zone === npcPosition.zone ? 0 : 100;
  return zoneDistance + Math.abs(playerPosition.slot - npcPosition.slot);
}
function createWorkstationTargetHints(workstationSnapshots: ReadonlyArray<WorkstationSnapshot>) {
  return workstationSnapshots.reduce<Record<string, EmployeeNpcMovementPositionHint>>((targetHints, snapshot) => {
    if (snapshot.state !== "reserved" && snapshot.state !== "occupied") return targetHints;

    const employeeId = snapshot.occupiedByEmployeeId ?? snapshot.assignedEmployeeId;
    if (!employeeId) return targetHints;

    targetHints[employeeId] = snapshot.positionHint;
    return targetHints;
  }, {});
}
function createScheduleTargetHints(
  scheduleSnapshots: ReadonlyArray<EmployeeDailyScheduleSnapshot>,
  employeeSnapshots: ReadonlyArray<EmployeeSimulationSnapshot>,
  workstationTargetHints: Record<string, EmployeeNpcMovementPositionHint>,
) {
  const employeeStateById = new Map(employeeSnapshots.map((snapshot) => [snapshot.employeeId, snapshot.currentState]));

  return scheduleSnapshots.reduce<Record<string, EmployeeNpcMovementPositionHint>>((targetHints, snapshot, index) => {
    const employeeState = employeeStateById.get(snapshot.employeeId);
    if (employeeState !== "idle") return targetHints;

    targetHints[snapshot.employeeId] = createSchedulePositionHint(
      snapshot.positionIntent,
      workstationTargetHints[snapshot.employeeId],
      index,
    );
    return targetHints;
  }, {});
}

function createSchedulePositionHint(
  positionIntent: EmployeeSchedulePositionIntent,
  workstationTargetHint: EmployeeNpcMovementPositionHint | undefined,
  fallbackSlot: number,
): EmployeeNpcMovementPositionHint {
  if (positionIntent.zone === "workstation") {
    return workstationTargetHint ?? {
      zone: "idleSpot",
      slot: positionIntent.slot ?? fallbackSlot,
    };
  }

  return {
    zone: positionIntent.zone,
    slot: positionIntent.slot ?? fallbackSlot,
  };
}

function getLatestMovementTimestamp(
  movementSnapshots: ReadonlyArray<EmployeeNpcMovementSnapshot>,
  fallbackTimestamp: string,
) {
  return movementSnapshots.reduce((latestTimestamp, snapshot) => {
    const latestTime = Date.parse(latestTimestamp);
    const snapshotTime = Date.parse(snapshot.lastUpdatedAt);
    if (!Number.isFinite(snapshotTime)) return latestTimestamp;
    if (!Number.isFinite(latestTime)) return snapshot.lastUpdatedAt;
    return snapshotTime > latestTime ? snapshot.lastUpdatedAt : latestTimestamp;
  }, fallbackTimestamp);
}

function getNpcPositionZone(state: EmployeeSimulationSnapshot["currentState"]): EmployeeNpcPositionZone {
  if (state === "working") return "collaboration";
  if (state === "assigned") return "desk";
  if (state === "unavailable") return "review";
  return "idle";
}

function parseNpcColor(value?: string) {
  if (!value) return undefined;

  const normalized = value.startsWith("#") ? value.slice(1) : value;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return undefined;

  return Number.parseInt(normalized, 16);
}

function createLoadingRepositorySummary(): GitHubRepositorySummary {
  return {
    owner: "",
    name: "",
    defaultBranch: "",
    openIssueCount: 0,
    openPullRequestCount: 0,
    connectionStatus: "loading",
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
