import type { PhaserScene } from "../shared/phaserTypes";
import { createProjectPortalState } from "./OfficeProjectPortalRegistry";
import type { ProjectPortalState } from "./OfficeProjectPortalTypes";
import { OfficeProjectPortalView } from "./OfficeProjectPortalView";

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
    this.view.show();
  }

  updateInput(actionPressed: boolean, escapePressed: boolean) {
    if (!this.state.isOpen) return;

    if (this.state.justOpened) {
      this.state.justOpened = false;
      return;
    }

    if (actionPressed || escapePressed) this.close();
  }

  isOpen() {
    return this.state.isOpen;
  }

  close() {
    if (!this.state.isOpen) return;

    this.state.isOpen = false;
    this.state.justOpened = false;
    this.view.hide();
  }

  destroy() {
    this.view.destroy();
    this.state.isOpen = false;
    this.state.justOpened = false;
  }
}