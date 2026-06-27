import type { PhaserScene } from "../shared/phaserTypes";
import type { GitHubRepositorySummary } from "./github/GitHubRepositoryTypes";
import type { ProjectPortalProject, ProjectPortalState } from "./OfficeProjectPortalTypes";
import type { ProjectTask } from "./tasks/ProjectTaskTypes";

const OVERLAY_DEPTH = 3000;

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
    panel.fillStyle(0xf8fafc, 1);
    panel.fillRoundedRect(this.panelX, this.panelY, this.panelWidth, this.panelHeight, 8);
    panel.lineStyle(2, 0x253247, 1);
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
    this.addText(this.panelX + 28, this.panelY + 24, "Project Portal", titleStyle());
    this.addText(this.panelX + 28, this.panelY + 78, "Projects", headingStyle());

    state.projects.forEach((project, index) => {
      const rowY = this.panelY + 112 + index * 38;
      const marker = index === state.selectedProjectIndex ? ">" : " ";
      const statusColumn = project.status.padEnd(11, " ");
      this.addText(
        this.panelX + 44,
        rowY,
        `${marker} ${project.name.padEnd(14, " ")} ${statusColumn}`,
        rowStyle(project.enabled, index === state.selectedProjectIndex),
      );
    });

    this.addText(this.panelX + 28, this.panelY + 252, "Linked Services", headingStyle());
    state.services.forEach((service, index) => {
      const rowY = this.panelY + 286 + index * 26;
      this.addText(this.panelX + 44, rowY, `${service.label}  -  ${service.status}`, rowStyle(service.enabled, false));
    });

    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Up/Down select  Enter/Space open  Esc close", instructionStyle()).setOrigin(1, 0.5);
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
      this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
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
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back", instructionStyle()).setOrigin(1, 0.5);
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
    this.addText(this.panelX + 28, this.panelY + 134, `Assigned: ${task.assignee ?? "None"}`, bodyStyle());
    this.addText(this.panelX + 28, this.panelY + 162, `Estimated Hours: ${task.estimatedHours ?? "None"}`, bodyStyle());

    this.addText(this.panelX + 28, this.panelY + 208, "Description:", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 238, wrapText(task.description, 70), bodyStyle());

    this.addText(this.panelX + 28, this.panelY + 304, "Next Action:", headingStyle());
    this.addText(this.panelX + 44, this.panelY + 334, "Assign Employee (placeholder)", rowStyle(true, false));

    const actionText = getLastTaskActionText(state, task);
    if (actionText) this.addText(this.panelX + 44, this.panelY + 366, actionText, mutedStyle());

    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Enter/Space action", instructionStyle()).setOrigin(1, 0.5);
  }

  private addText(x: number, y: number, text: string, style: Phaser.Types.GameObjects.Text.TextStyle) {
    const textObject = this.scene.add.text(x, y, text, style);
    this.content.add(textObject);
    return textObject;
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

function getLastTaskActionText(state: ProjectPortalState, task: ProjectTask) {
  if (state.lastTaskPlaceholderAction?.taskId !== task.id) return undefined;
  return `Placeholder action recorded: ${state.lastTaskPlaceholderAction.actionLabel}`;
}

function getSelectedTask(state: ProjectPortalState) {
  const project = state.projects[state.selectedProjectIndex];
  const projectId = state.selectedTaskProjectId ?? project?.id;
  const collection = projectId ? state.taskCollections[projectId] : undefined;
  return collection?.tasks[state.selectedTaskIndex];
}

function wrapText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length > maxLength) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) lines.push(currentLine);
  return lines.join("\n");
}

function titleStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#253247",
    fontFamily: "Arial, sans-serif",
    fontSize: "28px",
    fontStyle: "700",
  };
}

function headingStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
    fontSize: "18px",
    fontStyle: "700",
  };
}

function bodyStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#334155",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
    lineSpacing: 4,
  };
}

function rowStyle(enabled: boolean, selected: boolean): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    backgroundColor: selected ? "rgba(37, 50, 71, 0.12)" : undefined,
    color: selected ? "#0f172a" : enabled ? "#1f2937" : "#64748b",
    fontFamily: "Courier New, monospace",
    fontSize: "16px",
    fontStyle: selected ? "700" : "400",
    padding: selected ? { x: 8, y: 3 } : undefined,
  };
}

function mutedStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#64748b",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
  };
}

function instructionStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#475569",
    fontFamily: "Arial, sans-serif",
    fontSize: "15px",
  };
}