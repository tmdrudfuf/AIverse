import type { PhaserScene } from "../shared/phaserTypes";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";

export type OfficeProjectPortalInput = {
  actionPressed: boolean;
  escapePressed: boolean;
  upPressed: boolean;
  downPressed: boolean;
  enterPressed: boolean;
};

export class OfficeProjectPortalController {
  private readonly state: ProjectPortalState;
  private readonly view: OfficeProjectPortalView;

  constructor(scene: PhaserScene) {
    this.state = createProjectPortalState();
    this.view = new OfficeProjectPortalView(scene, this.state);
  }

  open() {
    if (this.state.isOpen) return;

    this.state.isOpen = true;
    this.state.justOpened = true;
    this.state.viewMode = "list";
    this.state.selectedProjectIndex = clamp(this.state.selectedProjectIndex, 0, this.state.projects.length - 1);
    this.state.selectedProjectId = this.state.projects[this.state.selectedProjectIndex]?.id ?? "";
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

    this.updateDetailInput(input);
  }

  isOpen() {
    return this.state.isOpen;
  }

  close() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.justOpened = false;
    this.state.viewMode = "list";
    this.view.hide();
  }

  destroy() {
    this.view.destroy();
    this.state.isOpen = false;
    this.state.justOpened = false;
  }

  private updateListInput(input: OfficeProjectPortalInput) {
    if (input.escapePressed) {
      this.close();
      return;
    }

    if (input.upPressed) this.moveSelection(-1);
    if (input.downPressed) this.moveSelection(1);

    if (input.actionPressed || input.enterPressed) {
      this.state.viewMode = "detail";
      this.view.render(this.state);
    }
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

      this.state.lastPlaceholderAction = {
        projectId: project.id,
        actionLabel: project.nextAction.label,
        status: "placeholder",
      };
      console.info("Project portal placeholder action", this.state.lastPlaceholderAction);
      this.view.render(this.state);
    }
  }

  private moveSelection(delta: number) {
    const nextIndex = clamp(this.state.selectedProjectIndex + delta, 0, this.state.projects.length - 1);
    if (nextIndex === this.state.selectedProjectIndex) return;

    this.state.selectedProjectIndex = nextIndex;
    this.state.selectedProjectId = this.state.projects[nextIndex]?.id ?? "";
    this.view.render(this.state);
  }

  private getSelectedProject() {
    return this.state.projects[this.state.selectedProjectIndex];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}