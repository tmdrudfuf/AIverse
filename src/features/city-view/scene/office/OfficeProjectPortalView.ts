import type { PhaserScene } from "../shared/phaserTypes";
import { createActiveWorkSessionDisplayRows, type ActiveWorkSessionDisplayRows } from "./active-work-sessions/ActiveWorkSessionView";
import { createCandidateAssignmentDisplayRows, type CandidateAssignmentDisplayRows } from "./candidate-assignments/CandidateAssignmentView";
import { createCandidateProjectTaskPromotionDisplayRows, type CandidateProjectTaskPromotionDisplayRows } from "./candidate-project-task-promotions/CandidateProjectTaskPromotionView";
import { createCandidatePromotionDisplayRows, type CandidatePromotionDisplayRows } from "./candidate-promotions/CandidatePromotionView";
import { createCandidateTaskDisplayRows, type CandidateTaskDisplayRows } from "./candidate-tasks/CandidateTaskView";
import type { CandidateTask } from "./candidate-tasks/CandidateTaskTypes";
import { createConfirmedEmployeeAssignmentDisplayRows, type ConfirmedEmployeeAssignmentDisplayRows } from "./confirmed-assignments/ConfirmedEmployeeAssignmentView";
import { parsePromotedProjectTaskProvenance } from "./confirmed-assignments/ConfirmedEmployeeAssignmentService";
import { createExecutionPlanDisplayRows, type ExecutionPlanDisplayRows } from "./execution-plans/ExecutionPlanView";
import { resolveCurrentExecutionPlan } from "./execution-plans/ExecutionPlanTypes";
import { createExecutionReadinessDisplayRows, type ExecutionReadinessDisplayRows } from "./execution-readiness/ExecutionReadinessView";
import { createHumanExecutionApprovalDisplayRows, type HumanExecutionApprovalDisplayRows } from "./human-execution-approvals/HumanExecutionApprovalView";
import { createPreparedWorkSessionDisplayRows, type PreparedWorkSessionDisplayRows } from "./prepared-work-sessions/PreparedWorkSessionView";
import { createRuntimePreflightDisplayRows, type RuntimePreflightDisplayRows } from "./runtime-preflight/RuntimePreflightView";
import { createRuntimeStartDisplayRows, type RuntimeStartDisplayRows } from "./runtime-start/RuntimeStartView";
import {
  createImplementerRuntimeDisplayRows,
  type ImplementerRuntimeDisplayRows,
} from "./implementer-runtime/ImplementerRuntimeView";
import {
  createReviewerRuntimeDisplayRows,
  type ReviewerRuntimeDisplayRows,
} from "./reviewer-runtime/ReviewerRuntimeView";
import { ReviewDecisionService, findCurrentReviewPromotion, resolveReviewDecisionInput } from "./review-decision/ReviewDecisionService";
import {
  createReviewDecisionDisplayRows,
  type ReviewDecisionDisplayRows,
} from "./review-decision/ReviewDecisionView";
import { createReviewPromotionTimeline } from "./review-decision/ReviewDecisionTypes";
import {
  createReviewPromotionTimelineDisplayRows,
  type ReviewPromotionTimelineDisplayRows,
} from "./review-decision/ReviewPromotionTimelineView";
import { findCurrentReviewFixRequest, findCurrentReviewFixRequestResult } from "./review-fix-requests/ReviewFixRequestService";
import {
  createReviewFixRequestDisplayRows,
  type ReviewFixRequestDisplayRows,
} from "./review-fix-requests/ReviewFixRequestView";
import { findCurrentReviewFixPlan, findCurrentReviewFixPlanResult } from "./review-fix-plans/ReviewFixPlanService";
import {
  createReviewFixPlanDisplayRows,
  type ReviewFixPlanDisplayRows,
} from "./review-fix-plans/ReviewFixPlanView";
import {
  findCurrentReviewFixRuntime,
  findCurrentReviewFixRuntimeResult,
} from "./review-fix-runtime/ReviewFixRuntimeService";
import {
  createReviewFixRuntimeDisplayRows,
  type ReviewFixRuntimeDisplayRows,
} from "./review-fix-runtime/ReviewFixRuntimeView";
import { findCurrentValidationRuntime } from "./validation-runtime/ValidationRuntimeService";
import {
  createValidationRuntimeDisplayRows,
  type ValidationRuntimeDisplayRows,
} from "./validation-runtime/ValidationRuntimeView";
import { findCurrentPostValidationReviewTarget } from "./post-validation-review-target/PostValidationReviewTargetService";
import {
  createPostValidationReviewTargetDisplayRows,
  type PostValidationReviewTargetDisplayRows,
} from "./post-validation-review-target/PostValidationReviewTargetView";
import { createCompanyDashboardPanelRows } from "./dashboard/CompanyDashboardView";
import { FIFTH_EMPLOYEE_ID } from "./employees/EmployeeRecruitmentService";
import type { Employee } from "./employees/EmployeeTypes";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import { createIssueSyncDisplayRows, type IssueSyncDisplayRows } from "./issue-sync/IssueSyncView";
import type { ProjectPortalProject, ProjectPortalState } from "./OfficeProjectPortalTypes";
import { createProjectDashboardPanelRows } from "./project-dashboard/ProjectDashboardView";
import type { ProjectRegistryRepositoryIdentity } from "./project-registry/ProjectRegistryTypes";
import { createRepositorySyncDisplayRows } from "./repository-sync/RepositorySyncView";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";

const OVERLAY_DEPTH = 3000;
const DASHBOARD_ROW_GAP = 24;
const DASHBOARD_TOP_PANEL_Y = 58;
const DASHBOARD_SUMMARY_Y = 272;
const DASHBOARD_SOURCE_LINE_HEIGHT = 16;
const DASHBOARD_SOURCE_GAP = 8;
const DASHBOARD_SOURCE_HEIGHT = 14;
const DASHBOARD_SOURCE_TO_PROJECTS_GAP = 12;
const DASHBOARD_MIN_PROJECTS_PANEL_Y = 340;
const DASHBOARD_PROJECTS_HEADING_OFFSET = 12;
const PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT = 136;
const PROJECT_DASHBOARD_LOWER_PANEL_Y = 270;
const PROJECT_DASHBOARD_LOWER_ROW_START_Y = 282;
const PROJECT_DASHBOARD_LOWER_ROW_LINE_HEIGHT = 14;
const PROJECT_DASHBOARD_LOWER_ROW_GAP = 4;
const PROJECT_DASHBOARD_LOWER_PANEL_PADDING = 10;
const PROJECT_DASHBOARD_LOWER_WRAP_LENGTH = 78;

export class OfficeProjectPortalView {
  private readonly content: Phaser.GameObjects.Container;
  private readonly container: Phaser.GameObjects.Container;
  private readonly panelX: number;
  private readonly panelY: number;
  private readonly panelWidth: number;
  private readonly panelHeight: number;

  constructor(
    private readonly scene: PhaserScene,
    state: ProjectPortalState,
  ) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    this.panelWidth = Math.min(680, width - 64);
    this.panelHeight = Math.min(454, height - 64);
    this.panelX = Math.max(32, (width - this.panelWidth) / 2);
    this.panelY = Math.max(32, (height - this.panelHeight) / 2);

