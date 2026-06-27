import type { PhaserScene } from "../shared/phaserTypes";
import type { ProjectPortalProject, ProjectPortalState } from "./OfficeProjectPortalTypes";

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

    this.addText(this.panelX + 28, this.panelY + 354, "Workspace sections are placeholders only.", mutedStyle());
    this.addText(this.panelX + this.panelWidth - 28, this.panelY + this.panelHeight - 34, "Esc back  Up/Down select", instructionStyle()).setOrigin(1, 0.5);
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