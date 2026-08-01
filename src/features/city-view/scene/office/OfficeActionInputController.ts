import type { PhaserScene } from "../shared/phaserTypes";

const ACTION_KEY_CODE = "Space";
const ESCAPE_KEY_CODE = "Escape";
const UP_KEY_CODE = "ArrowUp";
const DOWN_KEY_CODE = "ArrowDown";
const ENTER_KEY_CODE = "Enter";
// Deliberately distinct from ENTER_KEY_CODE/ACTION_KEY_CODE: this is the one
// and only input that can request a Claude Implementer Runtime start, and it
// must never be satisfied by the same keypress that advances the existing
// Plan -> Readiness -> Approval -> Preflight -> Runtime Start cascade.
const START_IMPLEMENTER_KEY_CODE = "KeyI";
// Distinct from START_IMPLEMENTER_KEY_CODE: this is the one and only input
// that can request a Codex Reviewer Runtime start, gated separately so a
// Start-Implementer keypress can never also be read as Start-Reviewer.
const START_REVIEWER_KEY_CODE = "KeyR";

export class OfficeActionInputController {
  private pendingAction = false;
  private pendingEscape = false;
  private pendingUp = false;
  private pendingDown = false;
  private pendingEnter = false;
  private pendingStartImplementer = false;
  private pendingStartReviewer = false;
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
      return;
    }

    if (event.code === UP_KEY_CODE) {
      event.preventDefault();
      this.pendingUp = true;
      return;
    }

    if (event.code === DOWN_KEY_CODE) {
      event.preventDefault();
      this.pendingDown = true;
      return;
    }

    if (event.code === ENTER_KEY_CODE) {
      event.preventDefault();
      this.pendingEnter = true;
      return;
    }

    if (event.code === START_IMPLEMENTER_KEY_CODE) {
      event.preventDefault();
      this.pendingStartImplementer = true;
      return;
    }

    if (event.code === START_REVIEWER_KEY_CODE) {
      event.preventDefault();
      this.pendingStartReviewer = true;
    }
  };

  setup(scene: PhaserScene) {
    scene.input.keyboard?.addCapture("SPACE");
    scene.input.keyboard?.addCapture("ESC");
    scene.input.keyboard?.addCapture("UP");
    scene.input.keyboard?.addCapture("DOWN");
    scene.input.keyboard?.addCapture("ENTER");
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

  consumeUpPressed() {
    const upPressed = this.pendingUp;
    this.pendingUp = false;
    return upPressed;
  }

  consumeDownPressed() {
    const downPressed = this.pendingDown;
    this.pendingDown = false;
    return downPressed;
  }

  consumeEnterPressed() {
    const enterPressed = this.pendingEnter;
    this.pendingEnter = false;
    return enterPressed;
  }

  consumeStartImplementerPressed() {
    const startImplementerPressed = this.pendingStartImplementer;
    this.pendingStartImplementer = false;
    return startImplementerPressed;
  }

  consumeStartReviewerPressed() {
    const startReviewerPressed = this.pendingStartReviewer;
    this.pendingStartReviewer = false;
    return startReviewerPressed;
  }

  destroy(scene: PhaserScene) {
    window.removeEventListener("keydown", this.handleKeyDown);
    scene.input.keyboard?.removeCapture("SPACE");
    scene.input.keyboard?.removeCapture("ESC");
    scene.input.keyboard?.removeCapture("UP");
    scene.input.keyboard?.removeCapture("DOWN");
    scene.input.keyboard?.removeCapture("ENTER");
    this.pendingAction = false;
    this.pendingEscape = false;
    this.pendingUp = false;
    this.pendingDown = false;
    this.pendingEnter = false;
    this.pendingStartImplementer = false;
    this.pendingStartReviewer = false;
  }
}