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

    if (this.state.viewMode === "detail") {
      this.updateDetailInput(input);
      return;
    }

    this.updateWorkspaceInput(input);
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

    if (input.upPressed) this.moveProjectSelection(-1);
    if (input.downPressed) this.moveProjectSelection(1);

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

      const workspace = this.state.workspaces[project.id];
      if (!workspace) return;

      this.state.selectedWorkspaceSectionIndex = clamp(
        this.state.selectedWorkspaceSectionIndex,
        0,
        workspace.sections.length - 1,
      );
      this.state.viewMode = "workspace";
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

      this.state.lastPlaceholderAction = {
        projectId: project.id,
        actionLabel: section.label,
        status: "placeholder",
        workspaceSectionId: section.id,
      };
      console.info("Project workspace placeholder action", this.state.lastPlaceholderAction);
      this.view.render(this.state);
    }
  }

  private moveProjectSelection(delta: number) {
    const nextIndex = clamp(this.state.selectedProjectIndex + delta, 0, this.state.projects.length - 1);
    if (nextIndex === this.state.selectedProjectIndex) return;

    this.state.selectedProjectIndex = nextIndex;
    this.state.selectedProjectId = this.state.projects[nextIndex]?.id ?? "";
    this.state.selectedWorkspaceSectionIndex = 0;
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

  private getSelectedProject() {
    return this.state.projects[this.state.selectedProjectIndex];
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}