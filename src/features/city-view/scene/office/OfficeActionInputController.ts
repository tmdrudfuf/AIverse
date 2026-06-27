import type { PhaserScene } from "../shared/phaserTypes";

const ACTION_KEY_CODE = "Space";

export class OfficeActionInputController {
  private pendingAction = false;
  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (event.code !== ACTION_KEY_CODE) return;

    event.preventDefault();
    this.pendingAction = true;
  };

  setup(scene: PhaserScene) {
    scene.input.keyboard?.addCapture("SPACE");
    window.addEventListener("keydown", this.handleKeyDown);
  }

  consumeActionPressed() {
    const actionPressed = this.pendingAction;
    this.pendingAction = false;
    return actionPressed;
  }

  destroy(scene: PhaserScene) {
    window.removeEventListener("keydown", this.handleKeyDown);
    scene.input.keyboard?.removeCapture("SPACE");
    this.pendingAction = false;
  }
}
