import type { PhaserScene } from "../shared/phaserTypes";

const ACTION_KEY_CODE = "Space";
const ESCAPE_KEY_CODE = "Escape";

export class OfficeActionInputController {
  private pendingAction = false;
  private pendingEscape = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;

    if (event.code === ACTION_KEY_CODE) {
      event.preventDefault();
      this.pendingAction = true;
      return;
    }

    if (event.code === ESCAPE_KEY_CODE) {
      event.preventDefault();
      this.pendingEscape = true;
    }
  };

  setup(scene: PhaserScene) {
    scene.input.keyboard?.addCapture("SPACE");
    scene.input.keyboard?.addCapture("ESC");
    window.addEventListener("keydown", this.handleKeyDown);
  }

  consumeActionPressed() {
    const actionPressed = this.pendingAction;
    this.pendingAction = false;
    return actionPressed;
  }

  consumeEscapePressed() {
    const escapePressed = this.pendingEscape;
    this.pendingEscape = false;
    return escapePressed;
  }

  destroy(scene: PhaserScene) {
    window.removeEventListener("keydown", this.handleKeyDown);
    scene.input.keyboard?.removeCapture("SPACE");
    scene.input.keyboard?.removeCapture("ESC");
    this.pendingAction = false;
    this.pendingEscape = false;
  }
}