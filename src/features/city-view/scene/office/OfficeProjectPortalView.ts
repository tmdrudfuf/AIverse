import type { PhaserScene } from "../shared/phaserTypes";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";

const OVERLAY_DEPTH = 3000;

export class OfficeProjectPortalView {
  private readonly container: Phaser.GameObjects.Container;

  constructor(scene: PhaserScene, state: ProjectPortalState) {
    const width = scene.scale.width;
    const height = scene.scale.height;
    const panelWidth = Math.min(680, width - 64);
    const panelHeight = Math.min(430, height - 64);
    const panelX = Math.max(32, (width - panelWidth) / 2);
    const panelY = Math.max(32, (height - panelHeight) / 2);

    const shade = scene.add.rectangle(0, 0, width, height, 0x0f172a, 0.68).setOrigin(0, 0);
    const panel = scene.add.graphics();
    panel.fillStyle(0xf8fafc, 1);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);
    panel.lineStyle(2, 0x253247, 1);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 8);

    const title = scene.add.text(panelX + 28, panelY + 24, "Project Portal", {
      color: "#253247",
      fontFamily: "Arial, sans-serif",
      fontSize: "28px",
      fontStyle: "700",
    });

    const projectsHeading = scene.add.text(panelX + 28, panelY + 78, "Projects", headingStyle());
    const projectRows = state.projects.map((project, index) => {
      const rowY = panelY + 112 + index * 34;
      return scene.add.text(panelX + 44, rowY, `${project.name}  -  ${project.status}`, rowStyle(project.enabled));
    });

    const servicesHeading = scene.add.text(panelX + 28, panelY + 232, "Linked Services", headingStyle());
    const serviceRows = state.services.map((service, index) => {
      const rowY = panelY + 266 + index * 30;
      return scene.add.text(panelX + 44, rowY, `${service.label}  -  ${service.status}`, rowStyle(service.enabled));
    });

    const instructions = scene.add
      .text(panelX + panelWidth - 28, panelY + panelHeight - 34, "Esc / Space to close", {
        color: "#475569",
        fontFamily: "Arial, sans-serif",
        fontSize: "15px",
      })
      .setOrigin(1, 0.5);

    this.container = scene.add.container(0, 0, [
      shade,
      panel,
      title,
      projectsHeading,
      ...projectRows,
      servicesHeading,
      ...serviceRows,
      instructions,
    ]);
    this.container.setScrollFactor(0);
    this.container.setDepth(OVERLAY_DEPTH);
    this.container.setVisible(false);
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
}

function headingStyle(): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: "#0f172a",
    fontFamily: "Arial, sans-serif",
    fontSize: "18px",
    fontStyle: "700",
  };
}

function rowStyle(enabled: boolean): Phaser.Types.GameObjects.Text.TextStyle {
  return {
    color: enabled ? "#1f2937" : "#64748b",
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
  };
}