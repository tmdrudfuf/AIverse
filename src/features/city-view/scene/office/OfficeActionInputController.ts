import type { PhaserScene } from "../shared/phaserTypes";

const ACTION_KEY_CODE = "Space";
const ESCAPE_KEY_CODE = "Escape";
const UP_KEY_CODE = "ArrowUp";
const DOWN_KEY_CODE = "ArrowDown";
const ENTER_KEY_CODE = "Enter";
// Distinct from ACTION_KEY_CODE: candidate detail inspection must not shadow
// the existing Space-driven promotion decision cycle or Active Work opening.
const OPEN_CANDIDATE_DETAIL_KEY_CODE = "KeyC";
const APPROVE_CANDIDATE_DETAIL_KEY_CODE = "KeyA";
const DEFER_CANDIDATE_DETAIL_KEY_CODE = "KeyD";
// R is reserved for reviewer runtime, so reject uses a detail-only key that
// does not overlap existing Project Dashboard or agent workflow controls.
const REJECT_CANDIDATE_DETAIL_KEY_CODE = "KeyJ";
// Deliberately distinct from ENTER_KEY_CODE/ACTION_KEY_CODE: this is the one
// and only input that can request a Claude Implementer Runtime start, and it
// must never be satisfied by the same keypress that advances the existing
// Plan -> Readiness -> Approval -> Preflight -> Runtime Start cascade.
const START_IMPLEMENTER_KEY_CODE = "KeyI";
// Distinct from START_IMPLEMENTER_KEY_CODE: this is the one and only input
// that can request a Codex Reviewer Runtime start, gated separately so a
// Start-Implementer keypress can never also be read as Start-Reviewer.
const START_REVIEWER_KEY_CODE = "KeyR";
// Distinct from START_IMPLEMENTER_KEY_CODE/START_REVIEWER_KEY_CODE: this is
// the one and only input that can record a Review Promotion, and it must
// never share a keypress with any existing pipeline-action key.
const PROMOTE_REVIEW_KEY_CODE = "KeyP";
// Distinct from promotion and runtime keys: this records a human request for
// fixes after a concrete ChangesRequested review, without starting fixes.
const REQUEST_REVIEW_FIX_KEY_CODE = "KeyF";
// Distinct from Request Review Fix: this records a provider-neutral plan for
// already-requested fixes, without starting fixes, Validation Runtime, or
// either agent.
const PLAN_REVIEW_FIX_KEY_CODE = "KeyG";
// Distinct from Plan Review Fix: this explicitly starts the bounded Review
// Fix Runtime for the current plan. It must never share a keypress with any
// prior review/request/plan transition.
const START_REVIEW_FIX_RUNTIME_KEY_CODE = "KeyX";
// Distinct from every review-fix key: this is the one explicit human input
// that can start Validation Runtime for a completed Review Fix Runtime.
const START_VALIDATION_RUNTIME_KEY_CODE = "KeyV";
// Distinct from Validation Runtime: prepares the post-validation review
// target only. It must never start the reviewer.
const PREPARE_POST_VALIDATION_REVIEW_TARGET_KEY_CODE = "KeyY";
// Distinct from target preparation: starts the independent re-review only
// after a fresh post-validation target exists.
const START_POST_VALIDATION_REVIEW_KEY_CODE = "KeyU";

export class OfficeActionInputController {
  private pendingAction = false;
  private pendingEscape = false;
  private pendingUp = false;
  private pendingDown = false;
  private pendingEnter = false;
  private pendingOpenCandidateDetail = false;
  private pendingApproveCandidateDetail = false;
  private pendingDeferCandidateDetail = false;
  private pendingRejectCandidateDetail = false;
  private pendingStartImplementer = false;
  private pendingStartReviewer = false;
  private pendingPromoteReview = false;
  private pendingRequestReviewFix = false;
  private pendingPlanReviewFix = false;
  private pendingStartReviewFixRuntime = false;
  private pendingStartValidationRuntime = false;
  private pendingPreparePostValidationReviewTarget = false;
  private pendingStartPostValidationReview = false;
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

    if (event.code === OPEN_CANDIDATE_DETAIL_KEY_CODE) {
      event.preventDefault();
      this.pendingOpenCandidateDetail = true;
      return;
    }

    if (event.code === APPROVE_CANDIDATE_DETAIL_KEY_CODE) {
      event.preventDefault();
      this.pendingApproveCandidateDetail = true;
      return;
    }