    const shade = scene.add.rectangle(0, 0, width, height, 0x0f172a, 0.68).setOrigin(0, 0);
    const panel = scene.add.graphics();
    panel.fillStyle(0x05070b, 0.96);
    panel.fillRoundedRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight, 8);
    panel.lineStyle(1, 0xcbd5e1, 0.72);
    panel.strokeRoundedRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight, 8);

    this.content = scene.add.container(0, 0);
    this.container = scene.add.container(0, 0, [shade, panel, this.content]);
    this.container.setScrollFactor(0);
    this.container.setDepth(OVERLAY_DEPTH);
    this.container.setVisible(false);
    this.render(state);
  }

  render(state: ProjectPortalState) {
    this.content.removeAll(true);

    if (state.viewMode === "repository-detail") {
      this.renderRepositoryDetail(state);
      return;
    }

    if (state.viewMode === "task-list") {
      this.renderTaskList(state);
      return;
    }

    if (state.viewMode === "task-detail") {
      this.renderTaskDetail(state);
      return;
    }

    if (state.viewMode === "employee-selection") {
      this.renderEmployeeSelection(state);
      return;
    }

    if (state.viewMode === "project-dashboard") {
      this.renderProjectDashboard(state);
      return;
    }

    if (state.viewMode === "candidate-detail") {
      this.renderCandidateDetail(state);
      return;
    }

    if (state.viewMode === "influence-planning") {
      this.renderInfluencePlanning(state);
      return;
    }

    if (state.viewMode === "workspace") {
      this.renderWorkspace(state);
      return;
    }

    if (state.viewMode === "detail") {
      this.renderDetail(state);
      return;
    }

    this.renderList(state);
  }

  show() {
    this.container.setVisible(true);
  }

  hide() {
    this.container.setVisible(false);
  }

  destroy() {
    this.container.destroy(true);
  }

  private renderList(state: ProjectPortalState) {
    const dashboardRows = createCompanyDashboardPanelRows(state.companyDashboardSnapshot);
    const summaryText = wrapText(dashboardRows.summaryText, 82);
    const sourceY = DASHBOARD_SUMMARY_Y
      + countTextLines(summaryText) * DASHBOARD_SOURCE_LINE_HEIGHT
      + DASHBOARD_SOURCE_GAP;
    const projectsPanelY = Math.max(
      DASHBOARD_MIN_PROJECTS_PANEL_Y,
      sourceY + DASHBOARD_SOURCE_HEIGHT + DASHBOARD_SOURCE_TO_PROJECTS_GAP,
    );
    const dashboardSectionY = projectsPanelY + DASHBOARD_PROJECTS_HEADING_OFFSET;

    this.addTerminalPanel(this.panelX + 20, this.panelY + DASHBOARD_TOP_PANEL_Y, this.panelWidth - 40, projectsPanelY - DASHBOARD_TOP_PANEL_Y - 10);
    this.addText(this.panelX + 28, this.panelY + 24, "AIverse Operating Terminal", titleStyle());
    this.addText(this.panelX + 44, this.panelY + 70, `[ACTIVE] ${dashboardRows.healthText}`, bodyStyle());
    this.addText(this.panelX + 44, this.panelY + 96, dashboardRows.employeeText, bodyStyle());
    this.addText(this.panelX + 44, this.panelY + 122, wrapText(dashboardRows.employeeStateText, 40), mutedStyle());
    this.addText(this.panelX + 44, this.panelY + 148, wrapText(dashboardRows.roleText, 40), mutedStyle());
    this.addText(this.panelX + 360, this.panelY + 70, dashboardRows.projectText, bodyStyle());
    this.addText(this.panelX + 360, this.panelY + 96, dashboardRows.projectProgressText, bodyStyle());
    this.addText(this.panelX + 360, this.panelY + 122, dashboardRows.workloadText, mutedStyle());
    this.addText(this.panelX + 360, this.panelY + 148, dashboardRows.occupancyText, mutedStyle());
    this.addText(this.panelX + 360, this.panelY + 172, dashboardRows.officeZonesText, mutedStyle());
    this.addText(this.panelX + 44, this.panelY + 200, wrapText(`[BLOCKED] ${dashboardRows.bottleneckText.replace("Bottleneck: ", "")}`, 38), mutedStyle());
    this.addText(this.panelX + 360, this.panelY + 200, wrapText(`[RISK] ${dashboardRows.riskText.replace("Risk: ", "")}`, 36), mutedStyle());
    this.addText(this.panelX + 44, this.panelY + 224, wrapText(dashboardRows.productivityText, 82), mutedStyle());
    const recruitMarker = state.selectedProjectIndex === -2 ? ">" : " ";
    this.addText(this.panelX + 44, this.panelY + 248, wrapText(`${recruitMarker} ${getRecruitingActionText(state)}`, 38), rowStyle(true, state.selectedProjectIndex === -2));
    const focusMarker = state.selectedProjectIndex === -1 ? ">" : " ";
    this.addText(this.panelX + 360, this.panelY + 248, wrapText(`${focusMarker} [FOCUS] ${dashboardRows.focusText.replace("Focus: ", "")}`, 38), rowStyle(true, state.selectedProjectIndex === -1));
    this.addText(this.panelX + 44, this.panelY + DASHBOARD_SUMMARY_Y, summaryText, mutedStyle());
    this.addText(this.panelX + 44, this.panelY + sourceY, compactTextLine(`[SOURCE] ${dashboardRows.projectSourceText.replace("Sources: ", "")}`, 82), mutedStyle());
    this.addTerminalPanel(this.panelX + 20, this.panelY + projectsPanelY, this.panelWidth - 40, 100);
    this.addText(this.panelX + 28, this.panelY + dashboardSectionY, "Projects", headingStyle());

    state.projects.forEach((project, index) => {
      const rowY = this.panelY + dashboardSectionY + 30 + index * DASHBOARD_ROW_GAP;
      const marker = index === state.selectedProjectIndex ? ">" : " ";
      const statusColumn = project.status.padEnd(11, " ");
      this.addText(
        this.panelX + 44,
        rowY,
        `${marker} ${getProjectStatusTag(project.status)} ${project.name.padEnd(14, " ")} ${statusColumn}`,
        rowStyle(project.enabled, index === state.selectedProjectIndex),
      );
    });

    this.addText(this.panelX + 390, this.panelY + dashboardSectionY, "Linked Services", headingStyle());
    state.services.forEach((service, index) => {
      const rowY = this.panelY + dashboardSectionY + 30 + index * DASHBOARD_ROW_GAP;
      this.addText(this.panelX + 406, rowY, `${service.label}  -  ${service.status}`, rowStyle(service.enabled, false));
    });
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Up/Down select  Enter/Space action", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderInfluencePlanning(state: ProjectPortalState) {
    const focusSummary = state.companyFocusSummary;
    const options = focusSummary?.options ?? [];

    this.addTerminalPanel(this.panelX + 20, this.panelY + 58, this.panelWidth - 40, 330);
    this.addText(this.panelX + 28, this.panelY + 24, "AIverse Influence Terminal", titleStyle());
    this.addText(this.panelX + 28, this.panelY + 70, "[FOCUS] Current Focus", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 100, wrapText(focusSummary?.summary ?? "No company focus selected.", 78), bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 148, "Focus Options", headingStyle());

    options.forEach((option, index) => {
      const rowY = this.panelY + 184 + index * 36;
      const marker = index === state.selectedInfluenceFocusIndex ? ">" : " ";
      const activeMarker = option.id === focusSummary?.currentFocus?.id ? "[ACTIVE]" : "[IDLE]";
      this.addText(
        this.panelX + 44,
        rowY,
        `${marker} ${activeMarker} ${option.label}`,
        rowStyle(true, index === state.selectedInfluenceFocusIndex),
      );
      this.addText(this.panelX + 78, rowY + 18, wrapText(option.description, 72), mutedStyle());
    });

    this.addText(this.panelX + 28, this.panelY + 382, "[READ-ONLY] Advisory only. Employees and tasks remain autonomous.", mutedStyle());
  }

  private renderProjectDashboard(state: ProjectPortalState) {
    const rows = createProjectDashboardPanelRows(state.projectDashboardSnapshot);
    const leftPanelX = this.panelX + 28;
    const rightPanelX = this.panelX + 356;
    const topPanelY = this.panelY + 58;
    const sectionPanelY = this.panelY + 128;
    const bottomPanelY = this.panelY + PROJECT_DASHBOARD_LOWER_PANEL_Y;

    this.addTerminalPanel(this.panelX + 18, topPanelY, this.panelWidth - 36, 58);
    this.addText(this.panelX + 28, this.panelY + 24, rows.title, projectTitleStyle());
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + 32, rows.sourceText, projectMetaStyle()).setOrigin(1, 0);

    if (!state.projectDashboardSnapshot?.project.isAvailable) {
      this.addText(this.panelX + 34, this.panelY + 72, `[STATUS] ${rows.statusText}`, projectStatusStyle());
      this.addText(this.panelX + 34, this.panelY + 96, wrapText(rows.healthText, 78), projectBodyStyle());
      return;
    }

    this.addText(this.panelX + 34, this.panelY + 70, `[STATUS] ${rows.statusText}`, projectStatusStyle());
    this.addText(this.panelX + 34, this.panelY + 94, `[PROGRESS] ${rows.progressText.replace("Progress: ", "")}`, projectBodyStyle());
    this.addText(this.panelX + 364, this.panelY + 70, wrapText(`[HEALTH] ${rows.healthText}`, 34), projectBodyStyle());

    this.addTerminalPanel(leftPanelX - 6, sectionPanelY, 292, PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT);
    this.addTerminalPanel(rightPanelX - 6, sectionPanelY, 292, PROJECT_DASHBOARD_SECTION_PANEL_HEIGHT);
    this.addText(leftPanelX, this.panelY + 140, rows.activeWorkHeading, projectHeadingStyle());
    rows.activeWorkRows.slice(0, 3).forEach((row, index) => {
      const rowY = this.panelY + 168 + index * 32;
      const selected = rows.activeWorkTaskIds.length > 0 && index === state.selectedProjectDashboardActiveWorkIndex;
      this.addText(leftPanelX + 12, rowY, wrapText(`> ${row}`, 34), rowStyle(true, selected));
    });

    this.addText(rightPanelX, this.panelY + 140, rows.employeeHeading, projectHeadingStyle());
    rows.employeeRows.slice(0, 3).forEach((row, index) => {
      const rowY = this.panelY + 168 + index * 32;
      this.addText(rightPanelX + 12, rowY, wrapText(`> ${row}`, 32), projectBodyStyle());
    });

    const dashboardProjectId = state.selectedProjectDashboardProjectId;
    const dashboardProject = state.projects.find((item) => item.id === dashboardProjectId);
    const repositorySyncRows = createRepositorySyncDisplayRows(
      dashboardProject?.repositoryIdentity,
      dashboardProjectId ? state.repositorySyncSnapshots[dashboardProjectId] : undefined,
    );
    const issueSyncRows = createIssueSyncDisplayRows(
      dashboardProject?.repositoryIdentity,
      dashboardProjectId ? state.issueSyncCollections[dashboardProjectId] : undefined,
    );
    const candidateTaskCollection = dashboardProjectId ? state.candidateTaskCollections[dashboardProjectId] : undefined;
    const candidateTaskRows = candidateTaskCollection
      ? createCandidateTaskDisplayRows(candidateTaskCollection)
      : undefined;
    const candidateAssignmentCollection = dashboardProjectId ? state.candidateAssignmentCollections[dashboardProjectId] : undefined;
    const candidateAssignmentRows = candidateAssignmentCollection
      ? createCandidateAssignmentDisplayRows(candidateAssignmentCollection)
      : undefined;
    const candidatePromotionCollection = dashboardProjectId ? state.candidatePromotionReviewCollections[dashboardProjectId] : undefined;
    const candidatePromotionRows = candidatePromotionCollection
      ? createCandidatePromotionDisplayRows(candidatePromotionCollection)
      : undefined;
    const candidateProjectTaskPromotionCollection = dashboardProjectId
      ? state.candidateProjectTaskPromotionResultCollections[dashboardProjectId]
      : undefined;
    const candidateProjectTaskPromotionRows = candidateProjectTaskPromotionCollection
      ? createCandidateProjectTaskPromotionDisplayRows(candidateProjectTaskPromotionCollection)
      : undefined;
    const confirmedEmployeeAssignmentCollection = dashboardProjectId
      ? state.confirmedEmployeeAssignmentResultCollections[dashboardProjectId]
      : undefined;
    const confirmedEmployeeAssignmentRows = confirmedEmployeeAssignmentCollection
      ? createConfirmedEmployeeAssignmentDisplayRows(confirmedEmployeeAssignmentCollection)
      : undefined;
    const preparedWorkSessionCollection = dashboardProjectId
      ? state.preparedWorkSessionResultCollections[dashboardProjectId]
      : undefined;
    const preparedWorkSessionRows = preparedWorkSessionCollection
      ? createPreparedWorkSessionDisplayRows(preparedWorkSessionCollection)
      : undefined;
    const activeWorkSessionStartCollection = dashboardProjectId
      ? state.activeWorkSessionStartResultCollections[dashboardProjectId]
      : undefined;
    const activeWorkSessionRows = activeWorkSessionStartCollection
      ? createActiveWorkSessionDisplayRows(activeWorkSessionStartCollection)
      : undefined;
    const executionPlanCollection = dashboardProjectId ? state.executionPlanCollections[dashboardProjectId] : undefined;
    const executionPlanResultCollection = dashboardProjectId ? state.executionPlanResultCollections[dashboardProjectId] : undefined;
    const executionPlanRows = executionPlanCollection || executionPlanResultCollection
      ? createExecutionPlanDisplayRows(executionPlanCollection, executionPlanResultCollection)
      : undefined;
    const executionReadinessCollection = dashboardProjectId ? state.executionReadinessCollections[dashboardProjectId] : undefined;
    const executionReadinessResultCollection = dashboardProjectId ? state.executionReadinessResultCollections[dashboardProjectId] : undefined;
    const executionReadinessRows = executionReadinessCollection || executionReadinessResultCollection
      ? createExecutionReadinessDisplayRows(executionReadinessCollection, executionReadinessResultCollection)
      : undefined;
    const humanExecutionApprovalCollection = dashboardProjectId ? state.humanExecutionApprovalCollections[dashboardProjectId] : undefined;
    const humanExecutionApprovalResultCollection = dashboardProjectId ? state.humanExecutionApprovalResultCollections[dashboardProjectId] : undefined;
    const humanExecutionApprovalRows = humanExecutionApprovalCollection || humanExecutionApprovalResultCollection
      ? createHumanExecutionApprovalDisplayRows(humanExecutionApprovalCollection, humanExecutionApprovalResultCollection)
      : undefined;
    const runtimePreflightCollection = dashboardProjectId ? state.runtimePreflightCollections[dashboardProjectId] : undefined;
    const runtimePreflightResultCollection = dashboardProjectId ? state.runtimePreflightResultCollections[dashboardProjectId] : undefined;
    const runtimePreflightRows = runtimePreflightCollection || runtimePreflightResultCollection || humanExecutionApprovalCollection
      ? createRuntimePreflightDisplayRows(runtimePreflightCollection, runtimePreflightResultCollection)
      : undefined;
    const runtimeStartCollection = dashboardProjectId ? state.runtimeStartCollections[dashboardProjectId] : undefined;
    const runtimeStartResultCollection = dashboardProjectId ? state.runtimeStartResultCollections[dashboardProjectId] : undefined;
    const runtimeStartRows = runtimeStartCollection || runtimeStartResultCollection || runtimePreflightResultCollection || humanExecutionApprovalCollection
      ? createRuntimeStartDisplayRows(
        runtimeStartCollection,
        runtimeStartResultCollection,
        runtimePreflightResultCollection,
        humanExecutionApprovalCollection,
      )
      : undefined;
    const implementerRuntimeResultCollection = dashboardProjectId ? state.implementerRuntimeResultCollections[dashboardProjectId] : undefined;
    // Always computed (never gated on a collection already existing) --
    // createImplementerRuntimeDisplayRows itself renders the required
    // "Implementer Unavailable" state when no Runtime Start exists yet, so
    // gating this call on collection presence would silently omit that
    // required row for a project that hasn't reached Runtime Start at all.
    const implementerRuntimeRows = createImplementerRuntimeDisplayRows(runtimeStartResultCollection, implementerRuntimeResultCollection);
    const reviewerRuntimeResultCollection = dashboardProjectId ? state.reviewerRuntimeResultCollections[dashboardProjectId] : undefined;
    // Always computed for the same reason as implementerRuntimeRows above --
    // createReviewerRuntimeDisplayRows itself renders the required "Codex
    // unavailable" state when the Implementer Runtime hasn't Completed yet.
    const reviewerRuntimeRows = createReviewerRuntimeDisplayRows(implementerRuntimeResultCollection, reviewerRuntimeResultCollection);
    const reviewPromotionCollection = dashboardProjectId ? state.reviewPromotionCollections[dashboardProjectId] : undefined;
    const reviewPromotionResultCollection = dashboardProjectId ? state.reviewPromotionResultCollections[dashboardProjectId] : undefined;
    const reviewFixRequestCollection = dashboardProjectId ? state.reviewFixRequestCollections[dashboardProjectId] : undefined;
    const reviewFixRequestResultCollection = dashboardProjectId ? state.reviewFixRequestResultCollections[dashboardProjectId] : undefined;
    const reviewFixPlanCollection = dashboardProjectId ? state.reviewFixPlanCollections[dashboardProjectId] : undefined;
    const reviewFixPlanResultCollection = dashboardProjectId ? state.reviewFixPlanResultCollections[dashboardProjectId] : undefined;
    const reviewFixRuntimeCollection = dashboardProjectId ? state.reviewFixRuntimeCollections[dashboardProjectId] : undefined;
    const reviewFixRuntimeResultCollection = dashboardProjectId ? state.reviewFixRuntimeResultCollections[dashboardProjectId] : undefined;
    const validationRuntimeCollection = dashboardProjectId ? state.validationRuntimeCollections[dashboardProjectId] : undefined;
    const validationRuntimeResultCollection = dashboardProjectId ? state.validationRuntimeResultCollections[dashboardProjectId] : undefined;
    const postValidationReviewTargetCollection = dashboardProjectId ? state.postValidationReviewTargetCollections[dashboardProjectId] : undefined;
    const postValidationReviewTargetResultCollection = dashboardProjectId ? state.postValidationReviewTargetResultCollections[dashboardProjectId] : undefined;
    // Gated on reviewerRuntimeResultCollection/reviewPromotionCollection
    // existing, unlike ImplementerRuntimeRows/ReviewerRuntimeRows above --
    // this stage is one step further downstream of the always-visible
    // Reviewer Runtime row, which already reports "unavailable" until a
    // result exists, so repeating that here would be redundant. This matches
    // the majority gated pattern (Execution Plan/Readiness/Approval/
    // Preflight/Start) rather than the Implementer/Reviewer Runtime exception.
    //
    // The classification itself is computed fresh here via
    // ReviewDecisionService.classify/resolveReviewDecisionInput, not derived
    // only from reviewerRuntimeResultCollection -- per
    // contracts/review-decision-contract.md, the dashboard and the Promote
    // precondition must read the same single classification, so this must
    // detect Stale the same way Promote does rather than trusting a leftover
    // Reviewer Runtime result alone.
    // Filtered by the same selected candidate/project task
    // promoteReviewForPromotion resolves its plan by, so the dashboard's
    // classification and Promote can never read two different Execution
    // Plans for the same selection (see review.md, combined round 2
    // P2-001). Falls back to the unfiltered "project's latest plan" only
    // when nothing is selected yet, matching prior dashboard behavior for
    // that case.
    const selectedCandidatePromotionReview = candidatePromotionCollection?.reviews[state.selectedCandidatePromotionIndex];
    const selectedPromotedTask = selectedCandidatePromotionReview && dashboardProjectId
      ? state.taskCollections[dashboardProjectId]?.tasks.find((task) =>
        parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === selectedCandidatePromotionReview.candidateTaskId
      )
      : undefined;
    const latestReviewDecisionPlan = resolveCurrentExecutionPlan(
      executionPlanCollection,
      selectedPromotedTask
        ? { projectTaskId: selectedPromotedTask.id, candidateTaskId: selectedCandidatePromotionReview!.candidateTaskId }
        : undefined,
    );
    const reviewDecisionInput = dashboardProjectId && latestReviewDecisionPlan
      ? resolveReviewDecisionInput({
        projectId: dashboardProjectId,
        plan: latestReviewDecisionPlan,
        readinessCollection: executionReadinessCollection,
        readinessResultCollection: executionReadinessResultCollection,
        approvalCollection: humanExecutionApprovalCollection,
        preflightCollection: runtimePreflightCollection,
        preflightResultCollection: runtimePreflightResultCollection,
        runtimeStartCollection: runtimeStartCollection,
        runtimeStartResultCollection: runtimeStartResultCollection,
        implementerRuntimeCollection: state.implementerRuntimeCollections[dashboardProjectId],
        implementerRuntimeResultCollection: implementerRuntimeResultCollection,
        reviewTarget: state.reviewTargets[dashboardProjectId],
        reviewerRuntimeCollection: state.reviewerRuntimeCollections[dashboardProjectId],
        reviewerRuntimeResultCollection: reviewerRuntimeResultCollection,
        existingPromotions: reviewPromotionCollection,
      })
      : undefined;
    const reviewFixRequestInput = reviewDecisionInput
      ? {
        ...reviewDecisionInput,
        existingFixRequests: reviewFixRequestCollection,
        existingFixRequestResults: reviewFixRequestResultCollection,
      }
      : undefined;
    const reviewDecisionClassification = reviewDecisionInput
      ? new ReviewDecisionService().classify(reviewDecisionInput)
      : undefined;
    // Resolved via the same shared findCurrentReviewPromotion promote() uses
    // for its precondition 4, so the dashboard and Promote can never diverge
    // on which promotion is current (see review.md, Round 9 P1-001).
    const currentReviewPromotion = dashboardProjectId && reviewDecisionClassification
      ? findCurrentReviewPromotion(dashboardProjectId, reviewDecisionClassification, reviewDecisionInput?.existingPromotions)
      : undefined;
    const reviewDecisionRows = reviewerRuntimeResultCollection || reviewPromotionCollection
      ? createReviewDecisionDisplayRows(reviewDecisionClassification, currentReviewPromotion)
      : undefined;
    const reviewPromotionTimeline = dashboardProjectId && (reviewPromotionCollection || reviewPromotionResultCollection)
      ? createReviewPromotionTimeline({
        projectId: dashboardProjectId,
        promotions: reviewPromotionCollection,
        results: reviewPromotionResultCollection,
        currentPromotion: currentReviewPromotion,
      })
      : undefined;
    const reviewPromotionTimelineRows = reviewPromotionTimeline
      ? createReviewPromotionTimelineDisplayRows(reviewPromotionTimeline)
      : undefined;
    const currentReviewFixRequest = findCurrentReviewFixRequest(reviewFixRequestInput, reviewDecisionClassification);
    const latestReviewFixRequestResult = findCurrentReviewFixRequestResult(
      dashboardProjectId,
      reviewDecisionClassification,
      reviewFixRequestResultCollection,
    );
    const reviewFixRequestRows = reviewerRuntimeResultCollection || reviewFixRequestCollection || reviewFixRequestResultCollection
      ? createReviewFixRequestDisplayRows(reviewDecisionClassification, currentReviewFixRequest, latestReviewFixRequestResult)
      : undefined;
    const reviewFixPlanInput = reviewFixRequestInput
      ? {
        ...reviewFixRequestInput,
        latestFixRequestResult: latestReviewFixRequestResult,
        existingFixPlans: reviewFixPlanCollection,
        existingFixPlanResults: reviewFixPlanResultCollection,
      }
      : undefined;
    const currentReviewFixPlan = findCurrentReviewFixPlan(reviewFixPlanInput, currentReviewFixRequest);
    const latestReviewFixPlanResult = findCurrentReviewFixPlanResult(
      dashboardProjectId,
      currentReviewFixRequest,
      reviewFixPlanResultCollection,
    );
    const reviewFixPlanRows = reviewFixRequestCollection || reviewFixPlanCollection || reviewFixPlanResultCollection
      ? createReviewFixPlanDisplayRows(currentReviewFixRequest, currentReviewFixPlan, latestReviewFixPlanResult)
      : undefined;
    const reviewFixRuntimeInput = reviewFixPlanInput
      ? {
        ...reviewFixPlanInput,
        latestFixPlanResult: latestReviewFixPlanResult,
        existingFixRuntimes: reviewFixRuntimeCollection,
        existingFixRuntimeResults: reviewFixRuntimeResultCollection,
      }
      : undefined;
    const currentReviewFixRuntime = findCurrentReviewFixRuntime(reviewFixRuntimeInput, currentReviewFixPlan);
    const latestReviewFixRuntimeResult = findCurrentReviewFixRuntimeResult(
      dashboardProjectId,
      currentReviewFixPlan,
      reviewFixRuntimeResultCollection,
    );
    const reviewFixRuntimeRows = reviewFixPlanCollection || reviewFixRuntimeCollection || reviewFixRuntimeResultCollection
      ? createReviewFixRuntimeDisplayRows(currentReviewFixPlan, currentReviewFixRuntime, latestReviewFixRuntimeResult)
      : undefined;
    const validationRuntimeInput = reviewFixRuntimeInput
      ? {
        ...reviewFixRuntimeInput,
        latestFixRuntimeResult: latestReviewFixRuntimeResult,
        existingValidationRuntimes: validationRuntimeCollection,
        existingValidationRuntimeResults: validationRuntimeResultCollection,
      }
      : undefined;
    const currentValidationRuntime = findCurrentValidationRuntime(validationRuntimeInput, currentReviewFixRuntime);
    const latestValidationRuntimeResult = validationRuntimeResultCollection?.results.find((result) =>
      result.reviewFixRuntimeId === currentReviewFixRuntime?.reviewFixRuntimeId
    );
    const validationRuntimeRows = reviewFixRuntimeCollection || validationRuntimeCollection || validationRuntimeResultCollection
      ? createValidationRuntimeDisplayRows(
        currentReviewFixRuntime,
        latestReviewFixRuntimeResult,
        currentValidationRuntime,
        latestValidationRuntimeResult,
      )
      : undefined;
    const currentPostValidationReviewTarget = findCurrentPostValidationReviewTarget(
      postValidationReviewTargetCollection,
      currentValidationRuntime,
    );
    const latestPostValidationReviewTargetResult = postValidationReviewTargetResultCollection?.results.find((result) =>
      result.validationRuntimeId === currentValidationRuntime?.validationRuntimeId
    );
    const postValidationReviewTargetRows = validationRuntimeCollection || postValidationReviewTargetCollection || postValidationReviewTargetResultCollection
      ? createPostValidationReviewTargetDisplayRows(
        currentValidationRuntime,
        latestValidationRuntimeResult,
        currentPostValidationReviewTarget,
        latestPostValidationReviewTargetResult,
      )
      : undefined;

    const maxLowerPanelHeight = this.panelHeight - PROJECT_DASHBOARD_LOWER_PANEL_Y;
    const preparedLowerRows = prepareProjectDashboardLowerRows(
      createProjectDashboardLowerRows(
        rows,
        repositorySyncRows,
        issueSyncRows,
        activeWorkSessionRows,
        executionPlanRows,
        executionReadinessRows,
        humanExecutionApprovalRows,
        runtimePreflightRows,
        runtimeStartRows,
        implementerRuntimeRows,
        reviewerRuntimeRows,
        reviewDecisionRows,
        reviewPromotionTimelineRows,
        reviewFixRequestRows,
        reviewFixPlanRows,
        reviewFixRuntimeRows,
        validationRuntimeRows,
        postValidationReviewTargetRows,
        candidateTaskRows,
        candidateAssignmentRows,
        candidatePromotionRows,
        candidateProjectTaskPromotionRows,
        confirmedEmployeeAssignmentRows,
        preparedWorkSessionRows,
      ),
    );
    const lowerRows = fitProjectDashboardLowerRows(preparedLowerRows, maxLowerPanelHeight);
    const lowerPanelHeight = calculateProjectDashboardLowerPanelHeight(lowerRows, maxLowerPanelHeight);
    this.addTerminalPanel(this.panelX + 22, bottomPanelY, this.panelWidth - 44, lowerPanelHeight);
    this.renderProjectDashboardLowerRows(lowerRows);
    const canOpenCandidateDetail = canOpenSelectedCandidateDetail(state);
    const instructionText = canOpenCandidateDetail
      ? "Esc back  Up/Down select  Enter run  Space cycle  C detail"
      : rows.activeWorkTaskIds.length > 0
        ? "Esc back  Up/Down active work  Enter/Space open task"
        : "Esc back";
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, instructionText, instructionStyle()).setOrigin(1, 0.5);
  }

  private renderCandidateDetail(state: ProjectPortalState) {
    const candidateTask = getSelectedCandidateTask(state);
    this.addText(this.panelX + 28, this.panelY + 24, "Candidate Detail", titleStyle());

    if (!candidateTask) {
      this.addText(this.panelX + 28, this.panelY + 84, "Candidate task not found.", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    const sourceRepository = getCandidateSourceRepository(candidateTask);
    const assignment = getCandidateAssignment(state, candidateTask);
    const promotion = getCandidatePromotion(state, candidateTask);
    const promotionResult = getCandidateProjectTaskPromotionResult(state, candidateTask);
    const promotedTask = getPromotedProjectTask(state, candidateTask);

    this.addText(this.panelX + 28, this.panelY + 64, wrapText(candidateTask.title, 70), headingStyle());
    this.addText(this.panelX + 28, this.panelY + 104, `Issue: #${candidateTask.issueNumber} (${candidateTask.state})`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 132, `Candidate: ${candidateTask.estimatedPriority}/${candidateTask.estimatedTaskType}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 160, `Source: ${candidateTask.sourceProvider}${sourceRepository ? ` ${sourceRepository}` : ""}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 188, wrapText(`Labels: ${candidateTask.labels.join(", ") || "None"}`, 70), mutedStyle());
    this.addText(this.panelX + 28, this.panelY + 216, wrapText(`Assignees: ${candidateTask.assignees.join(", ") || "None"}`, 70), mutedStyle());

    this.addText(this.panelX + 28, this.panelY + 252, "Summary:", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 280, wrapText(candidateTask.summary || "No summary available.", 72), bodyStyle());

    this.addText(this.panelX + 390, this.panelY + 104, "Context:", headingStyle());
    this.addText(this.panelX + 390, this.panelY + 136, wrapText(getCandidateAssignmentText(assignment), 52), bodyStyle());
    this.addText(this.panelX + 390, this.panelY + 184, wrapText(getCandidatePromotionText(promotion), 52), bodyStyle());
    this.addText(this.panelX + 390, this.panelY + 232, wrapText(getCandidatePromotionResultText(promotionResult, promotedTask), 52), bodyStyle());

    this.addText(this.panelX + 28, this.panelY + 360, "Decision controls update review status only. No task, employee, runtime, repository, or GitHub changes.", mutedStyle());
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  A approve  D defer  J reject", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderProjectDashboardLowerRows(rows: ProjectDashboardRenderedLowerRow[]) {
    let rowY = this.panelY + PROJECT_DASHBOARD_LOWER_ROW_START_Y;

    rows.forEach((row) => {
      this.addText(this.panelX + 34, rowY, row.text, projectMutedStyle());
      rowY += countTextLines(row.text) * PROJECT_DASHBOARD_LOWER_ROW_LINE_HEIGHT + PROJECT_DASHBOARD_LOWER_ROW_GAP;
    });
  }

  private renderDetail(state: ProjectPortalState) {
    const project = state.projects[state.selectedProjectIndex];
    if (!project) return;

    this.addText(this.panelX + 28, this.panelY + 24, project.name, titleStyle());
    this.addText(this.panelX + 28, this.panelY + 64, `${project.status} | ${project.type}`, headingStyle());
    this.addText(this.panelX + 28, this.panelY + 104, wrapText(project.description, 74), bodyStyle());

    this.addText(this.panelX + 28, this.panelY + 174, "Linked Services", headingStyle());
    project.linkedServices.forEach((service, index) => {
      const rowY = this.panelY + 208 + index * 26;
      this.addText(this.panelX + 44, rowY, `${service.label}  -  ${service.status}`, rowStyle(service.enabled, false));
    });

    let projectInfoY = this.panelY + 174;
    if (project.localRepositoryLabel) {
      this.addText(this.panelX + 390, projectInfoY, `Repository: ${project.localRepositoryLabel}`, mutedStyle());
      projectInfoY += 26;
    }
    if (project.ownerCompany) {
      this.addText(this.panelX + 390, projectInfoY, `Company: ${project.ownerCompany}`, mutedStyle());
      projectInfoY += 26;
    }
    if (project.repositoryIdentity) {
      this.addText(this.panelX + 390, projectInfoY, getRepositoryIdentityRepoText(project.repositoryIdentity), mutedStyle());
      projectInfoY += 26;
      this.addText(this.panelX + 390, projectInfoY, getRepositoryIdentityStatusText(project.repositoryIdentity), mutedStyle());
    }

    this.addText(this.panelX + 28, this.panelY + 326, "Next Action", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 358, getNextActionText(project), rowStyle(project.nextAction.enabled, false));

    const lastActionText = getLastActionText(state, project);
    if (lastActionText) this.addText(this.panelX + 44, this.panelY + 386, lastActionText, mutedStyle());

    const instructionText = project.nextAction.enabled ? "Esc back  Enter/Space action" : "Esc back";
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, instructionText, instructionStyle()).setOrigin(1, 0.5);
  }

  private renderWorkspace(state: ProjectPortalState) {
    const project = state.projects[state.selectedProjectIndex];
    const workspace = project ? state.workspaces[project.id] : undefined;
    if (!workspace) return;

    this.addText(this.panelX + 28, this.panelY + 24, `${workspace.projectName} Workspace`, titleStyle());
    this.addText(this.panelX + 28, this.panelY + 78, "Sections", headingStyle());

    workspace.sections.forEach((section, index) => {
      const rowY = this.panelY + 116 + index * 38;
      const marker = index === state.selectedWorkspaceSectionIndex ? ">" : " ";
      const status = section.enabled ? section.status : `${section.status} (not available)`;
      this.addText(
        this.panelX + 44,
        rowY,
        `${marker} ${section.label.padEnd(12, " ")} ${status}`,
        rowStyle(section.enabled, index === state.selectedWorkspaceSectionIndex),
      );
    });

    if (state.receptionDeskUpgradeBenefits) {
      const benefits = state.receptionDeskUpgradeBenefits;
      this.addTerminalPanel(this.panelX + 360, this.panelY + 88, 280, 158);
      this.addText(this.panelX + 376, this.panelY + 104, benefits.heading, headingStyle());
      this.addText(this.panelX + 376, this.panelY + 132, wrapText(benefits.summary, 32), mutedStyle());
      benefits.benefits.slice(0, 3).forEach((benefit, index) => {
        this.addText(this.panelX + 388, this.panelY + 174 + index * 24, wrapText(`> ${benefit}`, 31), projectMutedStyle());
      });
    }

    const lastActionText = getLastActionText(state, project);
    if (lastActionText) this.addText(this.panelX + 44, this.panelY + 340, lastActionText, mutedStyle());

    this.addText(this.panelX + 28, this.panelY + 354, "Repository and Tasks use local mock data. Other sections are placeholders.", mutedStyle());
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Up/Down select  Enter/Space open", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderRepositoryDetail(state: ProjectPortalState) {
    const project = state.projects[state.selectedProjectIndex];
    const projectId = state.selectedRepositoryProjectId ?? project?.id;
    const summary = projectId ? state.repositorySummaries[projectId] : undefined;
    const title = project ? `${project.name} Repository` : "Repository";

    this.addText(this.panelX + 28, this.panelY + 24, title, titleStyle());

    if (!summary || summary.connectionStatus === "loading") {
      this.addText(this.panelX + 28, this.panelY + 84, "Status: Loading...", headingStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    if (summary.connectionStatus === "connected") {
      this.renderConnectedRepositorySummary(summary);
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Enter refresh", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    if (summary.connectionStatus === "not_connected") {
      this.addText(this.panelX + 28, this.panelY + 84, "Status: Not connected", headingStyle());
      this.addText(this.panelX + 28, this.panelY + 128, "Repository data is not configured yet.", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    this.addText(this.panelX + 28, this.panelY + 84, "Status: Error", headingStyle());
    this.addText(this.panelX + 28, this.panelY + 128, summary.errorMessage ?? "Unable to load repository summary.", bodyStyle());
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Enter refresh", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderConnectedRepositorySummary(summary: GitHubRepositorySummary) {
    const latestCommit = summary.latestCommit;
    const commitText = latestCommit ? `${latestCommit.sha} - ${latestCommit.message}` : "Unavailable";
    const rows = [
      "Status: Connected",
      `Repo: ${summary.owner}/${summary.name}`,
      `Default Branch: ${summary.defaultBranch}`,
      `Latest Commit: ${commitText}`,
      `Open Issues: ${summary.openIssueCount}`,
      `Open Pull Requests: ${summary.openPullRequestCount}`,
      `Last Updated: ${summary.lastUpdatedAt ?? "Unavailable"}`,
    ];

    rows.forEach((row, index) => {
      const style = index === 0 ? headingStyle() : bodyStyle();
      this.addText(this.panelX + 28, this.panelY + 84 + index * 36, row, style);
    });
  }

  private renderTaskList(state: ProjectPortalState) {
    const project = state.projects[state.selectedProjectIndex];
    const projectId = state.selectedTaskProjectId ?? project?.id;
    const collection = projectId ? state.taskCollections[projectId] : undefined;
    const title = project ? `${project.name} Tasks` : "Project Tasks";

    this.addText(this.panelX + 28, this.panelY + 24, title, titleStyle());
    this.addText(this.panelX + 28, this.panelY + 78, "Tasks", headingStyle());

    if (!collection) {
      this.addText(this.panelX + 44, this.panelY + 116, "Loading tasks...", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    if (collection.tasks.length === 0) {
      this.addText(this.panelX + 44, this.panelY + 116, "No tasks configured.", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    collection.tasks.forEach((task, index) => {
      const rowY = this.panelY + 116 + index * 38;
      const marker = index === state.selectedTaskIndex ? ">" : " ";
      const rowText = `${marker} ${task.title.padEnd(28, " ")} ${task.status.padEnd(11, " ")} ${task.priority}`;
      this.addText(this.panelX + 44, rowY, rowText, rowStyle(true, index === state.selectedTaskIndex));
    });

    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Up/Down select  Enter/Space open", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderTaskDetail(state: ProjectPortalState) {
    const task = getSelectedTask(state);
    if (!task) {
      this.addText(this.panelX + 28, this.panelY + 24, "Task Detail", titleStyle());
      this.addText(this.panelX + 28, this.panelY + 84, "Task not found.", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    this.addText(this.panelX + 28, this.panelY + 24, task.title, titleStyle());
    this.addText(this.panelX + 28, this.panelY + 78, `Status: ${task.status}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 106, `Priority: ${task.priority}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 134, `Assigned: ${getTaskAssigneeText(state, task)}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 162, `Estimated Hours: ${task.estimatedHours ?? "None"}`, bodyStyle());

    const latestWorkSession = getLatestWorkSession(state, task);
    if (latestWorkSession) {
      this.addText(this.panelX + 390, this.panelY + 78, "Work Session:", headingStyle());
      this.addText(this.panelX + 406, this.panelY + 106, `Provider: ${latestWorkSession.provider}`, bodyStyle());
      this.addText(this.panelX + 406, this.panelY + 132, `Status: ${latestWorkSession.status}`, bodyStyle());
      this.addText(this.panelX + 406, this.panelY + 158, wrapText(`Started: ${latestWorkSession.startedAt}`, 30), bodyStyle());
    }

    this.addText(this.panelX + 28, this.panelY + 196, "Description:", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 224, wrapText(task.description, 70), bodyStyle());

    this.addText(this.panelX + 28, this.panelY + 284, "Next Action:", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 312, getTaskNextActionText(task), rowStyle(true, false));

    const completionFeedback = getTaskCompletionProgressionFeedback(state, task);
    if (completionFeedback) {
      this.addText(this.panelX + 390, this.panelY + 196, "Completion:", headingStyle());
      this.addText(this.panelX + 406, this.panelY + 224, completionFeedback.message, bodyStyle());
      this.addText(this.panelX + 406, this.panelY + 260, completionFeedback.milestoneSummary, mutedStyle());
    }

    this.addText(this.panelX + 28, this.panelY + 348, "Activity:", headingStyle());
    const activityLog = task.activityLog ?? [];
    if (activityLog.length === 0) {
      this.addText(this.panelX + 44, this.panelY + 376, "No activity yet.", mutedStyle());
    } else {
      activityLog.slice(0, 3).forEach((activity, index) => {
        this.addText(this.panelX + 44, this.panelY + 374 + index * 18, wrapText(activity.message, 68), mutedStyle());
      });
    }

    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Enter/Space action", instructionStyle()).setOrigin(1, 0.5);
  }

  private renderEmployeeSelection(state: ProjectPortalState) {
    this.addText(this.panelX + 28, this.panelY + 24, "Assign Employee", titleStyle());

    if (state.employees.length === 0) {
      this.addText(this.panelX + 44, this.panelY + 84, "Loading employees...", bodyStyle());
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
      return;
    }

    state.employees.forEach((employee, index) => {
      const rowY = this.panelY + 84 + index * 34;
      const marker = index === state.selectedEmployeeIndex ? ">" : " ";
      const rowText = `${marker} ${employee.name.padEnd(16, " ")} ${employee.role.padEnd(10, " ")} ${employee.status}`;
      this.addText(this.panelX + 44, rowY, rowText, rowStyle(true, index === state.selectedEmployeeIndex));
    });

    const selectedEmployee = getSelectedEmployee(state);
    if (selectedEmployee) {
      this.addText(this.panelX + 28, this.panelY + 238, "Capabilities:", headingStyle());
      this.addText(this.panelX + 44, this.panelY + 268, wrapText(selectedEmployee.capabilities.join(", "), 70), bodyStyle());
      this.addText(this.panelX + 28, this.panelY + 312, "Description:", headingStyle());
      this.addText(this.panelX + 44, this.panelY + 340, wrapText(selectedEmployee.description, 72), mutedStyle());
    }

    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Up/Down select  Enter/Space assign", instructionStyle()).setOrigin(1, 0.5);
  }

  private addText(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    const textObject = this.scene.add.text(x, y, text, style);
    this.content.add(textObject);
    return textObject;
  }

  private addTerminalPanel(x: number, y: number, width: number, height: number) {
    const panel = this.scene.add.graphics();
    panel.fillStyle(0x0b0f14, 0.78);
    panel.fillRoundedRect(x, y, width, height, 5);
    panel.lineStyle(1, 0xcbd5e1, 0.38);
    panel.strokeRoundedRect(x, y, width, height, 5);
    panel.lineStyle(1, 0xffffff, 0.12);
    panel.lineBetween(x + 8, y + 8, x + width - 8, y + 8);
    this.content.add(panel);
    return panel;
  }
}

function getNextActionText(project: ProjectPortalProject) {
  if (!project.nextAction.enabled) return `${project.nextAction.label} (not available)`;
  return `${project.nextAction.label} (placeholder)`;
}

function getLastActionText(state: ProjectPortalState, project: ProjectPortalProject) {
  if (state.lastPlaceholderAction?.projectId !== project.id) return undefined;
  return `Placeholder action recorded: ${state.lastPlaceholderAction.actionLabel}`;
}

function getRecruitingActionText(state: ProjectPortalState) {
  if (state.employees.some((employee) => employee.id === FIFTH_EMPLOYEE_ID)) {
    return "[RECRUIT] Fifth employee joined";
  }

  if (state.fifthEmployeeRecruitmentResult?.status === "blocked") {
    return "[RECRUIT] Starter roster not ready";
  }

  return "[RECRUIT] Recruit fifth employee";
}

function getRepositoryIdentityProviderLabel(provider: ProjectRegistryRepositoryIdentity["provider"]) {
  if (provider === "github") return "GitHub";
  if (provider === "local") return "Local";
  return provider;
}

function getRepositoryIdentityRepoText(identity: ProjectRegistryRepositoryIdentity) {
  const providerLabel = getRepositoryIdentityProviderLabel(identity.provider);
  const nameLabel = identity.owner && identity.name ? `${identity.owner}/${identity.name}` : "Not yet known";
  return `Repo: ${nameLabel} (${providerLabel})`;
}

function getRepositoryIdentityStatusText(identity: ProjectRegistryRepositoryIdentity) {
  if (!identity.defaultBranch) return `Status: ${identity.connectionState}`;
  return `Default Branch: ${identity.defaultBranch}  ·  Status: ${identity.connectionState}`;
}


function getSelectedTask(state: ProjectPortalState) {
  const project = state.projects[state.selectedProjectIndex];
  const projectId = state.selectedTaskProjectId ?? project?.id;
  const collection = projectId ? state.taskCollections[projectId] : undefined;
  return collection?.tasks[state.selectedTaskIndex];
}

function getTaskCompletionProgressionFeedback(state: ProjectPortalState, task: ProjectTask) {
  const feedback = state.taskCompletionProgressionFeedback;
  if (!feedback || feedback.projectId !== task.projectId || feedback.taskId !== task.id) return undefined;
  return feedback;
}

function getSelectedCandidateTask(state: ProjectPortalState): CandidateTask | undefined {
  const projectId = state.selectedProjectDashboardProjectId;
  const collection = projectId ? state.candidateTaskCollections[projectId] : undefined;
  if (!collection) return undefined;

  const selectedCandidateTaskId = state.selectedCandidateTaskId ?? getSelectedCandidateTaskId(state);
  return collection.tasks.find((task) => task.id === selectedCandidateTaskId);
}

function canOpenSelectedCandidateDetail(state: ProjectPortalState) {
  return Boolean(getSelectedCandidateTask(state));
}

function getSelectedCandidateTaskId(state: ProjectPortalState) {
  const projectId = state.selectedProjectDashboardProjectId;
  const promotionCollection = projectId ? state.candidatePromotionReviewCollections[projectId] : undefined;
  const selectedPromotion = promotionCollection?.reviews[state.selectedCandidatePromotionIndex];
  return selectedPromotion?.candidateTaskId;
}

function getCandidateAssignment(state: ProjectPortalState, candidateTask: CandidateTask) {
  const collection = state.candidateAssignmentCollections[candidateTask.projectId];
  return collection?.recommendations.find((recommendation) => recommendation.candidateTaskId === candidateTask.id);
}

function getCandidatePromotion(state: ProjectPortalState, candidateTask: CandidateTask) {
  const collection = state.candidatePromotionReviewCollections[candidateTask.projectId];
  return collection?.reviews.find((review) => review.candidateTaskId === candidateTask.id);
}

function getCandidateProjectTaskPromotionResult(state: ProjectPortalState, candidateTask: CandidateTask) {
  const collection = state.candidateProjectTaskPromotionResultCollections[candidateTask.projectId];
  return collection?.results.find((result) => result.candidateTaskId === candidateTask.id);
}

function getPromotedProjectTask(state: ProjectPortalState, candidateTask: CandidateTask) {
  const collection = state.taskCollections[candidateTask.projectId];
  return collection?.tasks.find((task) =>
    parsePromotedProjectTaskProvenance(task.description)?.candidateTaskId === candidateTask.id
  );
}

function getCandidateSourceRepository(candidateTask: CandidateTask) {
  if (!candidateTask.sourceRepositoryOwner || !candidateTask.sourceRepositoryName) return undefined;
  return `${candidateTask.sourceRepositoryOwner}/${candidateTask.sourceRepositoryName}`;
}

function getCandidateAssignmentText(assignment: ReturnType<typeof getCandidateAssignment>) {
  if (!assignment) return "Assignment: Not recommended yet";
  const employee = assignment.recommendedEmployeeName ?? "No employee";
  return `Assignment: ${assignment.assignmentStatus} -> ${employee} (${assignment.matchTier})`;
}

function getCandidatePromotionText(promotion: ReturnType<typeof getCandidatePromotion>) {
  if (!promotion) return "Promotion: Not reviewed yet";
  return `Promotion: ${promotion.promotionStatus}; ${promotion.eligibility.summary}`;
}

function getCandidatePromotionResultText(
  result: ReturnType<typeof getCandidateProjectTaskPromotionResult>,
  promotedTask: ProjectTask | undefined,
) {
  if (promotedTask) return `ProjectTask: ${promotedTask.title} (${promotedTask.status})`;
  if (result) return `ProjectTask: ${result.status}`;
  return "ProjectTask: Not promoted";
}

function getSelectedEmployee(state: ProjectPortalState): Employee | undefined {
  return state.employees[state.selectedEmployeeIndex];
}

function getTaskAssigneeText(state: ProjectPortalState, task: ProjectTask) {
  if (!task.assignee) return "None";

  const employee = state.employees.find((item) => item.id === task.assigneeId);
  if (!employee) return task.assignee;

  return `${task.assignee} (${employee.status})`;
}

function getTaskNextActionText(task: ProjectTask) {
  if (task.status === "Done") return "Completed";
  if (task.status === "Review") return "Mark Done";
  if (task.status === "In Progress") return "Move to Review";
  return task.assignee ? "Start Work (placeholder)" : "Assign Employee";
}

function getProjectStatusTag(status: ProjectPortalProject["status"]) {
  if (status === "Active") return "[ACTIVE]";
  if (status === "Planned") return "[IDLE]";
  return "[IDLE]";
}

function getLatestWorkSession(state: ProjectPortalState, task: ProjectTask) {
  return state.workSessions[task.id]?.[0];
}

type ProjectDashboardLowerRow = {
  text: string;
  maxLines: number;
  dropPriority?: number;
  usePriorityFit?: boolean;
};

type ProjectDashboardRenderedLowerRow = {
  text: string;
  dropPriority?: number;
  usePriorityFit?: boolean;
};

function createProjectDashboardLowerRows(
  rows: ReturnType<typeof createProjectDashboardPanelRows>,
  repositorySyncRows: string[] = [],
  issueSyncRows?: IssueSyncDisplayRows,
  activeWorkSessionRows?: ActiveWorkSessionDisplayRows,
  executionPlanRows?: ExecutionPlanDisplayRows,
  executionReadinessRows?: ExecutionReadinessDisplayRows,
  humanExecutionApprovalRows?: HumanExecutionApprovalDisplayRows,
  runtimePreflightRows?: RuntimePreflightDisplayRows,
  runtimeStartRows?: RuntimeStartDisplayRows,
  implementerRuntimeRows?: ImplementerRuntimeDisplayRows,
  reviewerRuntimeRows?: ReviewerRuntimeDisplayRows,
  reviewDecisionRows?: ReviewDecisionDisplayRows,
  reviewPromotionTimelineRows?: ReviewPromotionTimelineDisplayRows,
  reviewFixRequestRows?: ReviewFixRequestDisplayRows,
  reviewFixPlanRows?: ReviewFixPlanDisplayRows,
  reviewFixRuntimeRows?: ReviewFixRuntimeDisplayRows,
  validationRuntimeRows?: ValidationRuntimeDisplayRows,
  postValidationReviewTargetRows?: PostValidationReviewTargetDisplayRows,
  candidateTaskRows?: CandidateTaskDisplayRows,
  candidateAssignmentRows?: CandidateAssignmentDisplayRows,
  candidatePromotionRows?: CandidatePromotionDisplayRows,
  candidateProjectTaskPromotionRows?: CandidateProjectTaskPromotionDisplayRows,
  confirmedEmployeeAssignmentRows?: ConfirmedEmployeeAssignmentDisplayRows,
  preparedWorkSessionRows?: PreparedWorkSessionDisplayRows,
): ProjectDashboardLowerRow[] {
  const sourceSignalRows = rows.sourceSignalRows;
  const lowerRows: ProjectDashboardLowerRow[] = [
    { text: `[RISK] ${rows.blockerText.replace("Blocker: ", "")}`, maxLines: 1, dropPriority: 0 },
    { text: `[ACTIVITY] ${rows.activityText.replace("Activity: ", "")}`, maxLines: 1, dropPriority: 0 },
    { text: `[ADVISORY] ${rows.advisoryText.replace("Advisory: ", "")}`, maxLines: 2, dropPriority: 0 },
    { text: `[ATTENTION] ${rows.advisoryNextText.replace("Next attention: ", "")}`, maxLines: 1, dropPriority: 0 },
  ];

  if (sourceSignalRows.length > 0) {
    lowerRows.push({ text: `[SOURCE] ${sourceSignalRows[0]}`, maxLines: 1, dropPriority: 30 });
    if (sourceSignalRows.length > 1) {
      lowerRows.push({ text: `[SYNC] ${sourceSignalRows.slice(1).join(" | ")}`, maxLines: 1, dropPriority: 30 });
    }
  }

  if (sourceSignalRows.length === 0) {
    lowerRows.push(
      { text: `[FOCUS] ${rows.relatedFocusText.replace("Focus: ", "")}`, maxLines: 1, dropPriority: 30 },
      { text: `[NEXT] ${rows.nextSuggestedFocusText.replace("Next suggested focus: ", "")}`, maxLines: 1, dropPriority: 30 },
    );
  }

  if (repositorySyncRows.length > 0) {
    lowerRows.push({ text: `[REPO-SYNC] ${repositorySyncRows[0]}`, maxLines: 1, dropPriority: 30 });
  }

  if (issueSyncRows) {
    lowerRows.push({ text: `[ISSUES] ${issueSyncRows.statusText}`, maxLines: 1, dropPriority: 10 });
    if (issueSyncRows.issueListText) {
      lowerRows.push({ text: `[ISSUE LIST] ${issueSyncRows.issueListText}`, maxLines: 1, dropPriority: 10 });
    }
    if (issueSyncRows.issueDetailText) {
      lowerRows.push({ text: `[ISSUE DETAIL] ${issueSyncRows.issueDetailText}`, maxLines: 1, dropPriority: 10 });
    }
  }

  if (activeWorkSessionRows) {
    const resultText = activeWorkSessionRows.resultText
      ? compactActiveWorkSessionResultText(activeWorkSessionRows.resultText)
      : activeWorkSessionRows.statusText;
    lowerRows.push({ text: `[ACTIVE WORK SESSION] ${resultText}`, maxLines: 1, dropPriority: 5 });
  }

  if (executionPlanRows) {
    const resultText = executionPlanRows.resultText ?? executionPlanRows.statusText;
    const planText = executionPlanRows.planText
      ? `; ${compactExecutionPlanDetailText(executionPlanRows.planText)}`
      : "";
    lowerRows.push({
      text: `[EXECUTION PLAN] ${compactExecutionPlanResultText(resultText)}${planText}`,
      maxLines: 2,
      dropPriority: 12,
      usePriorityFit: true,
    });
  }

  if (executionReadinessRows) {
    const resultText = executionReadinessRows.resultText ?? executionReadinessRows.statusText;
    const checkText = executionReadinessRows.checkText ? `; ${compactExecutionReadinessCheckText(executionReadinessRows.checkText)}` : "";
    lowerRows.push({
      text: `[EXECUTION READINESS] ${compactExecutionReadinessResultText(resultText)}${checkText}`,
      maxLines: 1,
      dropPriority: 14,
      usePriorityFit: true,
    });
  }

  if (humanExecutionApprovalRows) {
    const resultText = humanExecutionApprovalRows.resultText ?? humanExecutionApprovalRows.statusText;
    const approvalText = !humanExecutionApprovalRows.resultText && humanExecutionApprovalRows.approvalText
      ? `; ${compactHumanExecutionApprovalText(humanExecutionApprovalRows.approvalText)}`
      : "";
    lowerRows.push({
      text: `[HUMAN EXECUTION APPROVAL] ${compactHumanExecutionApprovalText(resultText)}${approvalText}`,
      maxLines: 1,
      dropPriority: 9,
      usePriorityFit: true,
    });
  }

  if (runtimePreflightRows) {
    const resultText = runtimePreflightRows.resultText ?? runtimePreflightRows.statusText;
    const checkText = runtimePreflightRows.checkText ? `; ${compactRuntimePreflightCheckText(runtimePreflightRows.checkText)}` : "";
    lowerRows.push({
      text: `[RUNTIME PREFLIGHT] ${compactRuntimePreflightResultText(resultText)}${checkText}`,
      maxLines: 1,
      dropPriority: 11,
      usePriorityFit: true,
    });
  }

  if (runtimeStartRows) {
    const resultText = runtimeStartRows.resultText ?? runtimeStartRows.statusText;
    const startText = !runtimeStartRows.resultText && runtimeStartRows.startText
      ? `; ${compactRuntimeStartText(runtimeStartRows.startText)}`
      : "";
    lowerRows.push({
      text: `[RUNTIME START] ${compactRuntimeStartText(resultText)}${startText}`,
      maxLines: 1,
      dropPriority: 13,
      usePriorityFit: true,
    });
  }

  if (implementerRuntimeRows) {
    lowerRows.push({
      text: `[IMPLEMENTER RUNTIME] ${implementerRuntimeRows.statusText}`,
      maxLines: 1,
      dropPriority: 15,
      usePriorityFit: true,
    });
  }

  if (reviewerRuntimeRows) {
    lowerRows.push({
      text: `[REVIEWER RUNTIME] ${reviewerRuntimeRows.statusText}`,
      maxLines: 1,
      dropPriority: 16,
      usePriorityFit: true,
    });
  }

  if (reviewDecisionRows) {
    lowerRows.push({
      text: `[REVIEW DECISION] ${reviewDecisionRows.statusText}`,
      maxLines: 1,
      dropPriority: 17,
      usePriorityFit: true,
    });
  }

  if (reviewPromotionTimelineRows) {
    lowerRows.push({
      text: `[PROMOTION HISTORY] ${reviewPromotionTimelineRows.statusText}`,
      maxLines: 1,
      dropPriority: 18,
      usePriorityFit: true,
    });
  }

  if (reviewFixRequestRows) {
    lowerRows.push({
      text: `[REVIEW FIX REQUEST] ${reviewFixRequestRows.statusText}`,
      maxLines: 1,
      dropPriority: 19,
      usePriorityFit: true,
    });
  }

  if (reviewFixPlanRows) {
    lowerRows.push({
      text: `[REVIEW FIX PLAN] ${reviewFixPlanRows.statusText}`,
      maxLines: 1,
      dropPriority: 20,
      usePriorityFit: true,
    });
  }

  if (reviewFixRuntimeRows) {
    lowerRows.push({
      text: `[REVIEW FIX RUNTIME] ${reviewFixRuntimeRows.statusText}`,
      maxLines: 1,
      dropPriority: 21,
      usePriorityFit: true,
    });
  }

  if (validationRuntimeRows) {
    lowerRows.push({
      text: `[VALIDATION RUNTIME] ${validationRuntimeRows.statusText}`,
      maxLines: 1,
      dropPriority: 22,
      usePriorityFit: true,
    });
  }

  if (postValidationReviewTargetRows) {
    lowerRows.push({
      text: `[RE-REVIEW] ${postValidationReviewTargetRows.statusText}`,
      maxLines: 1,
      dropPriority: 23,
      usePriorityFit: true,
    });
  }

  if (candidateTaskRows) {
    lowerRows.push({ text: `[CANDIDATE TASKS] ${candidateTaskRows.statusText}`, maxLines: 1, dropPriority: 24 });
    if (candidateTaskRows.topTaskText) {
      lowerRows.push({ text: `[CANDIDATE TOP] ${candidateTaskRows.topTaskText}`, maxLines: 1, dropPriority: 24 });
    }
  }

  if (candidateAssignmentRows) {
    const topText = candidateAssignmentRows.topRecommendationText
      ? `; ${candidateAssignmentRows.topRecommendationText}`
      : "";
    lowerRows.push({ text: `[ASSIGNMENT RECOMMENDATIONS] ${candidateAssignmentRows.statusText}${topText}`, maxLines: 1, dropPriority: 26 });
  }

  if (candidatePromotionRows) {
    const reviewText = candidatePromotionRows.reviewText
      ? `; ${candidatePromotionRows.reviewText}`
      : "";
    lowerRows.push({ text: `[PROMOTION REVIEW] ${candidatePromotionRows.statusText}${reviewText}`, maxLines: 1, dropPriority: 27 });
  }

  if (candidateProjectTaskPromotionRows) {
    const resultText = candidateProjectTaskPromotionRows.resultText
      ? `; ${candidateProjectTaskPromotionRows.resultText}`
      : "";
    lowerRows.push({ text: `[PROMOTION RESULT] ${candidateProjectTaskPromotionRows.statusText}${resultText}`, maxLines: 1, dropPriority: 28 });
  }

  if (confirmedEmployeeAssignmentRows) {
    const resultText = confirmedEmployeeAssignmentRows.resultText
      ? `; ${confirmedEmployeeAssignmentRows.resultText}`
      : "";
    lowerRows.push({ text: `[CONFIRMED ASSIGNMENT] ${confirmedEmployeeAssignmentRows.statusText}${resultText}`, maxLines: 1, dropPriority: 29 });
  }

  if (preparedWorkSessionRows) {
    const resultText = preparedWorkSessionRows.resultText
      ? compactPreparationResultText(preparedWorkSessionRows.resultText)
      : "";
    const statusText = resultText || preparedWorkSessionRows.statusText;
    lowerRows.push({ text: `[WORK SESSION PREPARATION] ${statusText}`, maxLines: 1, dropPriority: 29 });
  }

  return lowerRows;
}

function prepareProjectDashboardLowerRows(rows: ProjectDashboardLowerRow[]): ProjectDashboardRenderedLowerRow[] {
  return rows.map((row) => ({
    text: wrapAndClampText(row.text, PROJECT_DASHBOARD_LOWER_WRAP_LENGTH, row.maxLines),
    dropPriority: row.dropPriority,
    usePriorityFit: row.usePriorityFit,
  }));
}

function calculateProjectDashboardLowerPanelHeight(rows: ProjectDashboardRenderedLowerRow[], maxHeight: number) {
  return Math.min(calculateProjectDashboardLowerRowsDesiredHeight(rows), maxHeight);
}

function calculateProjectDashboardLowerRowsDesiredHeight(rows: ProjectDashboardRenderedLowerRow[]) {
  const contentHeight = rows.reduce((height, row, index) => {
    const gap = index === rows.length - 1 ? 0 : PROJECT_DASHBOARD_LOWER_ROW_GAP;
    return height + countTextLines(row.text) * PROJECT_DASHBOARD_LOWER_ROW_LINE_HEIGHT + gap;
  }, 0);

  return contentHeight
    + PROJECT_DASHBOARD_LOWER_ROW_START_Y
    - PROJECT_DASHBOARD_LOWER_PANEL_Y
    + PROJECT_DASHBOARD_LOWER_PANEL_PADDING;
}

/**
 * Drops the lowest-priority rows from the end (repository-sync and issue-sync
 * rows are always appended last, in ascending priority order) until the
 * remaining rows fit within maxHeight -- so newly-stacked rows can never
 * silently render past the drawn panel's bottom edge.
 */
function fitProjectDashboardLowerRows(
  rows: ProjectDashboardRenderedLowerRow[],
  maxHeight: number,
): ProjectDashboardRenderedLowerRow[] {
  let fitted = rows;
  const usePriorityFit = rows.some((row) => row.usePriorityFit);
  while (fitted.length > 0 && calculateProjectDashboardLowerRowsDesiredHeight(fitted) > maxHeight) {
    if (!usePriorityFit) {
      fitted = fitted.slice(0, -1);
      continue;
    }
    let removeIndex = fitted.length - 1;
    let removePriority = fitted[removeIndex]?.dropPriority ?? removeIndex;
    fitted.forEach((row, index) => {
      const priority = row.dropPriority ?? index;
      if (priority > removePriority || (priority === removePriority && index > removeIndex)) {
        removePriority = priority;
        removeIndex = index;
      }
    });
    fitted = fitted.filter((_row, index) => index !== removeIndex);
  }
  return fitted;
}

function wrapText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength) {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
        return;
      }

      lines.push(word);
      currentLine = "";
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);
  return lines.join("\n");
}

function wrapAndClampText(text: string, maxLength: number, maxLines: number) {
  if (maxLines === 1) return compactTextLine(text, maxLength);

  const wrappedText = wrapText(text, maxLength);
  const lines = wrappedText.split("\n");
  if (lines.length <= maxLines) return wrappedText;

  const visibleLines = lines.slice(0, maxLines);
  visibleLines[visibleLines.length - 1] = appendEllipsis(visibleLines[visibleLines.length - 1], maxLength);
  return visibleLines.join("\n");
}

function appendEllipsis(text: string, maxLength: number) {
  if (text.length <= maxLength - 3) return `${text}...`;
  return `${text.slice(0, maxLength - 3).trimEnd()}...`;
}

function countTextLines(text: string) {
  return text.split("\n").length;
}

function compactTextLine(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;

  const overflowIndicator = text.match(/;\s\+\d+ more$/)?.[0] ?? "";
  const suffix = overflowIndicator ? `${overflowIndicator}...` : "...";
  const maxTextLength = Math.max(0, maxLength - suffix.length);
  return `${text.slice(0, maxTextLength).trimEnd()}${suffix}`;
}

function compactPreparationResultText(text: string) {
  return text
    .replace(/^Prepared [^;]+;/, "Prepared;")
    .replace(/^Already prepared [^;]+;/, "Already prepared;");
}

function compactActiveWorkSessionResultText(text: string) {
  return text
    .replace(/^Work session active [^;]+;/, "Active;")
    .replace(/^Already started [^;]+;/, "Already started;")
    .replace(/; [^;]+; Work started;/, "; Work started;")
    .replace("Agent execution not started", "No agent execution")
    .replace("No repository mutation", "Repo safe");
}

function compactExecutionPlanResultText(text: string) {
  return text
    .replace(/^Execution Plan Ready [^;]+;/, "Execution Plan Ready;")
    .replace(/^Execution Plan Exists [^;]+;/, "Execution Plan Exists;")
    .replace(/^Execution Plan Blocked [^;]+;/, "Execution Plan Blocked;")
    .replace(/^Execution Plan Failed [^;]+;/, "Execution Plan Failed;");
}

function compactExecutionPlanDetailText(text: string) {
  return text
    .replace(/; Worktree [^;]+/, "; Worktree captured")
    .replace(/; Spec [^;]+/, "; Spec captured")
    .replace(/validation command(s?)/, "validation cmd$1")
    .replace(/mutation scope(s?)/, "mutation scope$1");
}

function compactExecutionReadinessResultText(text: string) {
  return text
    .replace("Readiness Checks Passed", "Checks passed")
    .replace("Ready for Human Execution Decision", "Ready")
    .replace("Human Approval Not Granted", "No approval")
    .replace("Execution Not Started", "Not started")
    .replace("Execution Blocked", "Blocked")
    .replace("Resolve Readiness Requirements", "Fix")
    .replace("Readiness Validation Failed", "Readiness failed")
    .replace("TASK_STATE_INCOMPATIBLE", "TASK_STATE");
}

function compactExecutionReadinessCheckText(text: string) {
  return text
    .replace(/ExecutionPlan:/g, "Plan:")
    .replace(/ProjectTask:/g, "Task:")
    .replace(/ConfirmedAssignment:/g, "Assignment:")
    .replace(/PreparedSession:/g, "Prepared:")
    .replace(/ActiveSession:/g, "Active:");
}

function compactHumanExecutionApprovalText(text: string) {
  return text
    .replace("Human Execution Approval Recorded", "Approval recorded")
    .replace("Human Execution Approval Already Recorded", "Approval already recorded")
    .replace("Human Approval Required", "Required")
    .replace("Execution Not Approved", "Not approved")
    .replace("Execution Approved", "Execution Approved")
    .replace("Execution Not Started", "Not started")
    .replace("Approve Execution", "Approve")
    .replace("; Awaiting Runtime Preflight", "")
    .replace("Approval Unavailable", "Unavailable")
    .replace("Resolve Readiness Requirements", "Fix readiness")
    .replace("Approval Validation Failed", "Approval failed")
    .replace("; READINESS_NOT_READY", "");
}

function compactRuntimePreflightResultText(text: string) {
  return text
    .replace("Runtime Preflight Required", "Preflight required")
    .replace("Run Local Safety Checks", "Run checks")
    .replace("Runtime Preflight Passed", "Preflight passed")
    .replace("Ready for Runtime Start Decision", "Ready")
    .replace("Runtime Preflight Blocked", "Preflight blocked")
    .replace("Resolve Local Runtime Requirements", "Fix local requirements")
    .replace("Runtime Preflight Failed", "Preflight failed")
    .replace("Local Safety Checks Could Not Complete", "Checks failed")
    .replace("Execution Not Started", "Not started")
    .replace("Agents Not Started", "Agents not started");
}

function compactRuntimePreflightCheckText(text: string) {
  return text
    .replace(/RuntimeEnvironment:/g, "Runtime:")
    .replace(/ValidationCommands:/g, "Commands:")
    .replace(/WorkingTree:/g, "Tree:");
}

function compactRuntimeStartText(text: string) {
  return text
    .replace("Runtime Start Unavailable", "Start unavailable")
    .replace("Human Approval Required", "Approval required")
    .replace("Runtime Preflight Required", "Preflight required")
    .replace("Runtime Start Blocked", "Start blocked")
    .replace("Resolve Runtime Preflight", "Fix preflight")
    .replace("Runtime Start Available", "Start available")
    .replace("Explicit Human Start Required", "Explicit start required")
    .replace("Runtime Start Recorded", "Start recorded")
    .replace("Execution Started", "Execution Started")
    .replace("Execution Not Started", "Not started")
    .replace("Agents Not Started", "Agents not started")
    .replace("Awaiting Implementer Start", "Awaiting implementer");
}

function titleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#f8fafc",
    fontFamily: "Courier New, monospace",
    fontSize: "24px",
    fontStyle: "700",
  };
}

function headingStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#e2e8f0",
    fontFamily: "Courier New, monospace",
    fontSize: "16px",
    fontStyle: "700",
  };
}

function bodyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#f1f5f9",
    fontFamily: "Courier New, monospace",
    fontSize: "14px",
    lineSpacing: 4,
  };
}

function rowStyle(enabled: boolean, selected: boolean): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    backgroundColor: selected ? "rgba(226, 232, 240, 0.14)" : undefined,
    color: selected ? "#ffffff" : enabled ? "#e2e8f0" : "#94a3b8",
    fontFamily: "Courier New, monospace",
    fontSize: "14px",
    fontStyle: selected ? "700" : "400",
    padding: selected ? { x: 8, y: 3 } : undefined,
  };
}

function mutedStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#cbd5e1",
    fontFamily: "Courier New, monospace",
    fontSize: "13px",
  };
}

function instructionStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#475569",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
  };
}

function projectTitleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#f8fafc",
    fontFamily: "Courier New, monospace",
    fontSize: "23px",
    fontStyle: "700",
  };
}

function projectHeadingStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#e2e8f0",
    fontFamily: "Courier New, monospace",
    fontSize: "15px",
    fontStyle: "700",
  };
}

function projectStatusStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#ffffff",
    fontFamily: "Courier New, monospace",
    fontSize: "15px",
    fontStyle: "700",
  };
}

function projectBodyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#e2e8f0",
    fontFamily: "Courier New, monospace",
    fontSize: "13px",
    lineSpacing: 3,
  };
}

function projectMutedStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#cbd5e1",
    fontFamily: "Courier New, monospace",
    fontSize: "12px",
    lineSpacing: 2,
  };
}

function projectMetaStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#cbd5e1",
    fontFamily: "Courier New, monospace",
    fontSize: "12px",
  };
}
