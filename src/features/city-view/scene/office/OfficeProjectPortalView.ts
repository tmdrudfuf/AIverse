import type { PhaserScene } from "../shared/phaserTypes";
import { createCompanyDashboardPanelRows } from "./dashboard/CompanyDashboardView";
import type { Employee } from "./employees/EmployeeTypes";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { ProjectPortalProject, ProjectPortalState } from "./OfficeProjectPortalTypes";
import { createProjectDashboardPanelRows } from "./project-dashboard/ProjectDashboardView";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";

const OVERLAY_DEPTH = 3000;
const DASHBOARD_ROW_GAP = 24;
const DASHBOARD_TOP_PANEL_Y = 58;
const DASHBOARD_SUMMARY_Y = 248;
const DASHBOARD_SOURCE_LINE_HEIGHT = 16;
const DASHBOARD_SOURCE_GAP = 8;
const DASHBOARD_SOURCE_HEIGHT = 14;
const DASHBOARD_SOURCE_TO_PROJECTS_GAP = 12;
const DASHBOARD_MIN_PROJECTS_PANEL_Y = 316;
const DASHBOARD_PROJECTS_HEADING_OFFSET = 12;
const PROJECT_DASHBOARD_LOWER_PANEL_Y = 282;
const PROJECT_DASHBOARD_LOWER_ROW_START_Y = 294;
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
    this.panelHeight = Math.min(430, height - 64);
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
    this.addText(this.panelX + 44, this.panelY + 176, wrapText(`[BLOCKED] ${dashboardRows.bottleneckText.replace("Bottleneck: ", "")}`, 38), mutedStyle());
    this.addText(this.panelX + 360, this.panelY + 176, wrapText(`[RISK] ${dashboardRows.riskText.replace("Risk: ", "")}`, 36), mutedStyle());
    this.addText(this.panelX + 44, this.panelY + 200, wrapText(dashboardRows.productivityText, 82), mutedStyle());
    const focusMarker = state.selectedProjectIndex < 0 ? ">" : " ";
    this.addText(this.panelX + 44, this.panelY + 224, wrapText(`${focusMarker} [FOCUS] ${dashboardRows.focusText.replace("Focus: ", "")}`, 82), rowStyle(true, state.selectedProjectIndex < 0));
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

    this.addTerminalPanel(leftPanelX - 6, sectionPanelY, 292, 148);
    this.addTerminalPanel(rightPanelX - 6, sectionPanelY, 292, 148);
    this.addText(leftPanelX, this.panelY + 140, rows.activeWorkHeading, projectHeadingStyle());
    rows.activeWorkRows.slice(0, 3).forEach((row, index) => {
      const rowY = this.panelY + 168 + index * 32;
      this.addText(leftPanelX + 12, rowY, wrapText(`> ${row}`, 34), projectBodyStyle());
    });

    this.addText(rightPanelX, this.panelY + 140, rows.employeeHeading, projectHeadingStyle());
    rows.employeeRows.slice(0, 3).forEach((row, index) => {
      const rowY = this.panelY + 168 + index * 32;
      this.addText(rightPanelX + 12, rowY, wrapText(`> ${row}`, 32), projectBodyStyle());
    });

    const lowerRows = prepareProjectDashboardLowerRows(createProjectDashboardLowerRows(rows));
    const lowerPanelHeight = calculateProjectDashboardLowerPanelHeight(
      lowerRows,
      this.panelHeight - PROJECT_DASHBOARD_LOWER_PANEL_Y,
    );
    this.addTerminalPanel(this.panelX + 22, bottomPanelY, this.panelWidth - 44, lowerPanelHeight);
    this.renderProjectDashboardLowerRows(lowerRows);
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

function getSelectedTask(state: ProjectPortalState) {
  const project = state.projects[state.selectedProjectIndex];
  const projectId = state.selectedTaskProjectId ?? project?.id;
  const collection = projectId ? state.taskCollections[projectId] : undefined;
  return collection?.tasks[state.selectedTaskIndex];
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
};

type ProjectDashboardRenderedLowerRow = {
  text: string;
};

function createProjectDashboardLowerRows(rows: ReturnType<typeof createProjectDashboardPanelRows>): ProjectDashboardLowerRow[] {
  const sourceSignalRows = rows.sourceSignalRows;
  const lowerRows: ProjectDashboardLowerRow[] = [
    { text: `[RISK] ${rows.blockerText.replace("Blocker: ", "")}`, maxLines: 1 },
    { text: `[ACTIVITY] ${rows.activityText.replace("Activity: ", "")}`, maxLines: 1 },
    { text: `[ADVISORY] ${rows.advisoryText.replace("Advisory: ", "")}`, maxLines: 2 },
    { text: `[ATTENTION] ${rows.advisoryNextText.replace("Next attention: ", "")}`, maxLines: 1 },
  ];

  if (sourceSignalRows.length > 0) {
    lowerRows.push({ text: `[SOURCE] ${sourceSignalRows[0]}`, maxLines: 1 });
    if (sourceSignalRows.length > 1) {
      lowerRows.push({ text: `[SYNC] ${sourceSignalRows.slice(1).join(" | ")}`, maxLines: 1 });
    }
  }

  if (sourceSignalRows.length === 0) {
    lowerRows.push(
      { text: `[FOCUS] ${rows.relatedFocusText.replace("Focus: ", "")}`, maxLines: 1 },
      { text: `[NEXT] ${rows.nextSuggestedFocusText.replace("Next suggested focus: ", "")}`, maxLines: 1 },
    );
  }

  return lowerRows;
}

function prepareProjectDashboardLowerRows(rows: ProjectDashboardLowerRow[]): ProjectDashboardRenderedLowerRow[] {
  return rows.map((row) => ({
    text: wrapAndClampText(row.text, PROJECT_DASHBOARD_LOWER_WRAP_LENGTH, row.maxLines),
  }));
}

function calculateProjectDashboardLowerPanelHeight(rows: ProjectDashboardRenderedLowerRow[], maxHeight: number) {
  const contentHeight = rows.reduce((height, row, index) => {
    const gap = index === rows.length - 1 ? 0 : PROJECT_DASHBOARD_LOWER_ROW_GAP;
    return height + countTextLines(row.text) * PROJECT_DASHBOARD_LOWER_ROW_LINE_HEIGHT + gap;
  }, 0);

  const desiredHeight = contentHeight
    + PROJECT_DASHBOARD_LOWER_ROW_START_Y
    - PROJECT_DASHBOARD_LOWER_PANEL_Y
    + PROJECT_DASHBOARD_LOWER_PANEL_PADDING;

  return Math.min(desiredHeight, maxHeight);
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