    if (event.code === DEFER_CANDIDATE_DETAIL_KEY_CODE) {
      event.preventDefault();
      this.pendingDeferCandidateDetail = true;
      return;
    }

    if (event.code === REJECT_CANDIDATE_DETAIL_KEY_CODE) {
      event.preventDefault();
      this.pendingRejectCandidateDetail = true;
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
      return;
    }

    if (event.code === PROMOTE_REVIEW_KEY_CODE) {
      event.preventDefault();
      this.pendingPromoteReview = true;
      return;
    }

    if (event.code === REQUEST_REVIEW_FIX_KEY_CODE) {
      event.preventDefault();
      this.pendingRequestReviewFix = true;
      return;
    }

    if (event.code === PLAN_REVIEW_FIX_KEY_CODE) {
      event.preventDefault();
      this.pendingPlanReviewFix = true;
      return;
    }

    if (event.code === START_REVIEW_FIX_RUNTIME_KEY_CODE) {
      event.preventDefault();
      this.pendingStartReviewFixRuntime = true;
      return;
    }

    if (event.code === START_VALIDATION_RUNTIME_KEY_CODE) {
      event.preventDefault();
      this.pendingStartValidationRuntime = true;
      return;
    }

    if (event.code === PREPARE_POST_VALIDATION_REVIEW_TARGET_KEY_CODE) {
      event.preventDefault();
      this.pendingPreparePostValidationReviewTarget = true;
      return;
    }

    if (event.code === START_POST_VALIDATION_REVIEW_KEY_CODE) {
      event.preventDefault();
      this.pendingStartPostValidationReview = true;
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

  consumeOpenCandidateDetailPressed() {
    const pressed = this.pendingOpenCandidateDetail;
    this.pendingOpenCandidateDetail = false;
    return pressed;
  }

  consumeApproveCandidateDetailPressed() {
    const pressed = this.pendingApproveCandidateDetail;
    this.pendingApproveCandidateDetail = false;
    return pressed;
  }

  consumeDeferCandidateDetailPressed() {
    const pressed = this.pendingDeferCandidateDetail;
    this.pendingDeferCandidateDetail = false;
    return pressed;
  }

  consumeRejectCandidateDetailPressed() {
    const pressed = this.pendingRejectCandidateDetail;
    this.pendingRejectCandidateDetail = false;
    return pressed;
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

  consumePromoteReviewPressed() {
    const promoteReviewPressed = this.pendingPromoteReview;
    this.pendingPromoteReview = false;
    return promoteReviewPressed;
  }

  consumeRequestReviewFixPressed() {
    const requestReviewFixPressed = this.pendingRequestReviewFix;
    this.pendingRequestReviewFix = false;
    return requestReviewFixPressed;
  }

  consumePlanReviewFixPressed() {
    const planReviewFixPressed = this.pendingPlanReviewFix;
    this.pendingPlanReviewFix = false;
    return planReviewFixPressed;
  }

  consumeStartReviewFixRuntimePressed() {
    const startReviewFixRuntimePressed = this.pendingStartReviewFixRuntime;
    this.pendingStartReviewFixRuntime = false;
    return startReviewFixRuntimePressed;
  }

  consumeStartValidationRuntimePressed() {
    const startValidationRuntimePressed = this.pendingStartValidationRuntime;
    this.pendingStartValidationRuntime = false;
    return startValidationRuntimePressed;
  }

  consumePreparePostValidationReviewTargetPressed() {
    const pressed = this.pendingPreparePostValidationReviewTarget;
    this.pendingPreparePostValidationReviewTarget = false;
    return pressed;
  }

  consumeStartPostValidationReviewPressed() {
    const pressed = this.pendingStartPostValidationReview;
    this.pendingStartPostValidationReview = false;
    return pressed;
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
    this.pendingOpenCandidateDetail = false;
    this.pendingApproveCandidateDetail = false;
    this.pendingDeferCandidateDetail = false;
    this.pendingRejectCandidateDetail = false;
    this.pendingStartImplementer = false;
    this.pendingStartReviewer = false;
    this.pendingPromoteReview = false;
    this.pendingRequestReviewFix = false;
    this.pendingPlanReviewFix = false;
    this.pendingStartReviewFixRuntime = false;
    this.pendingStartValidationRuntime = false;
    this.pendingPreparePostValidationReviewTarget = false;
    this.pendingStartPostValidationReview = false;
  }
}
